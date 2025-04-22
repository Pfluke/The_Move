import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Button } from 'react-native';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { app } from '../firebaseConfig'; // Adjust path as needed
import moment from 'moment';

const db = getFirestore(app);

const DayCalendar = ({ route, navigation }) => {
  const { selectedDay, groupName, username } = route.params; // Get selectedDay and groupName from route params
  const [slicesForDay, setSlicesForDay] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch group data from Firestore
  useEffect(() => {
    const groupDocRef = doc(db, 'groups', groupName);

    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const slices = data?.slices || {};

        // Filter slices that match the selected day
        const filteredSlices = Object.entries(slices).filter(([sliceName, sliceData]) =>
          sliceData.day?.includes(selectedDay)
        );

        setSlicesForDay(filteredSlices);
        setLoading(false);
      } else {
        Alert.alert("Error", "Group not found");
      }
    });

    return () => unsubscribe();
  }, [groupName, selectedDay]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{selectedDay}'s Calendar</Text>

      {/* Show loading or slices */}
      {loading ? (
        <Text>Loading slices...</Text>
      ) : slicesForDay.length === 0 ? (
        <Text>No slices found for {selectedDay}...</Text>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
          {slicesForDay.map(([sliceName, sliceData], index) => (
            <TouchableOpacity
              key={index}
              style={styles.sliceContainer}
              onPress={() =>
                navigation.navigate('Event', {
                  groupName,        // Send the group name to Event screen
                  sliceName,        // Send the slice name to Event screen
                  username,
                })
              } // Navigate to Event screen with groupName and sliceName
            >
              <Text style={styles.sliceText}>{sliceName}</Text>
              <Text style={styles.sliceTime}>
                {sliceData.startTime} - {sliceData.endTime}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Button to navigate to Wheel of Fortune screen */}
      {/* {slicesForDay && slicesForDay.length > 0 && (
        <Button
          title="How About Wheel Decide"
          onPress={() => navigation.navigate('WheelOfFortune', { 
            slices: slicesForDay.map(([sliceName, sliceData]) => ({ sliceName, sliceData })), 
            username, 
            groupName 
          })}
        />
      )} */}


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scrollView: {
    width: '100%',
  },
  scrollContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  sliceContainer: {
    backgroundColor: '#00b0ff',
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  sliceText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sliceTime: {
    color: 'white',
    fontSize: 12,
  },
});

export default DayCalendar;
