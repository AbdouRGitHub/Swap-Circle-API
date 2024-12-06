import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import { IsDate, IsNumber, IsString } from "class-validator";

export class CreateLoanRequestDto{

  @IsString()
  @ApiProperty({
    description: 'identifiant de l\'objet'
  })
  item_uid: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'date de début du prêt',
    default: new Date()
  })
  dateStart: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'date de fin du prêt',
    default: new Date()
  })
  dateEnd: Date;
}

export class UpdateLoanRequestDto extends PartialType(CreateLoanRequestDto){}