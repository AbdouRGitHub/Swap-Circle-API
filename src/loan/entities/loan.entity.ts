import { Item } from 'src/item/entities/item.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

export enum LoanStatus {
  CANCELED = 'CANCELED', // annulé
  PENDING = 'PENDING', // en attente de confirmation
  IN_PROGRESS = 'IN PROGRESS', // en cours
  IN_COMPLETION = 'IN COMPLETION', // en cours de cloture
  COMPLETED = 'COMPLETED', // cloturé
}

@Entity()
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.PENDING })
  status: LoanStatus;

  @ManyToOne(() => Item, (item) => item.loans, { onDelete: 'CASCADE' })
  item: Item;

  @ManyToOne(() => User, (user) => user.lentItems)
  lender: User;

  @ManyToOne(() => User, (user) => user.borrowedItems)
  borrower: User;

  @Column({ type: 'boolean', default: false }) // Champs pour avis du prêteur
  lenderReview: boolean;

  @Column({ type: 'boolean', default: false }) // Champs pour avis de l'emprunteur
  borrowerReview: boolean;

  @Column({ type: 'boolean', default: false }) // Champs pour archiver le prêt
  archived: boolean;

  @Column({ nullable: true }) // Champ pour stocker l'ID Stripe
  paymentId: string;

  @Column({ type: 'boolean', default: false }) // Champ pour indiquer si remboursé
  refund: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
