import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'audit-logs' },
      { name: 'deadletter-logs' },
      { name: 'audit-ux-research' },
      { name: 'deadletter-ux-research' },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
