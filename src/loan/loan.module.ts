import { Module } from '@nestjs/common';
import { LoanService } from './loan.service';
import { PaymentService } from 'src/payment/payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './entities/loan.entity';
import { User } from 'src/user/entities/user.entity';
import { LoanController } from './loan.controller';
import { AuthModule } from 'src/auth/auth.module';
import { Review } from 'src/user/entities/review.entity';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan, User, Review]),
    AuthModule,
    PushNotificationModule,
  ],
  controllers: [LoanController],
  providers: [LoanService, PaymentService],
})
export class LoanModule {}
