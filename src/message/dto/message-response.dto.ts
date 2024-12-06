import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    pfp_filename: string;
    role: string;
    phoneNumber: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
