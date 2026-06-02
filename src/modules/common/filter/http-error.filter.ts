/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getErrorMessage } from '../utils/error.utils';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const httpException =
      exception instanceof HttpException
        ? exception
        : new InternalServerErrorException(getErrorMessage(exception));

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = httpException.getStatus();
    const exceptionResponse = httpException.getResponse();

    response.status(status).json({
      status: status,
      success: false,
      data: null,
      error: {
        message:
          typeof exceptionResponse === 'object'
            ? (exceptionResponse as { message?: string | string[] }).message
            : exceptionResponse,
      },
    });
  }
}
