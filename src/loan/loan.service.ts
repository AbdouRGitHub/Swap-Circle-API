import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateLoanDto } from './dto/loan.dto';
import { AuthService } from 'src/auth/auth.service';
import { PaymentService } from 'src/payment/payment.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from './entities/loan.entity';
import { Review } from 'src/user/entities/review.entity';
import { PushNotificationService } from 'src/push-notification/push-notification.service';

@Injectable()
export class LoanService {
  constructor(
    private authService: AuthService,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private paymentService: PaymentService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async findAllLoans(request): Promise<Loan[]> {
    const user = await this.authService.getUserFromRequest(request);

    if (user.role === 'ADMIN') {
      return await this.loanRepository.find({
        where: {
          archived: false, // Ne récupérer que les prêts non archivés
        },
        relations: ['lender', 'borrower', 'item'],
      });
    }

    return await this.loanRepository.find({
      where: {
        lender: {
          id: user.id,
        },
        archived: false, // Ne récupérer que les prêts non archivés
      },
      relations: ['lender', 'borrower', 'item'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllBorrows(request): Promise<Loan[]> {
    const user = await this.authService.getUserFromRequest(request);

    if (user.role === 'ADMIN') {
      return await this.loanRepository.find({
        where: {
          archived: false, // Ne récupérer que les prêts non archivés
        },
        relations: ['lender', 'borrower', 'item'],
      });
    }

    return await this.loanRepository.find({
      where: {
        borrower: {
          id: user.id,
        },
        archived: false, // Ne récupérer que les prêts non archivés
      },
      relations: ['lender', 'borrower', 'item'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOneLoan(id: number, request) {
    const user = await this.authService.getUserFromRequest(request);

    const loan = await this.loanRepository
      .createQueryBuilder('loan')
      .where('loan.id = :id', { id })
      .leftJoinAndSelect('loan.item', 'item')
      .leftJoinAndSelect('loan.borrower', 'borrower')
      .leftJoinAndSelect('loan.lender', 'lender')
      .getOne();

    if (!loan) {
      throw new NotFoundException(`Loan #${id} not found`);
    }

    if (
      user.id !== loan.lender.id &&
      user.id !== loan.borrower.id &&
      user.role !== 'ADMIN'
    ) {
      throw new UnauthorizedException(
        'You are not authorized to view this loan',
      );
    }

    return loan;
  }

  async updateLoan(
    id: number,
    updateLoanDto: UpdateLoanDto,
    request,
  ): Promise<Loan> {
    const user = await this.authService.getUserFromRequest(request);

    const loan = await this.loanRepository.preload({
      id: id,
      ...updateLoanDto,
    });

    if (!loan) {
      throw new NotFoundException(`Loan #${id} not found`);
    }

    if (
      user.id !== loan.lender.id &&
      user.id !== loan.borrower.id &&
      user.role !== 'ADMIN'
    ) {
      throw new UnauthorizedException(
        'You are not authorized to update this loan',
      );
    }

    return await this.loanRepository.save(loan);
  }

  async removeLoan(id: number, request) {
    const user = await this.authService.getUserFromRequest(request);

    const loan = await this.loanRepository.findOne({
      where: {
        id: id,
      },
      relations: ['item', 'borrower', 'lender'],
    });

    if (!loan) {
      throw new NotFoundException(`Loan #${id} not found`);
    }

    if (
      user.id !== loan.lender.id &&
      user.id !== loan.borrower.id &&
      user.role !== 'ADMIN'
    ) {
      throw new UnauthorizedException(
        'You are not authorized to remove this loan',
      );
    }

    return await this.loanRepository.remove(loan);
  }

  async validateLoan(id: number, paymentId: string, request) {
    const user = await this.authService.getUserFromRequest(request);

    const loan = await this.loanRepository.findOne({
      where: {
        id: id,
        // lender: {
        //   id: user.id,
        // },
        borrower: {
          id: user.id,
        },
      },
      relations: ['item', 'lender'],
    });

    loan.status = LoanStatus.IN_PROGRESS;
    loan.paymentId = paymentId;

    return await this.loanRepository.save(loan);
  }

  async cancelLoan(id: number, request) {
    const user = await this.authService.getUserFromRequest(request);

    const loan = await this.loanRepository.findOne({
      where: {
        id: id,
        // lender: {
        //   id: user.id,
        // },
        borrower: {
          id: user.id,
        },
      },
      relations: ['item', 'lender'],
    });

    loan.status = LoanStatus.CANCELED;

    return await this.loanRepository.save(loan);
  }

  async markAsInCompletion(id: number, request) {
    const user = await this.authService.getUserFromRequest(request);

    const loan = await this.loanRepository.findOne({
      where: {
        id: id,
        borrower: {
          id: user.id,
        },
      },
      relations: ['item', 'lender', 'borrower'],
    });

    loan.status = LoanStatus.IN_COMPLETION;

    return await this.loanRepository.save(loan);
  }

  async completeLoan(
    id: number,
    rating: number,
    comment: string,
    request: any,
  ) {
    const user = await this.authService.getUserFromRequest(request);

    const loan = await this.loanRepository.findOne({
      where: {
        id: id,
        lender: {
          id: user.id,
        },
      },
      relations: ['item', 'lender', 'borrower'],
    });

    loan.status = LoanStatus.COMPLETED;

    const newReview = this.reviewRepository.create({
      rating: rating,
      comment: comment || '', // Si le commentaire est vide, une chaîne vide est utilisée
      user, // Le prêteur (lender) est celui qui laisse l'avis
      recipient: loan.borrower, // L'emprunteur (borrower) est celui qui reçoit l'avis
      item: loan.item, // Ajoute l'item à la review
    });
    await this.reviewRepository.save(newReview);

    // Mettre à jour le champ lenderReview à true
    loan.lenderReview = true;

    // Effectuer le remboursement si un paymentId est présent
    if (loan.paymentId && loan.refund === false) {
      await this.paymentService.refundPayment(loan.paymentId);
      loan.refund = true; // Marquez comme remboursé
    }

    // Récupérer les tokens de notification pour le prêteur (lender)
    const notificationTokens =
      await this.pushNotificationService.findAllTokensByUserId(
        loan.borrower.id,
      );

    // Extraire uniquement les tokens en tant que chaînes
    const tokens = notificationTokens.map((record) => record.notificationToken);

    // Envoyer une notification push
    if (tokens && tokens.length > 0) {
      // Appeler directement sendPushNotification avec tous les tokens
      await this.pushNotificationService.sendPushNotification(
        tokens, // Passer directement le tableau de tokens
        'Prêt Terminé',
        `Le prêt pour l'article "${loan.item.name}" a été complété avec succès. Merci pour votre participation !`,
      );
    }

    return await this.loanRepository.save(loan);
  }

  async submitBorrowerReview(
    id: number,
    rating: number,
    comment: string,
    request: any,
  ) {
    const user = await this.authService.getUserFromRequest(request);

    const loan = await this.loanRepository.findOne({
      where: {
        id: id,
        borrower: {
          id: user.id,
        },
      },
      relations: ['item', 'borrower', 'lender'],
    });

    if (!loan) {
      throw new Error(
        'Loan not found or you are not authorized to submit a review for this loan',
      );
    }

    // Créer une nouvelle évaluation pour l'emprunteur
    const newReview = this.reviewRepository.create({
      rating: rating,
      comment: comment || '', // Si le commentaire est vide, une chaîne vide est utilisée
      user, // Le prêteur (lender) est celui qui laisse l'avis
      recipient: loan.lender, // L'emprunteur (borrower) reçoit l'avis
      item: loan.item, // Ajoute l'item à la review
    });

    await this.reviewRepository.save(newReview);

    // Mettre à jour le champ lenderReview à true
    loan.borrowerReview = true;

    return await this.loanRepository.save(loan);
  }

  async archiveLoan(id: number, request: any): Promise<Loan> {
    const user = await this.authService.getUserFromRequest(request);

    // Trouver le prêt
    const loan = await this.loanRepository.findOne({
      where: { id: id },
      relations: ['lender', 'borrower'],
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    // Vérification si c'est bien le prêteur ou emprunteur
    if (
      loan.lender.id !== user.id &&
      loan.borrower.id !== user.id &&
      user.role !== 'ADMIN'
    ) {
      throw new Error('Unauthorized access');
    }

    // Mettre à jour le champ archived à true
    loan.archived = true;

    // Sauvegarder la modification
    return await this.loanRepository.save(loan);
  }

  async findAllArchived(request: any): Promise<Loan[]> {
    const user = await this.authService.getUserFromRequest(request);

    if (user.role === 'ADMIN') {
      return await this.loanRepository.find({
        where: {
          archived: true, // Ne récupérer que les prêts archivés
        },
        relations: ['lender', 'borrower', 'item'],
      });
    }

    return await this.loanRepository.find({
      where: {
        lender: {
          id: user.id,
        },
        archived: true, // Ne récupérer que les prêts archivés
      },
      relations: ['lender', 'borrower', 'item'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
