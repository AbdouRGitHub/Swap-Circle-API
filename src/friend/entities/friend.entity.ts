import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum friendStatus {
  InProgess = 'in progress',
  accepted = 'accepted',
}

@Entity()
export class Friend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  Account_One: User;

  @ManyToOne(() => User)
  Account_Two: User;

  @Column({
    type: 'enum',
    enum: friendStatus,
    default: friendStatus.InProgess,
  })
  statut: string;
}
