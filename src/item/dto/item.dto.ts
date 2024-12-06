import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Scope } from '../entities/item.entity';

export class CreateItemDto {
  @IsString()
  @ApiProperty({
    description: "le nom d'objet",
  })
  name: string;

  @IsString()
  @ApiProperty({
    description: "la catégorie de l'objet",
  })
  category: string;

  @IsString()
  @ApiProperty({
    description: "la description de l'objet",
  })
  description: string;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @ApiProperty({
    description: "le montant de l'objet",
    required: false,
  })
  amount: number;
  
  @IsString()
  @ApiProperty({
    description: "disponibilité de l'objet",
  })
  available: string;

  @IsEnum(Scope)
  @ApiProperty({
    description: "visibilité de l'objet",
  })
  scope: Scope;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary', maxItems: 4 },
    description: "photos(s) de l'objet (4 max, format JPG, JPEG ou PNG)",
    nullable: true,
    required: false,
  })
  files: any[];
}

export class UpdateItemDto extends PartialType(CreateItemDto) {
  // PLUS BESOIN MTN !!!!!!!!!!!!!!!!!!!!!!!!!!
  // @Exclude()
  // @ApiProperty({
  //   required: false,
  //   description: 'représente la liste des images à supprimer',
  //   example: ["string1.jpg", "string2.jpeg"]
  // })
  // fileNameArray: string;
}
