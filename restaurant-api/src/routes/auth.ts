import bcrypt from 'bcrypt';
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';

const router = express.Router();

// Εγγραφή
router.post(
  '/register',
  [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password } = req.body;

    try {
      // Έλεγχος αν ο χρήστης υπάρχει ήδη
      const userExists = await query('SELECT * FROM user WHERE email = ?', [email]);
      
      if (userExists.length > 0) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }

      // Κρυπτογράφηση κωδικού
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Δημιουργία χρήστη
      const result = await query(
        'INSERT INTO user (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword]
      );

      // Λήψη του ID του νέου χρήστη
      const userId = Number(result.insertId);

      // Δημιουργία και υπογραφή JWT
      const payload = {
        userId,
        name,
        email
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.status(201).json({ 
            message: 'User registered successfully',
            token 
          });
        }
      );
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Σύνδεση
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    try {
      // Έλεγχος αν ο χρήστης υπάρχει
      const users = await query('SELECT * FROM user WHERE email = ?', [email]);
      
      if (users.length === 0) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
      }

      const user = users[0];

      // Έλεγχος κωδικού
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
      }

      // Δημιουργία και υπογραφή JWT
      const payload = {
        userId: user.id,
        name: user.name,
        email: user.email
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router; 