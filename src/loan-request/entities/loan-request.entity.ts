import { Item } from '../../item/entities/item.entity';
import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum LoanRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  AUTO_REJECTED = 'AUTO REJECTED',
}

@Entity()
export class LoanRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  requester: User;

  @ManyToOne(() => User)
  lender: User;

  @ManyToOne(() => Item)
  item: Item;

  @Column({
    type: 'enum',
    enum: LoanRequestStatus,
    default: LoanRequestStatus.PENDING,
  })
  status: LoanRequestStatus;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  dateStart: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  dateEnd: Date;

  @CreateDateColumn()
  createdAt: Date;
}
