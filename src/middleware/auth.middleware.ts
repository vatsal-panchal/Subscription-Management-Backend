import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { User } from '../models/User';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication token is required'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded: TokenPayload = verifyToken(token);
    const existingUser = await User.findById(decoded.userId);

    if (!existingUser) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
      return;
    }

    req.user = {
      id: existingUser._id.toString(),
      email: existingUser.email,
      role: existingUser.role
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
