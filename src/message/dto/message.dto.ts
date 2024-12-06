import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMessageDto {
  @ApiProperty({ description: 'UUID de la conversation' })
  @IsUUID()
  threadId: string;

  @ApiProperty({ description: "UUID de l'expéditeur" })
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  @IsNumber()
  senderId: number;

  @ApiProperty({ description: 'Contenu du message' })
  @IsString()
  content: string;
}
