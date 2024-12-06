import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsString } from "class-validator";

export class CreateLoanDto{
  
  @IsString()
  @ApiProperty({
    description: 'le nom du destinataire'
  })
  recipient_name: string;

  @IsString()
  @ApiProperty({
    description: 'le nom de l\'objet'
  })
  object_name: string;

  @IsString()
  @ApiProperty({
    description: 'la catégorie de l\'objet'
  })
  category: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'date de fin du prêt'
  })
  dateEnd: Date;
}

export class UpdateLoanDto extends PartialType(CreateLoanDto){}