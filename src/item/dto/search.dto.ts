import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { Scope } from '../entities/item.entity';

export class SearchItemDto {

  @IsString()
  @ApiProperty({
    description: "le nom de l'article",
    example: 'Playstation 5'
  })
  searchField: string;

  @IsEnum(Scope)
  @ApiProperty({
    description: "le statut de l'article",
    example: 'public'
  })
  scope: Scope;
}
