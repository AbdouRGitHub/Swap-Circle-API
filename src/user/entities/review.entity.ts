import { User } from './user.entity';
import { Item } from 'src/item/entities/item.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @ManyToOne(() => User, (user) => user.reviews)
  user: User;

  @ManyToOne(() => User, (user) => user.receivedReviews)
  recipient: User;

  @ManyToOne(() => Item, (item) => item.reviews, { nullable: true }) // Ajout de la relation vers Item
  item: Item;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
