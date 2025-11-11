// ✅ src/lib/errors.ts
export class AppError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = "APP_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMITED");
  }
}

export class ValidationError extends AppError {
  details?: any;
  constructor(message = "Invalid request", details?: any) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}
