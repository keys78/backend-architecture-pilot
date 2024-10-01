import { HttpError } from './httpError';

class NotFoundError extends HttpError {
  constructor(message: string = 'Not Found') {
    super(404, message);
  }
}
export default NotFoundError;
