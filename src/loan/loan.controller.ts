import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoanService } from './loan.service';
import { CreateLoanDto, UpdateLoanDto } from './dto/loan.dto';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('loan')
@ApiBearerAuth('access-token')
@Controller('loan')
export class LoanController {
  constructor(private loanService: LoanService) {}

  @Get('loans')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description:
      "Lister tous les prêts de l'utilisateur (Tous les prêts si ADMIN)",
  })
  findAllLoans(@Req() request: Request) {
    return this.loanService.findAllLoans(request);
  }

  @Get('borrows')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description:
      "Lister tous les emprunts de l'utilisateur (Tous les emprunts si ADMIN)",
  })
  findAllBorrows(@Req() request: Request) {
    return this.loanService.findAllBorrows(request);
  }

  @Get(':id')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description:
      "Données d'un prêt ou emprunt (Tous les utilisateurs si ADMIN)",
  })
  findOne(@Param('id') id: string, @Req() request: Request) {
    return this.loanService.findOneLoan(+id, request);
  }

  @Put(':id')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: "Modifier les données d'un prêt ou emprunt",
  })
  update(
    @Param('id') id: string,
    @Body() updateLoanDto: UpdateLoanDto,
    @Req() request: Request,
  ) {
    return this.loanService.updateLoan(+id, updateLoanDto, request);
  }

  @Delete(':id')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Supprimer un prêt ou emprunt',
  })
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.loanService.removeLoan(+id, request);
  }

  @Post(':id/validate')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Valider un prêt ou emprunt',
  })
  validateLoan(
    @Param('id') id: string,
    @Body() body: { paymentId: string },
    @Req() request: Request,
  ) {
    return this.loanService.validateLoan(+id, body.paymentId, request);
  }

  @Post(':id/cancel')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Annuler un prêt ou emprunt',
  })
  cancelLoan(@Param('id') id: string, @Req() request: Request) {
    return this.loanService.cancelLoan(+id, request);
  }

  @Post(':id/return')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Marquer un prêt comme en cours de clolture',
  })
  markAsInCompletion(@Param('id') id: string, @Req() request: Request) {
    return this.loanService.markAsInCompletion(+id, request);
  }

  @Post(':id/complete')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Marquer un prêt ou emprunt comme complété',
  })
  markAsComplete(
    @Param('id') id: string,
    @Body() body: { rating: number; comment?: string }, // Récupère rating et comment depuis le corps de la requête
    @Req() request: Request,
  ) {
    const { rating, comment } = body;
    return this.loanService.completeLoan(+id, rating, comment, request);
    // return this.loanService.completeLoan(+id, request);
  }

  // Soumettre un avis pour l'emprunteur
  @Post(':id/review')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: "Soumettre un avis pour l'emprunteur",
  })
  async submitBorrowerReview(
    @Param('id') id: string,
    @Body() body: { rating: number; comment?: string }, // Récupère rating et comment depuis le corps de la requête
    @Req() request: Request,
  ) {
    const { rating, comment } = body;
    return this.loanService.submitBorrowerReview(+id, rating, comment, request);
  }

  @Post(':id/archived')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Marquer un prêt comme archivé',
  })
  async archiveLoan(@Param('id') id: string, @Req() request: Request) {
    return this.loanService.archiveLoan(+id, request);
  }

  @Get('all/archived')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Lister tous les archivés',
  })
  findAllArchived(@Req() request: Request) {
    return this.loanService.findAllArchived(request);
  }
}
