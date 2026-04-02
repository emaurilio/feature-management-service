import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LOGGING_SERVICE } from './logging-service.interface';

@Module({
  providers: [
    {
      provide: LOGGING_SERVICE,
      useClass: LoggingService,
    },
  ],
  exports: [LOGGING_SERVICE],
})
export class LoggingModule {}
