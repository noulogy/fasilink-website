export interface IPaginationMeta {
  page: number;
  limit: number;
  totalData: number;
  totalDataPerPage: number;
  totalPages: number;
}

export interface IResponseEntity<T = any> {
  code: number;
  status: 'success' | 'error';
  message: string;
  data?: T;
  meta?: IPaginationMeta;
  errors?: Record<string, string[]>;
}

