import { IsNumber, IsOptional, IsString, IsInt, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Scope } from '../entities/item.entity';

export class SearchPaginatedItemDto {
  @ApiProperty({
    description: 'Champ de recherche pour filtrer les articles',
    example: 'chaussures',
    required: false,
  })
  @IsString()
  @IsOptional()
  searchField?: string;

  @IsEnum(Scope)
  @ApiProperty({
    description: "visibilité de l'objet",
  })
  scope: Scope;
  
  @ApiProperty({
    description: 'Numéro de la page à récupérer',
    example: 1,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  page: number;

  @ApiProperty({
    description: "Nombre d'articles par page",
    example: 10,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  limit: number;
}
