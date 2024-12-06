import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/message.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PaginatedMessagesDto } from './dto/paginated-messages.dto';

@ApiTags('messages')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post(':threadId')
  @ApiOperation({ summary: 'Créer un nouveau message dans une conversation' })
  createMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.createMessage(createMessageDto);
  }

  @Get(':threadId')
  @ApiOperation({
    summary: "Obtenir tous les messages d'une conversation avec pagination",
  })
  findAllMessages(
    @Param('threadId') threadId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedMessagesDto> {
    return this.messageService.findAllMessages(threadId, paginationQuery);
  }

  @Patch(':threadId/markAsRead')
  @ApiOperation({ summary: 'Marquer un message comme lu' })
  markAsRead(@Param('threadId') threadId: string) {
    return this.messageService.markAsRead(threadId);
  }
}
