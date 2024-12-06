import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { LoanModule } from './loan/loan.module';
import { FileModule } from './file/file.module';
import { ItemModule } from './item/item.module';
import { FriendModule } from './friend/friend.module';
import { LoanRequestModule } from './loan-request/loan-request.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './task/task.module';
import { AppGateway } from './app.gateway';
import { MessageModule } from './message/message.module';
import { ThreadModule } from './thread/thread.module';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';
import { PaymentModule } from './payment/payment.module';
import { PushNotificationModule } from './push-notification/push-notification.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    LoanModule,
    UserModule,
    FileModule,
    ItemModule,
    FriendModule,
    LoanRequestModule,
    TaskModule,
    MessageModule,
    ThreadModule,
    PaymentModule,
    PushNotificationModule,
  ],
  controllers: [AppController, PaymentController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AppGateway,
    PaymentService,
  ],
})
export class AppModule {}
