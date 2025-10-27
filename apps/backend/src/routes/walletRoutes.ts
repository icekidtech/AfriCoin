import { Router, Request, Response } from "express";
import walletService from "../services/walletService.js";
import { validatePhoneNumber, validatePin, validateName } from "../utils/validators.js";
import { AppError, errorResponses } from "../utils/errorHandler.js";

const router: Router = Router();

router.post("/onboard", async (req: Request, res: Response, next) => {
  try {
    const { phone, name, pin } = req.body;

    if (!phone || !validatePhoneNumber(phone)) {
      throw new AppError(
        errorResponses.INVALID_PHONE.statusCode,
        errorResponses.INVALID_PHONE.message
      );
    }

    if (!name || !validateName(name)) {
      throw new AppError(
        errorResponses.INVALID_NAME.statusCode,
        errorResponses.INVALID_NAME.message
      );
    }

    if (!pin || !validatePin(pin)) {
      throw new AppError(
        errorResponses.INVALID_PIN.statusCode,
        errorResponses.INVALID_PIN.message
      );
    }

    const result = await walletService.createWallet(phone, name, pin);

    res.status(201).json({
      success: true,
      data: {
        phoneHash: result.phoneHash,
        walletAddress: result.walletAddress,
        message: "Wallet created successfully",
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/balance/:phoneHash", async (req: Request, res: Response, next) => {
  try {
    const { phoneHash } = req.params;

    const balance = await walletService.getBalance(phoneHash);

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    next(error);
  }
});

export default router;