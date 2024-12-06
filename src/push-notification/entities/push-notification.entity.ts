import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PushNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  notificationToken: string;

  @ManyToOne(() => User, (user) => user.pushNotifications)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
