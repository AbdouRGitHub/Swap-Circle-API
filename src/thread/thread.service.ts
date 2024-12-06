import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Thread } from './entities/thread.entity';
import { User } from 'src/user/entities/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { CreateThreadDto } from './dto/thread.dto';
import { Message } from 'src/message/entities/message.entity';
import { Not } from 'typeorm';

@Injectable()
export class ThreadService {
  constructor(
    private authService: AuthService,
    @InjectRepository(Thread)
    private readonly threadRepository: Repository<Thread>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  // Méthode existante pour créer un thread
  async createThread(
    createThreadDto: CreateThreadDto,
    req: Request,
  ): Promise<Thread> {
    const { participant2Username } = createThreadDto;

    const user = await this.authService.getUserFromRequest(req);

    const participant1 = await this.userRepository.findOne({
      where: {
        id: user.id,
      },
    });
    const participant2 = await this.userRepository.findOne({
      where: {
        username: participant2Username,
      },
    });

    if (!participant1 || !participant2) {
      throw new NotFoundException("L'utilisateur n'existe pas");
    }

    // Vérifiez si un thread existe déjà entre ces deux participants
    const existingThread = await this.threadRepository.findOne({
      where: [
        {
          participant1: { id: participant1.id },
          participant2: { id: participant2.id },
        },
        {
          participant1: { id: participant2.id },
          participant2: { id: participant1.id },
        },
      ],
    });

    if (existingThread) {
      return existingThread;
    }

    // Créez un nouveau thread si aucun thread n'existe
    const thread = this.threadRepository.create({ participant1, participant2 });
    return this.threadRepository.save(thread);
  }

  // Méthode existante pour trouver tous les threads
  async findAllThreads(): Promise<Thread[]> {
    return this.threadRepository.find({
      relations: ['participant1', 'participant2', 'lastMessage'],
    });
  }

  // Méthode existante pour trouver un thread par ID
  async findOneThread(id: string): Promise<Thread> {
    const thread = await this.threadRepository.findOne({
      where: { id },
      relations: ['participant1', 'participant2', 'messages'],
    });
    if (!thread) {
      throw new NotFoundException(`Thread #${id} not found`);
    }
    return thread;
  }

  // Nouvelle méthode pour obtenir les threads d'un utilisateur avec pagination
  async findThreadsForUser(
    req: Request,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const { page, limit } = paginationQuery;
    const user = await this.authService.getUserFromRequest(req);

    const [threads, total] = await this.threadRepository.findAndCount({
      where: [
        {
          participant1: {
            id: user.id,
          },
        },
        {
          participant2: {
            id: user.id,
          },
        },
      ],
      relations: [
        'participant1',
        'participant2',
        'lastMessage',
        'lastMessage.sender',
      ],
      order: {
        updatedAt: 'DESC',
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Pour chaque thread, on va compter les messages non lus par le participant courant
    const threadsWithUnreadCount = await Promise.all(
      threads.map(async (thread) => {
        const unreadCount = await this.messageRepository.count({
          where: {
            thread: {
              id: thread.id,
            },
            isRead: false,
            sender: {
              id: Not(user.id), // Compter les messages non lus par l'utilisateur courant
            },
          },
        });

        return {
          ...thread,
          unreadCount, // Ajoute le nombre de messages non lus à chaque thread
        };
      }),
    );

    return {
      items: threadsWithUnreadCount,
      total,
      page,
      limit,
    };
  }
}
