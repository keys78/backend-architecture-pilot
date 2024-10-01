import { HttpError } from './httpError';

export class ValidationError extends HttpError {
  constructor(message: string = 'Validation Error') {
    super(400, message);
  }
}
