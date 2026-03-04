import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PrometheusService } from './prometheus.service';
import { NestRequest } from './types/metrcis.type';

@Injectable()
export class PrometheusInterceptor implements NestInterceptor {
  constructor(private readonly metrics: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<NestRequest>();
    const path = req.route?.path || req.url;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.metrics.recordProcessingTime(path, 'success', duration);
      }),
      catchError((err) => {
        const duration = Date.now() - start;
        this.metrics.recordProcessingTime(path, 'failure', duration);
        throw err;
      }),
    );
  }
}
