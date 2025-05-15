# Σύστημα Κρατήσεων Εστιατορίων

Μια πλήρης εφαρμογή κρατήσεων εστιατορίων με frontend σε React Native για κινητά και backend σε Node.js.

## Δομή Έργου

- `restaurant-app/`: Εφαρμογή React Native Expo για το frontend κινητών
- `restaurant-api/`: API backend σε Node.js με Express και MariaDB

## Χαρακτηριστικά

- Ταυτοποίηση χρήστη (σύνδεση & εγγραφή)
- Περιήγηση εστιατορίων με λειτουργία αναζήτησης
- Προβολή λεπτομερειών εστιατορίου
- Πραγματοποίηση κρατήσεων εστιατορίου
- Προβολή, επεξεργασία και ακύρωση κρατήσεων
- Διαχείριση προφίλ χρήστη

## Frontend (React Native)

Το frontend έχει κατασκευαστεί με React Native και Expo, με χαρακτηριστικά:

- React Navigation για διαχείριση πλοήγησης
- React Context API για διαχείριση καταστάσεων
- React Native Paper για στοιχεία διεπαφής χρήστη
- Axios για επικοινωνία με το API

## Backend (Node.js)

Το backend έχει κατασκευαστεί με Node.js και Express, με χαρακτηριστικά:

- REST API με ταυτοποίηση JWT
- Ενσωμάτωση βάσης δεδομένων MariaDB
- Επικύρωση εισόδου με express-validator
- Κρυπτογράφηση κωδικών πρόσβασης με bcrypt

## Ξεκινώντας

### Προαπαιτούμενα

- Node.js
- npm ή yarn
- MariaDB

### Ρύθμιση Βάσης Δεδομένων

1. Εγκαταστήστε το MariaDB
2. Δημιουργήστε μια βάση δεδομένων με όνομα `restaurant_db`
3. Ενημερώστε τις λεπτομέρειες σύνδεσης της βάσης δεδομένων στο `restaurant-api/.env`

### Ρύθμιση Backend

1. Μεταβείτε στον κατάλογο του backend:
   ```
   cd restaurant-api
   ```

2. Εγκαταστήστε τις εξαρτήσεις:
   ```
   npm install
   ```

3. Διαμορφώστε τις μεταβλητές περιβάλλοντος:
   ```
   PORT=3000
   JWT_SECRET=your_secret_key
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=restaurant_db
   ```

4. Ξεκινήστε τον διακομιστή backend:
   ```
   npm run dev
   ```

### Ρύθμιση Frontend

1. Μεταβείτε στον κατάλογο του frontend:
   ```
   cd restaurant-app
   ```

2. Εγκαταστήστε τις εξαρτήσεις:
   ```
   npm install
   ```

3. Ενημερώστε τη διαμόρφωση του API στο `src/services/api.ts` αν χρειάζεται (η προεπιλογή είναι http://10.0.2.2:3000/api για τον εξομοιωτή Android)

4. Ξεκινήστε την εφαρμογή frontend:
   ```
   npm start
   ```

5. Ακολουθήστε τις οδηγίες του Expo για να τρέξετε σε εξομοιωτή iOS ή Android/συσκευή

## Τελικά σημεία API

- **POST /api/register** - Εγγραφή νέου χρήστη
- **POST /api/login** - Σύνδεση και λήψη JWT token
- **GET /api/restaurants** - Λήψη όλων των εστιατορίων (με προαιρετικό ερώτημα αναζήτησης)
- **GET /api/restaurants/:id** - Λήψη εστιατορίου με ID
- **POST /api/reservations** - Δημιουργία νέας κράτησης
- **PUT /api/reservations/:id** - Ενημέρωση κράτησης
- **DELETE /api/reservations/:id** - Ακύρωση κράτησης
- **GET /api/user/reservations** - Λήψη κρατήσεων χρήστη
- **GET /api/user/profile** - Λήψη προφίλ χρήστη
