import { Router, Request, Response } from "express";
import otpService from "../services/otpService";
import { validatePhoneNumber } from "../utils/validators";
import { AppError, errorResponses } from "../utils/errorHandler";

const router: any = Router();

// Send OTP
interface SendOTPRequestBody {
    phone: string;
}

interface SendOTPResult {
    success: boolean;
    message: string;
}

router.post(
    "/send",
    async (
        req: Request<any, any, SendOTPRequestBody>,
        res: Response,
        next: (err?: any) => void
    ) => {
        try {
            const { phone } = req.body;

            if (!phone || !validatePhoneNumber(phone)) {
                throw new AppError(
                    errorResponses.INVALID_PHONE.statusCode,
                    errorResponses.INVALID_PHONE.message
                );
            }

            const result: SendOTPResult = await otpService.sendOTP(phone);

            res.json({
                success: true,
                data: {
                    message: result.message,
                    expiresIn: "10 minutes",
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Verify OTP
interface VerifyOTPRequestBody {
    phone: string;
    code: string;
}

interface VerifyOTPResult {
    success: boolean;
    message?: string;
}

router.post(
    "/verify",
    async (
        req: Request<any, any, VerifyOTPRequestBody>,
        res: Response,
        next: (err?: any) => void
    ) => {
        try {
            const { phone, code } = req.body;

            if (!phone || !validatePhoneNumber(phone)) {
                throw new AppError(
                    errorResponses.INVALID_PHONE.statusCode,
                    errorResponses.INVALID_PHONE.message
                );
            }

            if (!code || !/^\d{4,6}$/.test(code)) {
                throw new AppError(400, "Invalid OTP code format");
            }

            const result: VerifyOTPResult = await otpService.verifyOTP(phone, code);

            res.json({
                success: true,
                data: {
                    message: "Phone verified successfully",
                    verified: result.success,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Resend OTP
interface ResendOTPRequestBody {
    phone: string;
}

interface ResendOTPResult {
    success: boolean;
    message: string;
}

router.post(
    "/resend",
    async (
        req: Request<any, any, ResendOTPRequestBody>,
        res: Response,
        next: (err?: any) => void
    ) => {
        try {
            const { phone } = req.body;

            if (!phone || !validatePhoneNumber(phone)) {
                throw new AppError(
                    errorResponses.INVALID_PHONE.statusCode,
                    errorResponses.INVALID_PHONE.message
                );
            }

            const result: ResendOTPResult = await otpService.resendOTP(phone);

            res.json({
                success: true,
                data: {
                    message: result.message,
                    expiresIn: "10 minutes",
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;