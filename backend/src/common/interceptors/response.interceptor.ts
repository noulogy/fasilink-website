import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponseEntity } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, IResponseEntity<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponseEntity<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((resData) => {
        // Jika response sudah berbentuk IResponseEntity, kembalikan langsung
        if (resData && typeof resData === 'object' && 'code' in resData && 'status' in resData) {
          return resData;
        }

        let data = resData;
        let meta = undefined;
        let message = 'Operasi berhasil dieksekusi';

        if (resData && typeof resData === 'object') {
          if ('data' in resData && ('meta' in resData || 'message' in resData)) {
            data = resData.data;
            meta = resData.meta;
            message = resData.message || message;
          }
        }

        return {
          code: statusCode,
          status: 'success',
          message,
          data,
          meta,
        };
      }),
    );
  }
}

