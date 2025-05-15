import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { initDb } from './config/db';
import authRoutes from './routes/auth';
import reservationRoutes from './routes/reservations';
import restaurantRoutes from './routes/restaurants';
import userRoutes from './routes/users';

// Φόρτωση μεταβλητών περιβάλλοντος
dotenv.config();

// Δημιουργία εφαρμογής Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Διαδρομές
app.use('/api', authRoutes);
app.use('/api', restaurantRoutes);
app.use('/api', reservationRoutes);
app.use('/api', userRoutes);

// Αρχικοποίηση βάσης δεδομένων και εκκίνηση διακομιστή
(async (): Promise<void> => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})(); 