import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class PasswordDto {
  @IsString()
  @ApiProperty({
    description: 'ancien mot de passe',
  })
  password: string;

  @IsString()
  @ApiProperty({
    description: 'nouveau mot de passe',
  })
  newPassword: string;

  @IsString()
  @ApiProperty({
    description: 'confirmation du nouveau mot de passe',
  })
  newPasswordConfirm: string;
}

export class UpdatePasswordDto extends PartialType(PasswordDto) {}