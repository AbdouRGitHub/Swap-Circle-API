import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SearchFriendDto {
  @ApiProperty()
  @IsString()
  searchField: string;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
