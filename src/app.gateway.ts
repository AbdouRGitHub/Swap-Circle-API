import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { LoanRequestService } from './loan-request/loan-request.service';
import { MessageService } from './message/message.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Vous pouvez spécifier un domaine ici pour plus de sécurité
  },
})
@Injectable()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly loanRequestService: LoanRequestService,
    private readonly messageService: MessageService,
  ) { }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinUser')
  async handleJoinUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { userId } = data;
    const room = `user_${userId}`;

    // Vérifier si le client est déjà dans le salon
    if (!client.rooms.has(room)) {
      client.join(room);
      console.log(`Client ${client.id} joined user room ${room}`);
    } else {
      console.log(`Client ${client.id} is already in user room ${room}`);
    }
  }

  // Gestionnaire pour recevoir et traiter une nouvelle demande de prêt
  @SubscribeMessage('new-loan-request')
  async handleRequestReceived(
    @MessageBody() data: any,
    client: Socket,
  ): Promise<void> {
    try {
      const requests =
        await this.loanRequestService.findAllRequestReceived(data);
      client.emit('loan-requests-received', requests);

      // Si nécessaire, émettez à tous les clients
      // this.server.emit('loan-request-updated', requests);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const message = await this.messageService.createMessage(data);

      // Récupérer les IDs des participants au thread
      const participantIds = await this.messageService.getParticipantIds(
        data.threadId,
      );

      // Émettre le message aux salons des utilisateurs concernés
      participantIds.forEach((participantId) => {
        const room = `user_${participantId}`;
        if (this.server.sockets.adapter.rooms.has(room)) {
          this.server.to(room).emit('newMessage', message);
          this.server.to(room).emit('newMessageList', message);
        } else {
          console.log(`User ${participantId} not connected.`);
        }
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
