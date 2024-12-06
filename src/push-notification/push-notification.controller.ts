import { Body, Controller, Delete, Post, Req } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.decorator';
import { CreateNotificationMessageDto } from './dto/message';

@ApiTags('push-notification')
@Controller('push-notification')
export class PushNotificationController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Post()
  createToken(@Body() body: { token: string }, @Req() request) {
    const { token } = body; // Extrait le token de l'objet
    return this.pushNotificationService.createToken(token, request);
  }

  @Post('remove') // Endpoint pour supprimer un token
  async removeToken(@Body() body: { token: string }, @Req() request) {
    const { token } = body; // Extrait le token de l'objet
    return this.pushNotificationService.removeToken(token, request);
  }

  @ApiOperation({
    description: 'Envoie une notification push',
    summary: 'Envoie une notification push',
  })
  @Post('send')
  sendPushNotification(
    @Body() createNotificationMessageDto: CreateNotificationMessageDto,
  ) {
    const { tokens, title, body } = createNotificationMessageDto;
    return this.pushNotificationService.sendPushNotification(
      tokens,
      title,
      body,
    );
  }

  @ApiOperation({
    description: 'Envoie une notification de rappel à un emprunteur',
    summary: 'Notification de rappel',
  })
  @Post('reminder')
  async sendReminder(
    @Body() body: { borrowerId: number; title: string; message: string },
  ) {
    const { borrowerId, title, message } = body;
    return this.pushNotificationService.sendReminder(
      borrowerId,
      title,
      message,
    );
  }
}
