import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { IResponseEntity } from '../dto/response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Terjadi kesalahan internal pada server.';
    let errors: Record<string, string[]> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const anyRes = res as any;
        message = anyRes.message || message;
        if (Array.isArray(anyRes.message)) {
          message = 'Validasi formulir gagal.';
          errors = {
            validation: anyRes.message,
          };
        } else if (anyRes.errors) {
          errors = anyRes.errors;
        }
      }
    } else {
      this.logger.error('Unhandled Exception:', exception);
      if (process.env.NODE_ENV !== 'production' && exception?.message) {
        message = exception.message;
      }
    }

    const errorResponse: IResponseEntity = {
      code: status,
      status: 'error',
      message,
      errors,
    };

    response.status(status).json(errorResponse);
  }
}

