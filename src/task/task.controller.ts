import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TaskService } from './task.service';

@Controller('task')
@ApiTags('task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post('trigger-loan-in-completion-status')
  TriggerLoanInCompletionStatus() {
    return this.taskService.TriggerLoanInCompletionStatus();
  }
}
