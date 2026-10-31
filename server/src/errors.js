// Errors that carry an HTTP status and a stable machine-readable code.

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (code, message, details) => new HttpError(400, code, message, details);
export const unauthorized = (message = 'Sign in first') => new HttpError(401, 'unauthorized', message);
export const forbidden = (message = 'You are not allowed to do that') => new HttpError(403, 'forbidden', message);
export const notFound = (message = 'Not found') => new HttpError(404, 'not_found', message);
export const conflict = (code, message, details) => new HttpError(409, code, message, details);
