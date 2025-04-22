import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, StatusBar
} from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';


const db = getFirestore(app);

const Event = ({ route, navigation }) => {
  const { groupName, sliceName, username } = route.params;
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      navigation.setOptions({ headerShown: false });
    }, [navigation]);

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
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (!eventData) {
    return <Text style={styles.errorText}>No event data available.</Text>;
  }

  return (
  <View style={{ flex: 1, backgroundColor: "black" }}>
    <StatusBar barStyle="light-content" backgroundColor="black" />
    
    <View style={styles.titleContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={44} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>{sliceName.toUpperCase()}</Text>
    </View>

    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description:</Text>
          <Text style={styles.cardContent}>{eventData.description}</Text>

          <Text style={styles.cardTitle}>Time:</Text>
          <Text style={styles.cardContent}>
            {eventData.startTime} - {eventData.endTime}
          </Text>

          <Text style={styles.cardTitle}>Days:</Text>
          <Text style={styles.cardContent}>
            {eventData.day || 'No days assigned'}
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('EventScreen', { username, groupName })}
      >
        <Text style={styles.buttonText}>Back to Group</Text>
      </TouchableOpacity>
    </View>
  </View>
);

};

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    backgroundColor: 'black',
    width: '100%',
    height: 150,
    paddingTop: 90,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    color: 'white',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 52,
    width: 60,
    paddingLeft: 10,
  },
  
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#333',
  },
  sliceTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#000',
  },
  cardContent: {
    fontSize: 16,
    color: '#111',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 0.5, // Added border width
    borderColor: 'white', // Added border color
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Event;
