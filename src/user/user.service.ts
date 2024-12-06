import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { UpdateUserDto } from './dto/user.dto';
import { UpdatePasswordDto } from './dto/userPassword.dto';
import { FileService } from 'src/file/file.service';
import * as bcrypt from 'bcrypt';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private authService: AuthService,
    private fileService: FileService,
  ) {}

  async findOne(id: number, request) {
    // const userRequest = await this.authService.getUserFromRequest(request);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id=:id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    // if (user.id != userRequest.id && userRequest.role != 'ADMIN') {
    //   throw new UnauthorizedException('You are not the owner of this user');
    // }

    return user;
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
    request,
  ) {
    const user = await this.authService.getUserFromRequest(request);

    //hachage du mot de passe
    // updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);

    if (file) {
      await this.fileService.uploadProfilePic(file, request);
    }

    // const existingUsername = await this.userRepository.exists({
    //   where: {
    //     username: updateUserDto.username,
    //   },
    // });

    // if (existingUsername) {
    //   throw new ConflictException('Ce pseudo a déjà été utilisé');
    // }

    // const existingEmail = await this.userRepository.exists({
    //   where: {
    //     email: updateUserDto.email,
    //   },
    // });

    // if (existingEmail) {
    //   throw new ConflictException('Ce pseudo a déjà été utilisé');
    // }
    //mise à jour
    const userUpdated = await this.userRepository.preload({
      id: id,
      ...updateUserDto,
    });

    if (!userUpdated) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (user.id != userUpdated.id && user.role != 'ADMIN') {
      throw new UnauthorizedException('You are not the owner of this user');
    }

    return await this.userRepository.save(userUpdated);
  }

  async updatePassword(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
    request,
  ) {
    const user = await this.authService.getUserFromRequest(request);

    //vérification de l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    //vérification de la confirmation du nouveau mot de passe
    if (updatePasswordDto.newPassword != updatePasswordDto.newPasswordConfirm) {
      throw new UnauthorizedException(
        'La confirmation du mot de passe est incorrecte',
      );
    }

    //hachage du nouveau mot de passe
    updatePasswordDto.password = await bcrypt.hash(
      updatePasswordDto.newPassword,
      10,
    );

    //mise à jour
    const userUpdated = await this.userRepository.preload({
      id: id,
      ...updatePasswordDto,
    });

    if (!userUpdated) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (user.id != userUpdated.id && user.role != 'ADMIN') {
      throw new UnauthorizedException('You are not the owner of this user');
    }

    return await this.userRepository.save(userUpdated);
  }

  async remove(id: number, request) {
    const user = await this.authService.getUserFromRequest(request);

    const userDeleted = await this.userRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!userDeleted) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (user.id != userDeleted.id && user.role != 'ADMIN') {
      throw new UnauthorizedException('You are not the owner of this user');
    }

    return await this.userRepository.remove(user);
  }

  async rateUser(id: number, createReviewDto: CreateReviewDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['reviews'],
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    const newReview = this.reviewRepository.create({
      rating: createReviewDto.rating,
      user,
    });
    await this.reviewRepository.save(newReview);

    const totalReviews = user.reviews.length + 1;
    const totalRatings =
      user.reviews.reduce((sum, review) => sum + review.rating, 0) +
      createReviewDto.rating;
    const averageRating = totalRatings / totalReviews;

    user.averageRating = averageRating;
    await this.userRepository.save(user);

    return user;
  }

  async findUserReviews(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['reviews'],
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return user.reviews;
  }

  async getUserReviewStats(recipientId: number) {
    const { averageRating, reviewCount } = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.receivedReviews', 'reviews') // Jointure sur les reviews reçues
      .where('user.id = :recipientId', { recipientId }) // Filtrer par recipientId
      .select('AVG(reviews.rating)', 'averageRating')
      .addSelect('COUNT(reviews.id)', 'reviewCount')
      .getRawOne();

    return {
      averageRating: parseFloat(averageRating).toFixed(2) || 0, // Assurer que la moyenne est un nombre
      reviewCount: parseInt(reviewCount, 10) || 0, // Assurer que le nombre de reviews est un nombre entier
    };
  }

  async getUserReviews(
    recipientId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: recipientId },
      relations: ['receivedReviews'], // Assure que les reviews reçues sont récupérées avec l'utilisateur
    });

    if (!user) {
      throw new NotFoundException(`User #${recipientId} not found`);
    }

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { recipient: { id: recipientId } }, // Filtre par le destinataire des reviews
      take: limit, // Limite les résultats
      skip: (page - 1) * limit, // Ignore les résultats des pages précédentes
      order: { createdAt: 'DESC' }, // Trie par date de création décroissante
      relations: ['user'], // Inclut la relation avec l'utilisateur
      select: {
        user: {
          id: true, // Récupère uniquement l'id de l'utilisateur
          username: true, // Récupère uniquement le username de l'utilisateur
          pfp_filename: true, // Récupère uniquement le nom de fichier du profil de l'utilisateur
        },
      },
    });

    return {
      total, // Nombre total de reviews
      page, // Page actuelle
      limit, // Nombre de reviews par page
      totalPages: Math.ceil(total / limit), // Nombre total de pages
      reviews, // Les reviews paginés
    };
  }
}
