import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Thread } from 'src/thread/entities/thread.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateMessageDto } from './dto/message.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { PaginatedMessagesDto } from './dto/paginated-messages.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Thread)
    private readonly threadRepository: Repository<Thread>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const { threadId, senderId, content } = createMessageDto;

    const thread = await this.threadRepository.findOne({
      where: { id: threadId },
      relations: ['lastMessage'],
    });

    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const message = this.messageRepository.create({
      thread,
      sender,
      content,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update the lastMessage in the thread
    thread.lastMessage = savedMessage;
    await this.threadRepository.save(thread);

    // Compter les messages non lus dans ce thread
    const unreadCount = await this.messageRepository.count({
      where: { thread: { id: threadId }, isRead: false },
    });

    return Object.assign(savedMessage, { unreadCount });
    // return savedMessage;
  }

  async findAllMessages(
    threadId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedMessagesDto> {
    const { page, limit } = paginationQuery;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { thread: { id: threadId } },
      relations: ['sender', 'thread'],
      order: { createdAt: 'DESC' }, // Changer de ASC à DESC pour obtenir les messages les plus récents en premier
      take: limit,
      skip: (page - 1) * limit,
    });

    const items = messages.map((message) => {
      const { password, ...senderData } = message.sender;

      return {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        isRead: message.isRead,
        sender: senderData,
      };
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async markAsRead(threadId: string): Promise<Message[]> {
    const messages = await this.messageRepository.find({
      where: { thread: { id: threadId }, isRead: false },
      relations: ['sender', 'thread'],
    });

    if (messages.length === 0) {
      throw new NotFoundException('No unread messages found in this thread');
    }

    // Marquer tous les messages comme lus
    messages.forEach((msg) => {
      msg.isRead = true;
    });

    // Sauvegarder les modifications pour tous les messages
    return this.messageRepository.save(messages);
  }

  async getParticipantIds(threadId: string): Promise<any[]> {
    // Récupérer le thread et ses participants
    const thread = await this.threadRepository.findOne({
      where: { id: threadId },
      relations: ['participant1', 'participant2'],
    });
  
    if (!thread) {
      throw new Error('Thread not found');
    }
  
    return [thread.participant1.id, thread.participant2.id];
  }
}
