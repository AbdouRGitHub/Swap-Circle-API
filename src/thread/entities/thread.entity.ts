import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Message } from 'src/message/entities/message.entity';

@Entity('threads')
export class Thread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.threads1)
  participant1: User;

  @ManyToOne(() => User, (user) => user.threads2)
  participant2: User;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  lastMessage: Message;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.thread, {
    cascade: ['remove'],
  })
  messages: Message[];
}
