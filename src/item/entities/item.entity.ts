import { Loan } from 'src/loan/entities/loan.entity';
import { User } from 'src/user/entities/user.entity';
import { Review } from 'src/user/entities/review.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Scope {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity()
export class Item {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column({
    length: 100,
  })
  name: string;

  @Column()
  category: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  amount: number;

  @Column({ default: 'false' })
  available: string;

  @Column({
    nullable: true,
  })
  imgPath: string;

  @Column({
    type: 'enum',
    enum: Scope,
    default: Scope.PUBLIC,
  })
  scope: Scope;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.items)
  owner: User;

  @OneToMany(() => Loan, (loan) => loan.item)
  loans: Loan[];

  // Ajout de la relation avec les Reviews
  @OneToMany(() => Review, (review) => review.item)
  reviews: Review[];
}
