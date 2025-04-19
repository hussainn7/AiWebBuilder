import { Request, Response } from 'express';
import User from '../models/User.js';

const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching profile' });
  }
};

const updateProfile = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, profilePicture } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      firstName,
      lastName,
      profilePicture,
    });

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Error updating profile' });
  }
};

export { getProfile, updateProfile }; 