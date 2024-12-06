import { Module } from '@nestjs/common';
import { ThreadService } from './thread.service';
import { ThreadController } from './thread.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Thread } from './entities/thread.entity'; // Assurez-vous d'importer correctement votre entité Thread
import { Message } from 'src/message/entities/message.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Thread, Message, User]), AuthModule],
  controllers: [ThreadController],
  providers: [ThreadService],
})
export class ThreadModule {}
