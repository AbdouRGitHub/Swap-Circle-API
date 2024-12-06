import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PushNotification } from './entities/push-notification.entity';
import { Repository } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private expo: Expo;
  constructor(
    @InjectRepository(PushNotification)
    private pushNotificationRepository: Repository<PushNotification>,
    private authService: AuthService,
  ) {
    this.expo = new Expo({ useFcmV1: true });
  }

  async createToken(token: string, request) {
    const user = await this.authService.getUserFromRequest(request);

    // Vérifier si un enregistrement existe déjà
    const existingNotification = await this.pushNotificationRepository.findOne({
      where: {
        notificationToken: token,
        user: { id: user.id }, // Assurez-vous que la relation avec `user` est correctement définie
      },
    });

    if (existingNotification) {
      console.log('Notification token already exists for this user.');
      return existingNotification.notificationToken; // Retourne le token existant
    }

    // Créer un nouvel enregistrement si aucun n'existe
    const pushNotification = this.pushNotificationRepository.create({
      notificationToken: token,
      user,
    });
    await this.pushNotificationRepository.save(pushNotification);
    return token;
  }

  async removeToken(token: string, request) {
    const user = await this.authService.getUserFromRequest(request);
    await this.pushNotificationRepository.delete({
      notificationToken: token,
      user,
    });
  }

  async sendPushNotification(tokens: string[], title: string, body: string) {
    const messages: ExpoPushMessage[] = [];
    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        this.logger.warn(`Token invalide : ${token}`);
        continue;
      }

      messages.push({
        to: token,
        sound: 'default',
        title,
        body,
      });
    }

    if (messages.length === 0) {
      this.logger.warn('Aucune notification à envoyer (tokens invalides).');
      return;
    }
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets = [];
    for (const chunk of chunks) {
      try {
        const ticketChunk: ExpoPushTicket[] =
          await this.expo.sendPushNotificationsAsync(chunk);
        this.logger.log(`Tickets envoyés : ${JSON.stringify(tickets)}`);
        tickets.push(...ticketChunk);
      } catch (error) {
        this.logger.error("Erreur lors de l'envoi des notifications", error);
      }
    }
    return tickets;
  }

  async findAllTokensByUserId(userId: number): Promise<PushNotification[]> {
    return await this.pushNotificationRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  async sendReminder(borrowerId: number, title: string, message: string) {
    const borrowerTokens = await this.findAllTokensByUserId(borrowerId);
    const tokens = borrowerTokens.map(
      (pushNotification) => pushNotification.notificationToken,
    );

    return this.sendPushNotification(tokens, title, message);
  }
}
