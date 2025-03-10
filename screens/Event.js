import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Button, ImageBackground, Alert } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig'; // Adjust path as needed

const db = getFirestore(app);

const Event = ({ route, navigation }) => {
  const { groupName, sliceName, username } = route.params; // Get groupName and sliceName from route params
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch event details from Firestore based on groupName and sliceName
    const fetchEventData = async () => {
      try {
        const groupDocRef = doc(db, 'groups', groupName);
        const groupDocSnap = await getDoc(groupDocRef);

        if (groupDocSnap.exists()) {
          const data = groupDocSnap.data();
          const sliceData = data?.slices[sliceName];

          if (sliceData) {
            setEventData(sliceData); // Set event data if slice is found
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
    return <Text>Loading event...</Text>;
  }

  if (!eventData) {
    return <Text>No event data available.</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Display Slice Name */}
      <Text style={styles.title}>{eventData.name}</Text>

      {/* Event Image */}
      {eventData.imageUri && (
        <ImageBackground
          source={{ uri: eventData.imageUri }}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <Text style={styles.imageText}>{sliceName}</Text>
        </ImageBackground>
      )}

      {/* Event Details */}
      <View style={styles.eventDetails}>
        <Text style={styles.description}>{eventData.description}</Text>
        <Text style={styles.time}>
          {eventData.startTime} - {eventData.endTime}
        </Text>
        <Text style={styles.days}>{eventData.days ? eventData.days.join(', ') : 'No day assigned'}</Text>
      </View>

      <Button title="Go to Group Screen" onPress={() => navigation.navigate('GroupScreen', { username })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  imageBackground: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    opacity: 0.6,
  },
  imageText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  eventDetails: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 10,
  },
  time: {
    fontSize: 18,
    color: '#333',
  },
  days: {
    fontSize: 16,
    color: '#666',
  },
});

export default Event;
