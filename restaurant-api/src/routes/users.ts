import express, { Response } from 'express';
import { query } from '../config/db';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Λήψη κρατήσεων χρήστη
router.get('/user/reservations', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user_id = req.user.userId;
    
    const reservations = await query(`
      SELECT r.*, rest.name as restaurant_name, rest.location as restaurant_location 
      FROM reservation r
      JOIN restaurant rest ON r.restaurant_id = rest.id
      WHERE r.user_id = ?
      ORDER BY r.date DESC, r.time DESC
    `, [user_id]);
    
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Λήψη προφίλ χρήστη
router.get('/user/profile', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user_id = req.user.userId;
    
    const users = await query(
      'SELECT id, name, email FROM user WHERE id = ?',
      [user_id]
    );
    
    if (users.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 