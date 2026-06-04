import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AppLogger } from '@intervu-ai/shared-logger';

@Module({
  providers: [
    {
      provide: QueueService,
      useFactory: () => {
        return new QueueService(new AppLogger({ name: 'QueueService' }));
      },
    },
  ],
  exports: [QueueService],
})
export class QueueModule {}
