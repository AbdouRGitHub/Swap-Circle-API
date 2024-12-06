import { Controller, Post, Body, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ThreadService } from './thread.service';
import { CreateThreadDto } from './dto/thread.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@ApiTags('threads')
@ApiBearerAuth('access-token')
@Controller('threads')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle conversation' })
  createThread(
    @Body() createThreadDto: CreateThreadDto,
    @Req() request: Request,
  ) {
    return this.threadService.createThread(createThreadDto, request);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir toutes les conversations' })
  findAllThreads() {
    return this.threadService.findAllThreads();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une conversation par ID' })
  findOneThread(@Param('id') id: string) {
    return this.threadService.findOneThread(id);
  }

  @Get('user/conversations')
  @ApiOperation({
    summary:
      "Obtenir toutes les conversations de l'utilisateur connecté avec pagination",
  })
  findThreadsForUser(
    @Req() request: Request,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.threadService.findThreadsForUser(request, paginationQuery);
  }
}
