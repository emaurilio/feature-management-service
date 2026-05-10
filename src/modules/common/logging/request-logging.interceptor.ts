/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LOGGING_SERVICE } from './logging-service.interface';
import type { LoggingServiceInterface } from './logging-service.interface';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(LOGGING_SERVICE)
    private readonly loggingService: LoggingServiceInterface,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.url;
    const query = JSON.stringify(request.query || {});
    const body = JSON.stringify(request.body || {});

    const start = Date.now();
    this.loggingService.logRequest(method, path, query, body);

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - start;
        const statusCode = context.switchToHttp().getResponse().statusCode;
        this.loggingService.logResponse(statusCode, durationMs);
      }),
      catchError((err) => {
        const durationMs = Date.now() - start;
        this.loggingService.logError(err, `Request ${method} ${path}`);
        this.loggingService.logResponse(500, durationMs);
        throw err;
      }),
    );
  }
}
