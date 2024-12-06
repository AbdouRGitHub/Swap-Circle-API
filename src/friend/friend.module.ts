import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Friend } from './entities/friend.entity';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friend]), AuthModule, PushNotificationModule],
  controllers: [FriendController],
  providers: [FriendService],
  exports: [FriendService],
})
export class FriendModule {}
