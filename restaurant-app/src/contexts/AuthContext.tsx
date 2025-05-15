import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, userService } from '../services/api';

type User = {
  id: number;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('AuthContext: Έλεγχος κατάστασης ταυτοποίησης...');
        const isAuthenticated = await authService.isAuthenticated();
        
        if (isAuthenticated) {
          console.log('AuthContext: Ο χρήστης έχει ταυτοποιηθεί, γίνεται λήψη προφίλ...');
          // Αν υπάρχει το token, φόρτωσε το προφίλ του χρήστη
          const userProfile = await userService.getProfile();
          console.log('AuthContext: Το προφίλ χρήστη φορτώθηκε:', userProfile);
          setUser(userProfile);
          setIsLoggedIn(true);
        } else {
          console.log('AuthContext: Ο χρήστης δεν έχει ταυτοποιηθεί');
        }
      } catch (error) {
        console.error('AuthContext: Αποτυχία φόρτωσης χρήστη:', error);
        // Σε περίπτωση σφάλματος, διαγραφή του token και ορισμός ως αποσυνδεδεμένος
        await AsyncStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('AuthContext: Προσπάθεια σύνδεσης...');
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      console.log('AuthContext: Επιτυχής σύνδεση, λήφθηκε token');
      
      // Μετά τη σύνδεση, λήψη του προφίλ χρήστη
      console.log('AuthContext: Λήψη προφίλ χρήστη...');
      const userProfile = await userService.getProfile();
      console.log('AuthContext: Επιτυχής λήψη προφίλ:', userProfile);
      
      setUser(userProfile);
      setIsLoggedIn(true);
      return response;
    } catch (error) {
      console.error('AuthContext: Αποτυχία σύνδεσης:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    console.log('AuthContext: Προσπάθεια εγγραφής...');
    setLoading(true);
    try {
      const response = await authService.register(name, email, password);
      console.log('AuthContext: Επιτυχής εγγραφή');
      return response;
    } catch (error: any) {
      console.error('AuthContext: Αποτυχία εγγραφής:', error);
      
      // Παροχή λεπτομερέστερων πληροφοριών σφάλματος
      if (error.message === 'Network Error') {
        console.error('AuthContext: Σφάλμα δικτύου - Ελέγξτε αν ο διακομιστής λειτουργεί και αν το URL του API είναι σωστό');
        throw new Error('Αδυναμία σύνδεσης στον διακομιστή. Παρακαλώ ελέγξτε τη σύνδεσή σας στο διαδίκτυο και προσπαθήστε ξανά.');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Αποτυχία αποσύνδεσης:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}; 