import { Router, Request, Response } from "express";
import transferService from "../services/transferService.js";
import walletService from "../services/walletService.js";
import { validatePhoneNumber, validateAmount, validatePin } from "../utils/validators.js";
import { AppError, errorResponses } from "../utils/errorHandler.js";

const router: Router = Router();

router.post("/send", async (req: Request, res: Response, next) => {
  try {
    const { senderPhoneHash, recipientPhone, amount, pin } = req.body;

    if (!senderPhoneHash) {
      throw new AppError(400, "Sender phone hash required");
    }

    if (!recipientPhone || !validatePhoneNumber(recipientPhone)) {
      throw new AppError(
        errorResponses.INVALID_PHONE.statusCode,
        errorResponses.INVALID_PHONE.message
      );
    }

    if (!amount || !validateAmount(amount)) {
      throw new AppError(
        errorResponses.INVALID_AMOUNT.statusCode,
        errorResponses.INVALID_AMOUNT.message
      );
    }

    if (!pin || !validatePin(pin)) {
      throw new AppError(
        errorResponses.INVALID_PIN.statusCode,
        errorResponses.INVALID_PIN.message
      );
    }

    // Verify PIN
    await walletService.verifyPin(senderPhoneHash, pin);

    const result = await transferService.sendMoney(
      senderPhoneHash,
      recipientPhone,
      amount
    );

    res.status(201).json({
      success: true,
      data: {
        transactionHash: result.transactionHash,
        status: result.status,
        message: "Transaction completed successfully",
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/history/:phoneHash", async (req: Request, res: Response, next) => {
  try {
    const { phoneHash } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const transactions = await transferService.getTransactionHistory(phoneHash, limit);

    res.json({
      success: true,
      data: {
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;