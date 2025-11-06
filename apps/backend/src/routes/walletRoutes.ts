import { Router, Request, Response } from "express";
import { walletService } from "../services/walletService.js";
import { hashPhone } from "../utils/phoneHash.js";
import { validatePhoneNumber, validatePin, validateName } from "../utils/validators.js";
import { AppError, errorResponses } from "../utils/errorHandler.js";
import { fundWallet, recordFundingTransaction } from "../controllers/walletController.js";
import { authMiddleware } from "../middleware/auth.js";

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

    const phoneHash = hashPhone(phone);

    const result = await walletService.createWallet(
      phoneHash,
      name,
      pin,
      phone
    );

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

router.post("/verify-pin", async (req: Request, res: Response, next) => {
  try {
    const { phoneHash, pin } = req.body;

    if (!phoneHash || !pin) {
      throw new AppError(400, "Phone hash and PIN are required");
    }

    if (!validatePin(pin)) {
      throw new AppError(
        errorResponses.INVALID_PIN.statusCode,
        errorResponses.INVALID_PIN.message
      );
    }

    const isValid = await walletService.verifyPin(phoneHash, pin);

    res.json({
      success: true,
      data: {
        verified: isValid,
        message: "PIN verified successfully",
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

/**
 * POST /api/wallet/fund
 * Fund wallet (mobile money, bank transfer, or wallet)
 */
router.post(
  "/fund",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Validate required fields
      const { amount, phoneHash, method, currency = "KES" } = req.body;

      if (!amount) {
        throw new AppError(400, "Amount is required");
      }

      if (!phoneHash) {
        throw new AppError(400, "Phone hash is required");
      }

      if (!method || !["mobileMoney", "bankTransfer", "wallet"].includes(method)) {
        throw new AppError(
          400,
          "Invalid funding method. Must be: mobileMoney, bankTransfer, or wallet"
        );
      }

      // Call the funding controller
      await fundWallet(req, res);
    } catch (error) {
      // Handle error
    }
  }
);

/**
 * POST /api/wallet/record-funding
 * NEW: Record crypto wallet funding transaction
 */
router.post(
  "/record-funding",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Validate required fields
      const { txHash, amount, fromAddress, toAddress, method } = req.body;

      if (!txHash) {
        throw new AppError(400, "Transaction hash is required");
      }

      if (!amount) {
        throw new AppError(400, "Amount is required");
      }

      if (!fromAddress) {
        throw new AppError(400, "From address is required");
      }

      if (!toAddress) {
        throw new AppError(400, "To address is required");
      }

      if (!method) {
        throw new AppError(400, "Funding method is required");
      }

      // Call the recording controller
      await recordFundingTransaction(req, res);
    } catch (error) {
      // Handle error
    }
  }
);

/**
 * POST /api/wallet/connect-deposit-wallet
 * Connect crypto wallet for deposits
 */
router.post(
  "/connect-deposit-wallet",
  authMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const { phoneHash, depositWalletAddress } = req.body;

      if (!phoneHash || !depositWalletAddress) {
        throw new AppError(400, "phoneHash and depositWalletAddress required");
      }

      const result = await walletService.connectDepositWallet(
        phoneHash,
        depositWalletAddress
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
