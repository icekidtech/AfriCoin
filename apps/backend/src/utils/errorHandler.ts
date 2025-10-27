export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export const errorResponses = {
  INVALID_PHONE: { statusCode: 400, message: "Invalid phone number format" },
  INVALID_PIN: { statusCode: 400, message: "PIN must be 4 digits" },
  INVALID_NAME: { statusCode: 400, message: "Name must be 2-100 characters" },
  PHONE_EXISTS: { statusCode: 409, message: "User already exists" },
  USER_NOT_FOUND: { statusCode: 404, message: "User not found" },
  INVALID_CREDENTIALS: { statusCode: 401, message: "Invalid PIN" },
  INSUFFICIENT_BALANCE: { statusCode: 400, message: "Insufficient balance" },
  INVALID_AMOUNT: { statusCode: 400, message: "Invalid amount" },
  RECIPIENT_NOT_FOUND: { statusCode: 404, message: "Recipient not found" },
  INTERNAL_ERROR: { statusCode: 500, message: "Internal server error" },
};