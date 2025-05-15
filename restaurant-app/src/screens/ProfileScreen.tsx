import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Divider, Portal, SegmentedButtons, Text } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { reservationService, userService } from '../services/api';

type Reservation = {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_location: string;
  date: string;
  time: string;
  people_count: number;
};

type User = {
  id: number;
  name: string;
  email: string;
};

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // Κατάσταση επεξεργασίας κράτησης
  const [editSelectedDate, setEditSelectedDate] = useState(new Date());
  const [editSelectedTime, setEditSelectedTime] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [editSelectedPeople, setEditSelectedPeople] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Λήψη προφίλ χρήστη
      const userProfile = await userService.getProfile();
      setProfile(userProfile);
      
      // Λήψη κρατήσεων χρήστη
      const userReservations = await reservationService.getUserReservations();
      console.log('Fetched reservations:', userReservations);
      setReservations(userReservations);
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load your profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('Profile screen focused, refreshing data...');
      fetchUserData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const handleEditReservation = (reservation: Reservation) => {
    console.log('Editing reservation:', reservation);
    setSelectedReservation(reservation);
    
    try {
      // Ανάλυση του string ημερομηνίας (μορφή: YYYY-MM-DD)
      const [year, month, day] = reservation.date.split('-').map(Number);
      const reservationDate = new Date(year, month - 1, day);
      
      // Ανάλυση του string ώρας (μορφή: HH:MM)
      const [hours, minutes] = reservation.time.split(':').map(Number);
      const reservationTime = new Date(year, month - 1, day, hours, minutes);
      
      console.log('Original date string:', reservation.date);
      console.log('Original time string:', reservation.time);
      console.log('Parsed date:', reservationDate);
      console.log('Parsed time:', reservationTime);
      
      if (isNaN(reservationDate.getTime()) || isNaN(reservationTime.getTime())) {
        throw new Error('Invalid date or time format');
      }
      
      setEditSelectedDate(reservationDate);
      setEditSelectedTime(reservationTime);
      setEditSelectedPeople(reservation.people_count);
      setEditDialogVisible(true);
    } catch (error) {
      console.error('Error parsing date/time:', error);
      Alert.alert(
        'Error',
        'Failed to load reservation details. Please try again or contact support if the problem persists.'
      );
    }
  };

  const handleCancelReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setCancelDialogVisible(true);
  };

  const confirmEditReservation = async () => {
    if (!selectedReservation) return;
    
    setSubmitting(true);
    
    try {
      // Μορφοποίηση ημερομηνίας ως YYYY-MM-DD χρησιμοποιώντας τοπική ημερομηνία
      const year = editSelectedDate.getFullYear();
      const month = String(editSelectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(editSelectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Μορφοποίηση ώρας ως HH:MM χρησιμοποιώντας τοπική ώρα
      const hours = String(editSelectedTime.getHours()).padStart(2, '0');
      const minutes = String(editSelectedTime.getMinutes()).padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;

      console.log('Updating reservation with:', {
        id: selectedReservation.id,
        date: formattedDate,
        time: formattedTime,
        people_count: editSelectedPeople
      });

      await reservationService.update(selectedReservation.id, {
        date: formattedDate,
        time: formattedTime,
        people_count: editSelectedPeople
      });
      
      setEditDialogVisible(false);
      Alert.alert('Success', 'Your reservation has been updated');
      fetchUserData();
    } catch (error: any) {
      console.error('Error updating reservation:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancelReservation = async () => {
    if (!selectedReservation) return;
    
    setSubmitting(true);
    
    try {
      await reservationService.delete(selectedReservation.id);
      setCancelDialogVisible(false);
      Alert.alert('Success', 'Your reservation has been cancelled');
      fetchUserData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderReservationItem = ({ item }: { item: Reservation }) => (
    <Card style={styles.reservationCard}>
      <Card.Content>
        <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
        <Text style={styles.restaurantLocation}>{item.restaurant_location}</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{item.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>People:</Text>
            <Text style={styles.detailValue}>{item.people_count}</Text>
          </View>
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="outlined" 
          onPress={() => handleEditReservation(item)}
          style={styles.actionButton}
        >
          Edit
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => handleCancelReservation(item)}
          style={[styles.actionButton, styles.cancelButton]}
        >
          Cancel
        </Button>
      </Card.Actions>
    </Card>
  );

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
    profileSection: {
      padding: 20,
      backgroundColor: 'white',
      alignItems: 'center',
      elevation: 2,
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 5,
      color: '#333',
    },
    profileEmail: {
      fontSize: 16,
      color: '#666',
      marginBottom: 15,
    },
    logoutButton: {
      borderColor: '#8B0000',
      borderWidth: 1,
    },
    divider: {
      height: 1,
      backgroundColor: '#e0e0e0',
    },
    reservationsSection: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      margin: 15,
      color: '#333',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: '#888',
      textAlign: 'center',
    },
    listContainer: {
      padding: 10,
      paddingBottom: 20,
    },
    reservationCard: {
      marginBottom: 15,
      borderRadius: 10,
      overflow: 'hidden',
      elevation: 2,
    },
    restaurantName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
      color: '#333',
    },
    restaurantLocation: {
      fontSize: 14,
      color: '#666',
      marginBottom: 10,
    },
    detailsContainer: {
      marginTop: 5,
    },
    detailItem: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#8B0000',
      width: 60,
    },
    detailValue: {
      fontSize: 14,
      color: '#555',
    },
    cardActions: {
      justifyContent: 'flex-end',
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
    },
    actionButton: {
      marginLeft: 8,
      borderColor: '#8B0000',
    },
    cancelButton: {
      borderColor: '#d32f2f',
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

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Text style={styles.profileName}>{profile?.name || user?.name}</Text>
        <Text style={styles.profileEmail}>{profile?.email || user?.email}</Text>
        <Button 
          mode="outlined" 
          onPress={logout}
          style={styles.logoutButton}
        >
          Log Out
        </Button>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.reservationsSection}>
        <Text style={styles.sectionTitle}>My Reservations</Text>
        
        {reservations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You don't have any reservations yet</Text>
          </View>
        ) : (
          <FlatList
            data={reservations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderReservationItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#ff6b6b']}
              />
            }
          />
        )}
      </View>

      {/* Διάλογος Επεξεργασίας Κράτησης */}
      <Portal>
        <Dialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Edit Reservation</Dialog.Title>
          <Dialog.Content>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Date</Text>
              <Button 
                mode="outlined" 
                onPress={() => setShowEditDatePicker(true)}
                style={styles.pickerButton}
              >
                {editSelectedDate.toLocaleDateString()}
              </Button>
              {showEditDatePicker && (
                <DateTimePicker
                  value={editSelectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowEditDatePicker(false);
                    if (date) {
                      setEditSelectedDate(date);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}

              <Text style={styles.pickerLabel}>Time</Text>
              <Button 
                mode="outlined" 
                onPress={() => setShowEditTimePicker(true)}
                style={styles.pickerButton}
              >
                {editSelectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Button>
              {showEditTimePicker && (
                <DateTimePicker
                  value={editSelectedTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, time) => {
                    setShowEditTimePicker(false);
                    if (time) {
                      setEditSelectedTime(time);
                    }
                  }}
                />
              )}

              <Text style={styles.pickerLabel}>Number of People</Text>
              <View style={styles.segmentedButtonsContainer}>
                <SegmentedButtons
                  value={editSelectedPeople.toString()}
                  onValueChange={value => setEditSelectedPeople(parseInt(value))}
                  buttons={[
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                  ]}
                  style={[styles.segmentedButtons, styles.segmentedButtonsRow]}
                />
                <SegmentedButtons
                  value={editSelectedPeople.toString()}
                  onValueChange={value => setEditSelectedPeople(parseInt(value))}
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
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={confirmEditReservation}
              loading={submitting}
              disabled={submitting}
            >
              Save Changes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Διάλογος Ακύρωσης Κράτησης */}
      <Portal>
        <Dialog
          visible={cancelDialogVisible}
          onDismiss={() => setCancelDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Cancel Reservation</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to cancel your reservation at {selectedReservation?.restaurant_name}?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelDialogVisible(false)}>No, Keep It</Button>
            <Button 
              onPress={confirmCancelReservation}
              loading={submitting}
              disabled={submitting}
              color="#d32f2f"
            >
              Yes, Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default ProfileScreen; 