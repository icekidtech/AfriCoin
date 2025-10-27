import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      phoneHash?: string;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const phoneHash = req.body.senderPhoneHash || req.params.phoneHash;

  if (!phoneHash) {
    return res.status(401).json({
      success: false,
      error: "Phone hash required",
    });
  }

  req.phoneHash = phoneHash;
  next();
};