import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Button,
  ImageBackground, Alert, ActivityIndicator
} from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

const Event = ({ route, navigation }) => {
  const { groupName, sliceName, username } = route.params;
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const groupDocRef = doc(db, 'groups', groupName);
        const groupDocSnap = await getDoc(groupDocRef);

        if (groupDocSnap.exists()) {
          const data = groupDocSnap.data();
          const sliceData = data?.slices[sliceName];

          if (sliceData) {
            setEventData(sliceData);
          } else {
            Alert.alert("Error", "Event not found.");
          }
        } else {
          Alert.alert("Error", "Group not found.");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to fetch event data.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [groupName, sliceName]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading event...</Text>
      </View>
    );
  }

  if (!eventData) {
    return <Text>No event data available.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Event Image with Title if imageUri exists */}
      {eventData.imageUri ? (
        <ImageBackground
          source={{ uri: eventData.imageUri }}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <Text style={styles.imageText}>{sliceName}</Text>
        </ImageBackground>
      ) : null}

      {/* Event Details */}
      <View style={styles.eventDetails}>
        <Text style={styles.description}>{eventData.description}</Text>
        <Text style={styles.time}>
          {eventData.startTime} - {eventData.endTime}
        </Text>
        <Text style={styles.days}>
          {eventData.days?.join(', ') || 'No days assigned'}
        </Text>
      </View>

      <Button title="Go to Group Screen" onPress={() => navigation.navigate('GroupScreen', { username })} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBackground: {
    width: '100%',
    height: 220,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 16,
  },
  imageStyle: {
    resizeMode: 'cover',
    opacity: 0.75,
  },
  imageText: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventDetails: {
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 18,
    marginBottom: 10,
  },
  time: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  days: {
    fontSize: 16,
    color: '#666',
  },
});

export default Event;
