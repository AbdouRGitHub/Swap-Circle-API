import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { AuthModule } from 'src/auth/auth.module';
import { LoanRequest } from 'src/loan-request/entities/loan-request.entity';
import { Loan } from 'src/loan/entities/loan.entity';
import { TaskController } from './task.controller';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanRequest, Loan]),
    AuthModule,
    PushNotificationModule,
  ],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TaskModule {}
