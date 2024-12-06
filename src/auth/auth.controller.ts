import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/user.dto';
import { CreateAuthDto } from './dto/auth.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService
  ){}

  @Post('login')
  login(@Body() createAuthDto: CreateAuthDto) {
    const { email, password } = createAuthDto;
    return this.authService.login(email, password);
  }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Get('me')
  me(@Req() req: Request) {
    return this.authService.getUserFromRequest(req);
  
  
  }

  @Get('refresh')
  refresh(@Req() req: Request) {
    return this.authService.refreshToken(req);
  }
}
