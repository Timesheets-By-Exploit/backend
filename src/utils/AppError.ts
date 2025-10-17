export default class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true,
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request", details?: any) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = "Unauthorized", details?: any) {
    return new AppError(message, 401, details);
  }

  static forbidden(message = "Forbidden", details?: any) {
    return new AppError(message, 403, details);
  }

  static notFound(message = "Not Found", details?: any) {
    return new AppError(message, 404, details);
  }

  static internal(message = "Internal Server Error", details?: any) {
    return new AppError(message, 500, details, false);
  }
}
