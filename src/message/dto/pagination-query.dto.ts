import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({ default: 1, description: 'Numéro de la page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ default: 10, description: "Nombre d'éléments par page" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
