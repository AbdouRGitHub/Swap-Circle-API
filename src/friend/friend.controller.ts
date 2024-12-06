import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Get,
  Delete,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchFriendDto } from './dto/search.dto';

@ApiTags('friend')
@ApiBearerAuth('access-token')
@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('search')
  @ApiOperation({
    description: 'Rechercher un ami',
  })
  search(@Body() searchFriendDto: SearchFriendDto, @Req() request: Request) {
    return this.friendService.search(searchFriendDto, request);
  }

  @Post('request/:id')
  @ApiOperation({
    description: "Création une demande d'ami auprès d'un utilisateur",
  })
  sendRequest(@Param('id') recieverId: string, @Req() request: Request) {
    return this.friendService.sendRequest(recieverId, request);
  }

  @Get('list')
  @ApiOperation({
    description: "Liste tous les amis de l'utilisateur",
  })
  friendList(@Req() request: Request) {
    return this.friendService.friendList(request);
  }

  @Get('request')
  @ApiOperation({
    description: "Liste tous les demanedes d'ami reçu par l'utilisateur",
  })
  friendRequestList(@Req() request: Request) {
    return this.friendService.friendRequestList(request);
  }

  @Post('request/accepted/:id')
  @ApiOperation({
    description: "Accepte une demande d'ami reçu par l'utilisateur",
  })
  acceptedRequest(@Param('id') id: string, @Req() request: Request) {
    return this.friendService.acceptedRequest(id, request);
  }

  @Delete('request/refused/:id')
  @ApiOperation({
    description: "Refuse une demande d'ami reçu par l'utilisateur",
  })
  refuseFriendRequest(@Param('id') id: string, @Req() request: Request) {
    return this.friendService.refuseFriendRequest(id, request);
  }

  @Get('status/:id')
  @ApiOperation({
    description: "Vérifie si un utilisateur est un ami de l'utilisateur",
  })
  checkStatus(@Param('id') id: string, @Req() request: Request) {
    return this.friendService.checkStatus(id, request);
  }

  @Delete(':id')
  @ApiOperation({
    description: "Supprime un ami de l'utilisateur",
  })
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.friendService.remove(id, request);
  }
}
