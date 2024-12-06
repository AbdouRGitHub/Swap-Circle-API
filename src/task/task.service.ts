import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  LoanRequest,
  LoanRequestStatus,
} from '../loan-request/entities/loan-request.entity';
import { In, LessThan, Repository } from 'typeorm';
import { Loan, LoanStatus } from 'src/loan/entities/loan.entity';
import { PushNotificationService } from 'src/push-notification/push-notification.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(LoanRequest)
    private readonly loanRequestRepository: Repository<LoanRequest>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly pushNotificationService: PushNotificationService,
  ) {}
  private readonly logger = new Logger(TaskService.name);

  @Cron(CronExpression.EVERY_HOUR)
  async TriggerLoanRequestsAutoRejection() {
    const date = new Date();
    date.setHours(date.getHours() - 24);

    await this.loanRequestRepository.update(
      {
        status: LoanRequestStatus.PENDING,
        createdAt: LessThan(date),
      },
      {
        status: LoanRequestStatus.AUTO_REJECTED,
      },
    );

    this.logger.log(`Loan-Request Auto-Rejection`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async TriggerLoanInCompletionStatus() {
    const now = new Date();
    const date = new Date();
    date.setHours(now.getHours() - 24);

    const updatedLoans = await this.loanRepository.find({
      where: {
        status: LoanStatus.IN_PROGRESS,
        dateEnd: LessThan(date),
      },
      relations: [
        'lender',
        'lender.pushNotifications',
        'borrower',
        'borrower.pushNotifications',
        'item',
      ],
    });

    await this.loanRepository.update(
      {
        id: In(updatedLoans.map((loan) => loan.id)),
      },
      {
        status: LoanStatus.IN_COMPLETION,
      },
    );

    for (const loan of updatedLoans) {
      const lenderToken = loan.lender.pushNotifications.map(
        (pushNotification) => pushNotification.notificationToken,
      );
      const borrowerToken = loan.borrower.pushNotifications.map(
        (pushNotification) => pushNotification.notificationToken,
      );
      try {
        await this.pushNotificationService.sendPushNotification(
          lenderToken,
          'Fin de prêt',
          `Le prêt "${loan.item.name}" est terminé. Convenez d'un rendez-vous pour la restitution`,
        );

        await this.pushNotificationService.sendPushNotification(
          borrowerToken,
          "Fin d'emprunt",
          `L'emprunt "${loan.item.name}" est terminé. Convenez d'un rendez-vous pour la restitution`,
        );
      } catch (error) {
        this.logger.error(`Error: ${error}`);
      }
    }

    this.logger.log(`Loan In-Completion Status`);
  }
}
