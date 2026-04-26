import { Global, Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LOGGING_SERVICE } from './logging-service.interface';

@Global()
@Module({
  providers: [
    {
      provide: LOGGING_SERVICE,
      useClass: LoggingService,
    },
  ],
  exports: [LOGGING_SERVICE],
})
export class LoggingModule { }
