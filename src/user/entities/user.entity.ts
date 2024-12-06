import { Item } from 'src/item/entities/item.entity';
import { Loan } from 'src/loan/entities/loan.entity';
import { Message } from 'src/message/entities/message.entity';
import { Review } from './review.entity';
import { Thread } from 'src/thread/entities/thread.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PushNotification } from 'src/push-notification/entities/push-notification.entity';
import { Friend } from 'src/friend/entities/friend.entity';

export enum roles {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({
    unique: true,
  })
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({
    nullable: true,
  })
  pfp_filename: string;

  @Column({
    type: 'enum',
    enum: roles,
    default: roles.USER,
  })
  role: roles;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @OneToMany(() => Item, (item) => item.owner)
  items: Item[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Review, (review) => review.recipient)
  receivedReviews: Review[];

  @OneToMany(() => Loan, (loan) => loan.lender)
  lentItems: Loan[];

  @OneToMany(() => Loan, (loan) => loan.borrower)
  borrowedItems: Loan[];

  @OneToMany(() => Thread, (thread) => thread.participant1)
  threads1: Thread[];

  @OneToMany(() => Thread, (thread) => thread.participant2)
  threads2: Thread[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(
    () => PushNotification,
    (pushNotification) => pushNotification.user,
  )
  pushNotifications: PushNotification[];
  
  @OneToMany(() => Friend, (friend) => friend.Account_One)
  friendsAsAccountOne: Friend[];

  @OneToMany(() => Friend, (friend) => friend.Account_Two)
  friendsAsAccountTwo: Friend[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
