import DateTimePicker from '@react-native-community/datetimepicker';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Portal, SegmentedButtons, Text } from 'react-native-paper';
import { MainStackParamList, TabParamList } from '../navigation/AppNavigator';
import { reservationService, restaurantService } from '../services/api';

type RestaurantDetailScreenRouteProp = RouteProp<MainStackParamList, 'RestaurantDetail'>;
type RestaurantDetailScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'RestaurantDetail'>;
const Tab = createBottomTabNavigator<TabParamList>();

type Restaurant = {
  id: number;
  name: string;
  location: string;
  description: string;
};

const getRestaurantImage = (name: string) => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('italian') || lowerName.includes('pizza') || lowerName.includes('pasta')) {
    return 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=800';
  } else if (lowerName.includes('sushi') || lowerName.includes('japan')) {
    return 'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=800';
  } else if (lowerName.includes('burger') || lowerName.includes('joint')) {
    return 'https://images.pexels.com/photos/1251198/pexels-photo-1251198.jpeg?auto=compress&cs=tinysrgb&w=800';
  } else if (lowerName.includes('spice') || lowerName.includes('indian')) {
    return 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800';
  } else {
    // Default restaurant image
    return 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=800';
  }
};

const RestaurantDetailScreen = () => {
  const route = useRoute<RestaurantDetailScreenRouteProp>();
  const navigation = useNavigation<RestaurantDetailScreenNavigationProp>();
  const { restaurantId } = route.params;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservationVisible, setReservationVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const data = await restaurantService.getById(restaurantId);
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      Alert.alert('Error', 'Failed to load restaurant details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurant();
  }, [restaurantId]);

  const handleReservation = async () => {
    setSubmitting(true);
    
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const formattedTime = selectedTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      await reservationService.create({
        restaurant_id: restaurantId,
        date: formattedDate,
        time: formattedTime,
        people_count: selectedPeople
      });
      
      setReservationVisible(false);
      Alert.alert(
        'Reservation Confirmed',
        'Your reservation has been successfully created!',
        [
          { 
            text: 'OK',
            onPress: () => {
              // Navigate to the Profile tab
              navigation.getParent()?.navigate('Profile');
            }
          }
        ]
      );
      
      // Reset form
      setSelectedDate(new Date());
      setSelectedTime(new Date());
      setSelectedPeople(2);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading restaurant details...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Restaurant not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.cardWrapper}>
        <Card style={styles.card}>
          <Image 
            source={{ uri: getRestaurantImage(restaurant.name) }} 
            style={styles.cardImage}
            resizeMode="cover"
          />
          <Card.Content style={styles.cardContent}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.restaurantLocation}>{restaurant.location}</Text>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.restaurantDescription}>
              {restaurant.description || 'No description available'}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.reservationContainer}>
        <Button 
          mode="contained" 
          style={styles.reservationButton}
          onPress={() => setReservationVisible(true)}
        >
          Make Reservation
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={reservationVisible}
          onDismiss={() => setReservationVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Make a Reservation</Dialog.Title>
          <Dialog.Content>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Date</Text>
              <Button 
                mode="outlined" 
                onPress={() => setShowDatePicker(true)}
                style={styles.pickerButton}
              >
                {selectedDate.toLocaleDateString()}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}

              <Text style={styles.pickerLabel}>Time</Text>
              <Button 
                mode="outlined" 
                onPress={() => setShowTimePicker(true)}
                style={styles.pickerButton}
              >
                {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Button>
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, time) => {
                    setShowTimePicker(false);
                    if (time) {
                      setSelectedTime(time);
                    }
                  }}
                />
              )}

              <Text style={styles.pickerLabel}>Number of People</Text>
              <View style={styles.segmentedButtonsContainer}>
                <SegmentedButtons
                  value={selectedPeople.toString()}
                  onValueChange={value => setSelectedPeople(parseInt(value))}
                  buttons={[
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                  ]}
                  style={[styles.segmentedButtons, styles.segmentedButtonsRow]}
                />
                <SegmentedButtons
                  value={selectedPeople.toString()}
                  onValueChange={value => setSelectedPeople(parseInt(value))}
                  buttons={[
                    { value: '5', label: '5' },
                    { value: '6', label: '6' },
                    { value: '7', label: '7' },
                    { value: '8', label: '8' },
                  ]}
                  style={[styles.segmentedButtons, styles.segmentedButtonsRow]}
                />
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReservationVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleReservation}
              loading={submitting}
              disabled={submitting}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
  },
  cardWrapper: {
    margin: 10,
    borderRadius: 10,
    // Σκιά για iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Σκιά για Android και Web
    elevation: 2,
    backgroundColor: 'white',
    // Ειδικό για Web: κεντράρισμα και περιορισμός πλάτους
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardImage: {
    height: 220,
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    objectFit: 'cover',
    // Ειδικό για Web: ορισμός ελάχιστου ύψους για αναλογία διαστάσεων
    minHeight: 180,
    maxHeight: 300,
  },
  cardContent: {
    padding: 15,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  restaurantLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  restaurantDescription: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  reservationContainer: {
    padding: 15,
  },
  reservationButton: {
    marginTop: 10,
  },
  dialog: {
    borderRadius: 15,
  },
  pickerContainer: {
    padding: 10,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  pickerButton: {
    marginBottom: 20,
  },
  segmentedButtonsContainer: {
    marginBottom: 10,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  segmentedButtonsRow: {
    width: '100%',
  },
});

export default RestaurantDetailScreen; 