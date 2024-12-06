import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';

const matchRoles = (roles, userRoles) => {
  return roles.some((role) => role === userRoles);
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest() as any;
    if (!request.headers.authorization) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    const user = await this.authService.getUserFromRequest(request);

    if (user.role === 'ADMIN') {
      return true;
    }

    return matchRoles(roles, user.role);
  }
}