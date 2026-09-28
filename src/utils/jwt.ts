import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: 'USER' | 'ADMIN';
  email: string;
}

export const signToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn']
  });
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.verify(token, secret) as TokenPayload;
};
