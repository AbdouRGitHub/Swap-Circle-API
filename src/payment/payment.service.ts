import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.YOUR_STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  async createPaymentIntent(amount: number, currency: string) {
    return await this.stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
    });
  }

  // Méthode pour initier un remboursement
  async refundPayment(paymentId: string) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentId,
      });
      return refund;
    } catch (error) {
      console.error('Erreur lors du remboursement :', error);
      throw new Error('Impossible de traiter le remboursement');
    }
  }
}
