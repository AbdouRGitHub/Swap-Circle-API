import { Module } from '@nestjs/common';
import { LoanRequestService } from './loan-request.service';
import { LoanRequestController } from './loan-request.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanRequest } from './entities/loan-request.entity';
import { Item } from 'src/item/entities/item.entity';
import { User } from 'src/user/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Loan } from 'src/loan/entities/loan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Item, LoanRequest, Loan]),
    AuthModule,
  ],
  controllers: [LoanRequestController],
  providers: [LoanRequestService],
  exports: [LoanRequestService],
})
export class LoanRequestModule {}
