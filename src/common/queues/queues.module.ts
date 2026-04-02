import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'audit-logs' },
      { name: 'deadletter-logs' },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
