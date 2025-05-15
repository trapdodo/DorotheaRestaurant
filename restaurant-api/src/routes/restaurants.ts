import express, { Request, Response } from 'express';
import { query } from '../config/db';

const router = express.Router();

// Δοκιμαστικό endpoint
router.get('/test', async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'API is working!' });
});

// Λήψη όλων των εστιατορίων
router.get('/restaurants', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /restaurants request received', req.query);
    let sql = 'SELECT * FROM restaurant';
    const params: any[] = [];
    
    // Λειτουργία αναζήτησης
    if (req.query.search) {
      sql += ' WHERE name LIKE ? OR location LIKE ?';
      const searchTerm = `%${req.query.search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    console.log('Executing SQL:', sql, 'with params:', params);
    const restaurants = await query(sql, params);
    console.log('Restaurants found:', restaurants);
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Λήψη εστιατορίου με βάση το id
router.get('/restaurants/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurant = await query('SELECT * FROM restaurant WHERE id = ?', [id]);
    
    if (restaurant.length === 0) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    
    res.json(restaurant[0]);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 