import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Friend, friendStatus } from './entities/friend.entity';
import { In, Like, Not, Repository } from 'typeorm';
import { SearchFriendDto } from './dto/search.dto';
import { PushNotificationService } from 'src/push-notification/push-notification.service';

@Injectable()
export class FriendService {
  constructor(
    private authService: AuthService,
    private pushNotificationService: PushNotificationService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
  ) {}

  async search(searchFriendDto: SearchFriendDto, request) {
    const user = await this.authService.getUserFromRequest(request);

    const searchField = searchFriendDto.searchField.replaceAll(' ', '%');

    const friends = await this.friendRepository.find({
      where: [
        { Account_One: { id: user.id } },
        { Account_Two: { id: user.id } },
      ],
      relations: ['Account_One', 'Account_Two'],
    });

    const friendIds = friends.map((friend) => {
      return friend.Account_One.id === user.id
        ? friend.Account_Two.id
        : friend.Account_One.id;
    });

    const page = searchFriendDto.page || 1;
    const limit = searchFriendDto.limit || 10;

    const skip = (page - 1) * limit;

    const searchResult = await this.userRepository.findAndCount({
      where: {
        username: Like(`%${searchField}%`),
        id: Not(In([user.id, ...friendIds])),
      },
      skip: skip,
      take: limit,
    });

    return await searchResult;
  }

  async sendRequest(Account_TwoId: string, request) {
    const user = await this.authService.getUserFromRequest(request);

    const Account_Two = await this.userRepository.findOne({
      where: {
        id: +Account_TwoId,
      },
      relations: ['pushNotifications'],
    });

    if (!Account_Two) {
      throw new NotFoundException(`Reciever #${Account_TwoId} not found`);
    }

    // Vérifiez si une relation d'amitié existe déjà
    const existingRequest = await this.friendRepository.findOne({
      where: [
        { Account_One: { id: user.id }, Account_Two: { id: +Account_TwoId } },
        { Account_One: { id: +Account_TwoId }, Account_Two: { id: user.id } },
      ],
    });

    if (existingRequest) {
      throw new UnauthorizedException('Friend request already sent');
    }

    const check = await this.checkStatus(Account_TwoId, request);

    if (check.status === 'friend') {
      throw new UnauthorizedException('friend');
    }

    if (check.status === 'initiator') {
      throw new UnauthorizedException('initator');
    }

    if (check.status === 'receiver') {
      throw new UnauthorizedException('receiver');
    }

    if (check.status === 'none') {
      const friend = this.friendRepository.create({
        Account_One: user,
        Account_Two: Account_Two,
      });

      await this.pushNotificationService.sendPushNotification(
        Account_Two.pushNotifications.map(
          (pushNotification) => pushNotification.notificationToken,
        ),
        "Demande d'ami",
        `${user.username} vous a envoyé une demande d'ami`,
      );
      return await this.friendRepository.save(friend);
    }
  }

  async friendList(request) {
    const user = await this.authService.getUserFromRequest(request);

    const friends = await this.friendRepository.find({
      where: [
        { Account_One: { id: user.id }, statut: friendStatus.accepted },
        { Account_Two: { id: user.id }, statut: friendStatus.accepted },
      ],
      relations: ['Account_Two', 'Account_One'],
    });

    const friendList = await friends.map((friend) => {
      if (friend.Account_One.id === user.id) {
        return friend.Account_Two;
      } else {
        return friend.Account_One;
      }
    });

    return friendList;
  }

  async friendRequestList(request) {
    const user = await this.authService.getUserFromRequest(request);

    return await this.friendRepository.find({
      where: [{ Account_Two: { id: user.id }, statut: friendStatus.InProgess }],
      relations: ['Account_One'],
    });
  }

  async acceptedRequest(requestId: string, request) {
    const user = await this.authService.getUserFromRequest(request);

    const friendRequest = await this.friendRepository.findOne({
      where: {
        id: requestId,
      },
      relations: ['Account_One', 'Account_Two'],
    });

    if (!friendRequest) {
      throw new UnauthorizedException("Unauthorized: You don't have the right");
    }

    if (friendRequest.Account_Two.id != user.id && user.role != 'ADMIN') {
      throw new UnauthorizedException("Unauthorized: You don't have the right");
    }

    friendRequest.statut = friendStatus.accepted;
    const friendsPushNotifications =
      await this.pushNotificationService.findAllTokensByUserId(
        friendRequest.Account_One.id,
      );

    await this.pushNotificationService.sendPushNotification(
      friendsPushNotifications.map(
        (pushNotification) => pushNotification.notificationToken,
      ),
      "Demande d'ami acceptée",
      `${friendRequest.Account_One.username} a accepté votre demande d'ami`,
    );
    return await this.friendRepository.save(friendRequest);
  }

  async refuseFriendRequest(requestId: string, request) {
    const user = await this.authService.getUserFromRequest(request);

    const friendRequest = await this.friendRepository.findOne({
      where: {
        id: requestId,
      },
      relations: ['Account_Two', 'Account_One'],
    });

    if (!friendRequest) {
      throw new NotFoundException(`friend request #${requestId} not found`);
    }

    if (
      friendRequest.Account_One.id != user.id &&
      friendRequest.Account_Two.id != user.id &&
      user.role != 'ADMIN'
    ) {
      throw new UnauthorizedException('You are not the owner of this loan');
    }

    return await this.friendRepository.remove(friendRequest);
  }

  async checkStatus(friendId: string, request) {
    const user = await this.authService.getUserFromRequest(request);

    const friend = await this.friendRepository.findOne({
      where: [
        { Account_One: { id: +friendId }, Account_Two: { id: user.id } },
        { Account_Two: { id: +friendId }, Account_One: { id: user.id } },
      ],
      relations: ['Account_One', 'Account_Two'],
    });

    if (!friend) {
      return { status: 'none' };
    }

    if (
      friend.Account_One.id === user.id &&
      friend.statut === friendStatus.accepted
    ) {
      return { status: 'friend' };
    }

    if (
      friend.Account_Two.id === user.id &&
      friend.statut === friendStatus.accepted
    ) {
      return { status: 'friend' };
    }

    if (
      friend.Account_One.id === user.id &&
      friend.statut === friendStatus.InProgess
    ) {
      return { status: 'initiator' };
    }

    if (
      friend.Account_Two.id === user.id &&
      friend.statut === friendStatus.InProgess
    ) {
      return { status: 'receiver' };
    }
  }

  async remove(friendId: string, request) {
    const user = await this.authService.getUserFromRequest(request);

    const friend = await this.friendRepository.findOne({
      where: [
        { Account_Two: { id: +friendId }, statut: friendStatus.accepted },
        { Account_One: { id: +friendId }, statut: friendStatus.accepted },
      ],
      relations: ['Account_One', 'Account_Two'],
    });

    if (!friend) {
      throw new NotFoundException(`friend request #${friendId} not found`);
    }

    if (
      friend.Account_One.id != user.id &&
      friend.Account_Two.id != user.id &&
      user.role != 'ADMIN'
    ) {
      throw new UnauthorizedException('You are not the owner of this account');
    }

    return await this.friendRepository.remove(friend);
  }
}
