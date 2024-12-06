import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'pseudo',
  })
  username: string;

  @IsEmail()
  @ApiProperty({
    description: 'adresse mail',
  })
  email: string;

  @IsString()
  @ApiProperty({
    description: 'mot de passe',
  })
  password: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
