import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/db';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Λήψη όλων των κρατήσεων για τον αυθεντικοποιημένο χρήστη
router.get('/reservations', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user_id = req.user.userId;

    // Λήψη όλων των κρατήσεων του χρήστη με λεπτομέρειες εστιατορίου
    const reservations = await query(
      `SELECT r.*, res.name as restaurant_name, res.location as restaurant_location 
       FROM reservation r 
       JOIN restaurant res ON r.restaurant_id = res.id 
       WHERE r.user_id = ? 
       ORDER BY r.date DESC, r.time DESC`,
      [user_id]
    );

    // Μετατροπή των τιμών BigInt σε κανονικούς αριθμούς
    const formattedReservations = reservations.map((reservation: any) => {
      // Διασφάλιση ότι η ημερομηνία είναι σε μορφή YYYY-MM-DD
      const date = new Date(reservation.date);
      const formattedDate = date.toISOString().split('T')[0];
      
      // Διασφάλιση ότι η ώρα είναι σε μορφή HH:MM
      const time = reservation.time;
      const [hours, minutes] = time.split(':');
      const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      
      return {
        id: Number(reservation.id),
        restaurant_id: Number(reservation.restaurant_id),
        restaurant_name: reservation.restaurant_name,
        restaurant_location: reservation.restaurant_location,
        date: formattedDate,
        time: formattedTime,
        people_count: Number(reservation.people_count)
      };
    });

    res.json(formattedReservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Δημιουργία κράτησης
router.post(
  '/reservations',
  [
    auth,
    body('restaurant_id').isNumeric().withMessage('Restaurant ID is required'),
    body('date').isDate().withMessage('Valid date is required'),
    body('time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time is required (HH:MM)'),
    body('people_count').isInt({ min: 1 }).withMessage('Number of people must be at least 1')
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { restaurant_id, date, time, people_count } = req.body;
      const user_id = req.user.userId;

      // Έλεγχος αν υπάρχει το εστιατόριο
      const restaurant = await query('SELECT * FROM restaurant WHERE id = ?', [restaurant_id]);
      if (restaurant.length === 0) {
        res.status(404).json({ message: 'Restaurant not found' });
        return;
      }

      // Δημιουργία κράτησης
      const result = await query(
        'INSERT INTO reservation (user_id, restaurant_id, date, time, people_count) VALUES (?, ?, ?, ?, ?)',
        [user_id, restaurant_id, date, time, people_count]
      );

      // Μετατροπή των τιμών BigInt σε κανονικούς αριθμούς για αποφυγή προβλημάτων σειριοποίησης
      const reservationId = Number(result.insertId);
      
      res.status(201).json({
        id: reservationId,
        user_id: Number(user_id),
        restaurant_id: Number(restaurant_id),
        date,
        time,
        people_count: Number(people_count)
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Ενημέρωση κράτησης
router.put(
  '/reservations/:id',
  [
    auth,
    body('date').optional().isDate().withMessage('Valid date is required'),
    body('time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time is required (HH:MM)'),
    body('people_count').optional().isInt({ min: 1 }).withMessage('Number of people must be at least 1')
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { id } = req.params;
      const user_id = req.user.userId;
      const { date, time, people_count } = req.body;

      // Έλεγχος αν η κράτηση υπάρχει και ανήκει στον χρήστη
      const reservation = await query(
        'SELECT * FROM reservation WHERE id = ? AND user_id = ?',
        [id, user_id]
      );

      if (reservation.length === 0) {
        res.status(404).json({ message: 'Reservation not found or not authorized' });
        return;
      }

      // Δυναμική δημιουργία ερωτήματος ενημέρωσης με βάση τα πεδία που παρέχονται
      let updateQuery = 'UPDATE reservation SET';
      const updateParams: any[] = [];

      if (date) {
        updateQuery += ' date = ?,';
        updateParams.push(date);
      }

      if (time) {
        updateQuery += ' time = ?,';
        updateParams.push(time);
      }

      if (people_count) {
        updateQuery += ' people_count = ?,';
        updateParams.push(people_count);
      }

      // Αφαίρεση του τελευταίου κόμματος
      updateQuery = updateQuery.slice(0, -1);

      // Προσθήκη της συνθήκης where
      updateQuery += ' WHERE id = ? AND user_id = ?';
      updateParams.push(id, user_id);

      // Ενημέρωση κράτησης αν παρέχονται πεδία
      if (updateParams.length > 2) {
        await query(updateQuery, updateParams);
        res.json({ message: 'Reservation updated successfully' });
      } else {
        res.status(400).json({ message: 'No fields to update' });
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Διαγραφή κράτησης
router.delete('/reservations/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId;

    // Έλεγχος αν η κράτηση υπάρχει και ανήκει στον χρήστη
    const reservation = await query(
      'SELECT * FROM reservation WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (reservation.length === 0) {
      res.status(404).json({ message: 'Reservation not found or not authorized' });
      return;
    }

    // Διαγραφή κράτησης
    await query('DELETE FROM reservation WHERE id = ? AND user_id = ?', [id, user_id]);

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 