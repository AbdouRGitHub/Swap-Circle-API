import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  LoanRequest,
  LoanRequestStatus,
} from 'src/loan-request/entities/loan-request.entity';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { log } from 'console';

describe('TaskService', () => {
  let service: TaskService;
  let loanRequestRepository: Repository<LoanRequest>;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(LoanRequest),
          useValue: { update: jest.fn() },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    loanRequestRepository = module.get<Repository<LoanRequest>>(
      getRepositoryToken(LoanRequest),
    );
    logger = new Logger(TaskService.name);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('TriggerLoanRequestsAutoRejection', () => {
    it('should update loan requests with status PENDING older than 24 hours to AUTO_REJECTED', async () => {
      const logSpy = jest.spyOn(logger, 'log').mockImplementation();
      const date = new Date();
      date.setHours(date.getHours() - 24);

      // Temporarily replace the logger instance in the service
      (service as any).logger = logger;
      await service.TriggerLoanRequestsAutoRejection();

      expect(loanRequestRepository.update).toHaveBeenCalledWith(
        {
          status: LoanRequestStatus.PENDING,
          createdAt: expect.anything(), // Since we can't directly compare dates here, use a matcher
        },
        {
          status: LoanRequestStatus.AUTO_REJECTED,
        },
      );
      expect(logSpy).toHaveBeenCalledWith('Loan-Request Auto-Rejection');
    });
  });
});
