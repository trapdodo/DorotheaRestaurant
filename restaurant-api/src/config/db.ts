import dotenv from 'dotenv';
import mariadb from 'mariadb';

dotenv.config();

// Δημιουργία μιας δεξαμενής σύνδεσης χωρίς καθορισμό της βάσης δεδομένων για αρχική ρύθμιση
const setupPool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: 5
});

// Δεξαμενή για κανονικές λειτουργίες, θα αρχικοποιηθεί μετά τη δημιουργία της βάσης δεδομένων
let pool: mariadb.Pool;

// Αρχικοποίηση της βάσης δεδομένων αν δεν υπάρχει
async function initializeDatabase(): Promise<void> {
  let conn;
  try {
    conn = await setupPool.getConnection();
    const dbName = process.env.DB_NAME;
    
    // Δημιουργία βάσης δεδομένων αν δεν υπάρχει
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database ${dbName} created or already exists`);
    
    // Αρχικοποίηση της κύριας δεξαμενής σύνδεσης
    pool = mariadb.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 5
    });
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

export async function query(sql: string, params?: any): Promise<any> {
  if (!pool) {
    throw new Error('Database connection not initialized. Call initDb() first.');
  }
  
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(sql, params);
    return result;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// Αρχικοποίηση βάσης δεδομένων με πίνακες αν δεν υπάρχουν
export async function initDb(): Promise<void> {
  try {
    // Πρώτα αρχικοποίηση της βάσης δεδομένων
    await initializeDatabase();
    
    // Δημιουργία πινάκων
    await query(`
      CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS restaurant (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS reservation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        restaurant_id INT NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        people_count INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
      )
    `);

    // Έλεγχος αν χρειάζεται η προσθήκη εστιατορίων στη βάση
    console.log('Checking if restaurants exist...');
    const restaurants = await query('SELECT COUNT(*) as count FROM restaurant');
    console.log('Restaurant count:', restaurants[0].count);
    
    // Μετατροπή του BigInt σε Number για σύγκριση - αυτό διορθώνει το πρόβλημα
    const restaurantCount = Number(restaurants[0].count);
    console.log('Restaurant count (as number):', restaurantCount);
    
    // Προσθήκη εστιατορίων μόνο αν δεν υπάρχουν (μην προσπαθήσετε να τα διαγράψετε)
    if (restaurantCount === 0) {
      await query(`
        INSERT INTO restaurant (name, location, description) VALUES 
        ('Italian Delight', 'Downtown, 123 Main St', 'Authentic Italian cuisine with a modern twist. Featuring handmade pasta and wood-fired pizzas.'),
        ('Sushi Heaven', 'Westside Mall, 456 Ocean Ave', 'Premium sushi and Japanese delicacies prepared by master chefs using fresh ingredients.'),
        ('Burger Joint', 'Uptown, 789 Broadway', 'Gourmet burgers made with locally sourced beef and fresh toppings, served with hand-cut fries.'),
        ('Spice Garden', 'Midtown, 321 Spice Blvd', 'Bold and flavorful Indian cuisine with vegetarian and vegan options. Famous for our curry dishes.')
      `);
      console.log('Restaurants added to the database');
    } else {
      console.log('Restaurants already exist, skipping seed data');
    }
    
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

export default { query, initDb }; 