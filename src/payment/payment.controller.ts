import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';

@Controller('payment')
@ApiTags('payment')
@ApiBearerAuth('access-token')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-payment-intent')
  @ApiOperation({
    description: 'Créer une intention de paiement',
  })
  createPaymentIntent(
    @Body('amount') amount: number,
    @Body('currency') currency: string,
  ) {
    return this.paymentService.createPaymentIntent(amount, currency);
  }
}
