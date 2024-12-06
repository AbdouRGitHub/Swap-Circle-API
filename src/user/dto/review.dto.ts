import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateReviewDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  comment?: string;

  @IsNumber()
  @ApiProperty()
  rating: number;
}
