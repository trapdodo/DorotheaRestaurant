import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// Εισαγωγή οθονών
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import RestaurantListScreen from '../screens/RestaurantListScreen';
import SignupScreen from '../screens/SignupScreen';

// Εισαγωγή context ταυτοποίησης
import { useAuth } from '../contexts/AuthContext';

// Ορισμός τύπων για την πλοήγηση
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  RestaurantList: undefined;
  RestaurantDetail: { restaurantId: number };
};

export type TabParamList = {
  Restaurants: undefined;
  Profile: undefined;
};

// Δημιουργία stack navigators
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Stack Εστιατορίων
const RestaurantStackNavigator = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen 
        name="RestaurantList" 
        component={RestaurantListScreen} 
        options={{ title: 'Restaurants' }}
      />
      <MainStack.Screen 
        name="RestaurantDetail" 
        component={RestaurantDetailScreen} 
        options={{ title: 'Restaurant Details' }}
      />
    </MainStack.Navigator>
  );
};

// Κύριος Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Restaurants') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff6b6b',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Restaurants" 
        component={RestaurantStackNavigator} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }}
      />
    </Tab.Navigator>
  );
};

// Auth Stack Navigator
const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
    </AuthStack.Navigator>
  );
};

// Κύριος Navigator Εφαρμογής
export const AppNavigator = () => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  console.log('AppNavigator: Rendering with isLoggedIn =', isLoggedIn);

  return (
    <NavigationContainer>
      {isLoggedIn ? <TabNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  }
}); 