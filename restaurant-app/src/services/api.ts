import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Καθορισμός του κατάλληλου URL του API με βάση την πλατφόρμα και το περιβάλλον
const getApiUrl = () => {
  // Χρησιμοποιήστε τη διεύθυνση IP του υπολογιστή σας για όλες τις πλατφόρμες
  return 'http://192.168.2.13:3000';
};

// Δημιουργία ενός instance του axios
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Αυξημένο χρονικό όριο για πιο αργές συνδέσεις
});

// Προσθήκη ενός interceptor αιτήματος για την προσθήκη του JWT token στα αιτήματα
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Υπηρεσίες ταυτοποίησης
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/login', { email, password });
    await AsyncStorage.setItem('auth_token', response.data.token);
    return response.data;
  },
  
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/api/register', { name, email, password });
    await AsyncStorage.setItem('auth_token', response.data.token);
    return response.data;
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
  },
  
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  }
};

// Υπηρεσίες εστιατορίων
export const restaurantService = {
  getAll: async (search?: string) => {
    console.log('Calling restaurant API with params:', search ? { search } : 'no params');
    const params = search ? { search } : {};
    try {
      const response = await api.get('/api/restaurants', { params });
      console.log('Restaurant API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Restaurant API error:', error);
      throw error;
    }
  },
  
  getById: async (id: number) => {
    try {
      const response = await api.get(`/api/restaurants/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }
};

// Υπηρεσίες κρατήσεων
export const reservationService = {
  create: async (reservation: {
    restaurant_id: number;
    date: string;
    time: string;
    people_count: number;
  }) => {
    const response = await api.post('/api/reservations', reservation);
    return response.data;
  },
  
  update: async (id: number, data: {
    date?: string;
    time?: string;
    people_count?: number;
  }) => {
    const response = await api.put(`/api/reservations/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/api/reservations/${id}`);
    return response.data;
  },
  
  getUserReservations: async () => {
    const response = await api.get('/api/reservations');
    return response.data;
  }
};

// Υπηρεσίες χρηστών
export const userService = {
  getProfile: async () => {
    const response = await api.get('/api/user/profile');
    return response.data;
  }
};

export default api; 