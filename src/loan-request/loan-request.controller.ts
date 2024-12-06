import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { LoanRequestService } from './loan-request.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateLoanRequestDto } from './dto/loan-request.dto';

@ApiTags('loan-request')
@ApiBearerAuth('access-token')
@Controller('loan-request')
export class LoanRequestController {
  constructor(private readonly loanRequestService: LoanRequestService) {}

  @Post()
  @ApiOperation({
    description: 'Envoyer une demande de prêt',
  })
  sendRequest(
    @Body() createLoanRequestDto: CreateLoanRequestDto,
    @Req() request: Request,
  ) {
    return this.loanRequestService.sendRequest(createLoanRequestDto, request);
  }

  @ApiOperation({
    description: 'Renvoi toutes les requêtes reçus',
  })
  @Get('recieved')
  findAllRequestReceived(@Req() request: Request) {
    return this.loanRequestService.findAllRequestReceived(request);
  }

  @ApiOperation({
    description: 'Renvoi toutes les requêtes envoyés',
  })
  @Get('sent')
  findAllRequestSent(@Req() request: Request) {
    return this.loanRequestService.findAllRequestSent(request);
  }

  @ApiOperation({
    description: 'Accepter une demande de prêt',
  })
  @Post(':id/accept')
  acceptRequest(@Param('id') id: string, @Req() request: Request) {
    return this.loanRequestService.acceptRequest(+id, request);
  }

  @ApiOperation({
    description: 'Refuser une demande de prêt',
  })
  @Post(':id/reject')
  rejectRequest(@Param('id') id: string, @Req() request: Request) {
    return this.loanRequestService.rejectRequest(+id, request);
  }

  @ApiOperation({
    description: 'Annuler une demande de prêt envoyée',
  })
  @Post(':id/cancel')
  cancelRequest(@Param('id') id: string, @Req() request: Request) {
    return this.loanRequestService.cancelRequest(+id, request);
  }
}
