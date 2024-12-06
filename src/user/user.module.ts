import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { FileModule } from 'src/file/file.module';
import { Review } from './entities/review.entity';
import { PushNotification } from 'src/push-notification/entities/push-notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Review, PushNotification]), AuthModule, FileModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
