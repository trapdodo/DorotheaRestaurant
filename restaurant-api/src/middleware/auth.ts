import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

dotenv.config();

// Επέκταση του interface Request για να συμπεριλάβει την ιδιότητα user
export interface AuthRequest extends Request {
  user?: any;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Λήψη του token από την κεφαλίδα
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: 'No authentication token, access denied' });
      return;
    }
    
    // Επαλήθευση του token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // Προσθήκη του χρήστη από το payload
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 