import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number };
    const user = await User.findOne({ where: { id: decoded.id } });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

module.exports = { auth }; 