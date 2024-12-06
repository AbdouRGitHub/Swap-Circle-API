import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateThreadDto {
  // @ApiProperty({ description: 'UUID du premier participant' })
  // @IsNumber()
  // participant1Id: number;

  @ApiProperty({ description: "Nom d'utilisateur du deuxième participant" })
  @IsString()
  participant2Username: string;
}
