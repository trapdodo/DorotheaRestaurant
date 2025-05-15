import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Searchbar, Text } from 'react-native-paper';
import { MainStackParamList } from '../navigation/AppNavigator';
import { restaurantService } from '../services/api';

type Restaurant = {
  id: number;
  name: string;
  location: string;
  description: string;
};

type RestaurantListScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'RestaurantList'>;

// Αξιόπιστες εικόνες εστιατορίων ανά τύπο κουζίνας
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
    // Προεπιλεγμένη εικόνα εστιατορίου
    return 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=800';
  }
};

const RestaurantListScreen = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<RestaurantListScreenNavigationProp>();

  const fetchRestaurants = async (search = '') => {
    try {
      setLoading(true);
      console.log('RestaurantListScreen: Fetching restaurants with search:', search);
      const data = await restaurantService.getAll(search);
      console.log('RestaurantListScreen: Received restaurant data:', data);
      setRestaurants(data);
      setFilteredRestaurants(data);
    } catch (error) {
      console.error('RestaurantListScreen: Error fetching restaurants:', error);
      Alert.alert(
        'Error', 
        'Failed to load restaurants. Please check your network connection and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredRestaurants(restaurants);
    } else {
      // Local filtering
      const filtered = restaurants.filter(
        restaurant => 
          restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
          restaurant.location.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      fetchRestaurants(searchQuery);
    }
  };

  const handleRestaurantPress = (restaurantId: number) => {
    navigation.navigate('RestaurantDetail', { restaurantId });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
  };

  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity onPress={() => handleRestaurantPress(item.id)}>
      <View style={styles.cardWrapper}>
        <Card style={styles.card}>
          <Image 
            source={{ uri: getRestaurantImage(item.name) }} 
            style={styles.cardImage}
            resizeMode="cover"
          />
          <Card.Content style={styles.cardContent}>
            <Text style={styles.restaurantName}>{item.name}</Text>
            <Text style={styles.restaurantLocation}>{item.location}</Text>
            <Text style={styles.restaurantDescription} numberOfLines={2}>
              {item.description || 'No description available'}
            </Text>
          </Card.Content>
        </Card>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search restaurants by name or location"
        onChangeText={onChangeSearch}
        onSubmitEditing={handleSearchSubmit}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {filteredRestaurants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No restaurants found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRestaurantItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchBar: {
    margin: 10,
    elevation: 2,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  listContainer: {
    padding: 10,
  },
  cardWrapper: {
    borderRadius: 10,
    marginBottom: 30,
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
    // Ειδικό για Web: προσθήκη μετάβασης για hover
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '0.2s',
  },
  cardWrapperHover: {
    // Ειδικό για Web: εφέ hover
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    transform: [{ scale: 1.02 }],
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
    minHeight: 180,
    maxHeight: 300,
  },
  cardContent: {
    padding: 15,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  restaurantLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  restaurantDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});

export default RestaurantListScreen; 