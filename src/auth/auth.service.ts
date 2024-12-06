import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/user/dto/user.dto';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur inexistant');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    const accessToken = jwt.sign(
      {
        email: user.email,
        sub: user.id,
      },
      process.env.JWT_SECRET_KEY,
      // { expiresIn: '10s' }, // Le token expire dans 6 heure
    );
    return { accessToken: accessToken, user };
  }

  async register(createUserDto: CreateUserDto) {
    // S'assurer que le username a la première lettre en majuscule
    createUserDto.username =
      createUserDto.username.charAt(0).toUpperCase() +
      createUserDto.username.slice(1).toLowerCase();

    const existingUsername = await this.userRepository.exists({
      where: {
        username: createUserDto.username,
      },
    });

    if (existingUsername) {
      throw new ConflictException('Ce pseudo a déjà été utilisé');
    }

    const existingEmail = await this.userRepository.exists({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingEmail) {
      throw new ConflictException('Cette adresse mail a déjà été utilisée');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  async getUserFromRequest(req): Promise<User> {
    try {
      if (!req.headers.authorization) {
        throw new NotFoundException(`request not found`);
      }

      const authorization = req.headers.authorization.replaceAll('Bearer ', '');
      const decoded = jwt.verify(authorization, process.env.JWT_SECRET_KEY);

      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id=:id', { id: decoded.sub })
        .getOne();
      if (!user) {
        throw new NotFoundException(`User #${decoded.sub} not found`);
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message,
        '500 Internal Server Error',
      );
    }
  }

  async refreshToken(req) {
    if (!req.headers.authorization) {
      throw new NotFoundException(`request not found`);
    }

    const authorization = req.headers.authorization.replaceAll('Bearer ', '');
    const decoded = jwt.verify(authorization, process.env.JWT_SECRET_KEY);

    const user = await this.userRepository.findOneBy({ id: +decoded.sub });

    if (!user) {
      throw new NotFoundException(`User #${decoded.sub} not found`);
    }

    const accessToken = jwt.sign(
      {
        email: user.email,
        sub: user.id,
      },
      process.env.JWT_SECRET_KEY,
    );
    return { accessToken: accessToken, user };
  }
}
