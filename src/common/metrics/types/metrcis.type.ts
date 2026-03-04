export interface NestRequest extends Request {
  route?: { path: string };
}
