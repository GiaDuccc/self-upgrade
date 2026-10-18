import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayloadUser } from '~/types';

const generateToken = (
  userInfo: JwtPayloadUser,
  secretSignature: string,
  tokenLife: string | number
): string => {
  try {
    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: tokenLife as SignOptions['expiresIn'],
    };
    return jwt.sign(userInfo, secretSignature, options);
  } catch (error) {
    throw new Error(
      `Error generating token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

const verifyToken = (token: string, secretSignature: string): JwtPayloadUser => {
  try {
    return jwt.verify(token, secretSignature) as JwtPayloadUser;
  } catch (error) {
    throw new Error(
      `Error verifying token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const JwtProvider = {
  generateToken,
  verifyToken,
};

