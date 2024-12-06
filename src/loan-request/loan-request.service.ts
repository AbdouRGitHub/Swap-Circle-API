import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { Item } from 'src/item/entities/item.entity';
import { DataSource, Not, Repository } from 'typeorm';
import { CreateLoanRequestDto } from './dto/loan-request.dto';
import { LoanRequest, LoanRequestStatus } from './entities/loan-request.entity';
import { Loan } from 'src/loan/entities/loan.entity';

@Injectable()
export class LoanRequestService {
  constructor(
    private authService: AuthService,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(LoanRequest)
    private loanRequestRepository: Repository<LoanRequest>,
    private dataSource: DataSource,
  ) {}

  async sendRequest(createLoanRequestDto: CreateLoanRequestDto, request) {
    const requester = await this.authService.getUserFromRequest(request);

    const item = await this.itemRepository.findOne({
      where: {
        uid: createLoanRequestDto.item_uid,
      },
      relations: ['owner'],
    });

    if (!item) {
      throw new NotFoundException(
        `Item #${createLoanRequestDto.item_uid} not found`,
      );
    }

    // Vérifiez si l'utilisateur est le propriétaire de l'article
    if (item.owner.id === requester.id) {
      throw new BadRequestException(
        'Vous ne pouvez pas faire une demande de prêt sur votre propre article.',
      );
    }

    // Vérifiez s'il existe déjà une demande de prêt en cours pour cet utilisateur et cet article
    const existingRequest = await this.loanRequestRepository.findOne({
      where: {
        requester: { id: requester.id },
        item: { uid: createLoanRequestDto.item_uid },
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'Vous avez déjà une demande de prêt en cours pour cet article.',
      );
    }

    const loanRequest =
      await this.loanRequestRepository.create(createLoanRequestDto);
    loanRequest.requester = requester;
    loanRequest.lender = item.owner;
    loanRequest.item = item;

    return await this.loanRequestRepository.save(loanRequest);
  }

  async findAllRequestReceived(request) {
    const user = await this.authService.getUserFromRequest(request);

    const loanRequests = await this.loanRequestRepository.find({
      where: {
        lender: {
          id: user.id,
        },
        status: LoanRequestStatus.PENDING,
      },
      relations: ['item'],
      order: {
        createdAt: 'DESC',
      },
    });

    return loanRequests;
  }

  async findAllRequestSent(request) {
    const user = await this.authService.getUserFromRequest(request);

    const loanSend = await this.loanRequestRepository.find({
      where: {
        requester: {
          id: user.id,
        },
        status: LoanRequestStatus.PENDING,
      },
      relations: ['item'],
      order: {
        createdAt: 'DESC',
      },
    });

    return loanSend;
  }

  async acceptRequest(requestId: number, request) {
    const queryRunner = this.dataSource.createQueryRunner();
    const user = await this.authService.getUserFromRequest(request);

    const loanRequest: LoanRequest = await this.loanRequestRepository.findOne({
      where: {
        id: requestId,
        lender: { id: user.id },
      },
      relations: ['item', 'lender', 'requester'],
    });

    if (!loanRequest) {
      throw new NotFoundException(`Request #${requestId} not found`);
    }

    loanRequest.status = LoanRequestStatus.APPROVED;

    const loan = await this.loanRepository.create({
      item: loanRequest.item,
      lender: loanRequest.lender,
      borrower: loanRequest.requester,
      dateStart: loanRequest.dateStart,
      dateEnd: loanRequest.dateEnd,
    });

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(loanRequest);
      await queryRunner.manager.save(loan);

      // Rend l'objet indisponible
      await queryRunner.manager.getRepository(Item).update(
        {
          uid: loanRequest.item.uid,
        },
        {
          available: 'false',
        },
      );

      // Refuse automatiquement les autres demandes
      await queryRunner.manager.getRepository(LoanRequest).update(
        {
          id: Not(requestId),
          item: loanRequest.item,
        },
        {
          status: LoanRequestStatus.REJECTED,
        },
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectRequest(requestId: number, request) {
    const user = await this.authService.getUserFromRequest(request);

    const loanRequest = await this.loanRequestRepository.findOneBy({
      id: requestId,
      lender: { id: user.id },
    });

    if (!loanRequest) {
      throw new NotFoundException(`Request #${requestId} not found`);
    }

    loanRequest.status = LoanRequestStatus.REJECTED;

    return await this.loanRequestRepository.save(loanRequest);
  }

  // Annuler la demande envoyée
  async cancelRequest(requestId: number, request) {
    const user = await this.authService.getUserFromRequest(request);

    const loanRequest = await this.loanRequestRepository.findOneBy({
      id: requestId,
      requester: { id: user.id },
    });

    if (!loanRequest) {
      throw new NotFoundException(`Request #${requestId} not found`);
    }

    loanRequest.status = LoanRequestStatus.REJECTED;

    return await this.loanRequestRepository.save(loanRequest);
  }
}
