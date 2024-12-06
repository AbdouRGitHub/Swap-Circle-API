import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString } from "class-validator";

export class CreateNotificationMessageDto {
  @IsString()
  @ApiProperty({
    description: 'titre du message'
  })
  title: string;

  @IsString()
  @ApiProperty({
    description: 'corps du message'
  })
  body: string;

  @IsString({ each: true })
  @ApiProperty({
    description: 'token'
  })
  tokens: string[];
}

export class UpdateNotificationMessageDto extends PartialType(CreateNotificationMessageDto){}