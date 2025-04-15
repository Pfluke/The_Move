import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView ,StatusBar } from 'react-native';
import { getFirestore, doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

const db = getFirestore(app);

const EventScreen = ({ navigation, route }) => {
  const { username, groupName = 'default_group' } = route.params || {};
  const [slices, setSlices] = useState({});
  const [loadingSlices, setLoadingSlices] = useState(true);

  const groupDocRef = doc(db, "groups", groupName);

  // Hide the header
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      try {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSlices(data.slices || {});
          setLoadingSlices(false);
        } else {
          setDoc(groupDocRef, { slices: {} })
            .then(() => {
              setSlices({});
              setLoadingSlices(false);
            })
            .catch((error) => {
              console.error("Error creating group document:", error);
              Alert.alert("Error", error.message);
            });
        }
      } catch (error) {
        console.error("Error in snapshot listener:", error);
        Alert.alert("Error", error.message);
      }
    });

    return () => unsubscribe();
  }, [groupName]);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getSortedDays = () => {
    const today = new Date();
    const currentDayIndex = today.getDay();
    const sortedDays = [
      ...daysOfWeek.slice(currentDayIndex),
      ...daysOfWeek.slice(0, currentDayIndex)
    ];
    
    return sortedDays;
  };

  const sortedDaysOfWeek = getSortedDays();


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor:"white" }}>
      <StatusBar barStyle="dark-content" />
      {/* black safe background for ios white text at top */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
  
        {/* Group Name */}
        <View style={styles.groupTextContainer}>
          <Text style={styles.groupText}>{groupName}</Text>
        </View>

        {/* Day Buttons */}
        <View style={styles.dayButtonsContainer}>
          {sortedDaysOfWeek.map((day, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate('DayCalendar', { selectedDay: day, username, groupName })}
              style={[
                styles.dayButton,
                // Highlight today's button
                index === 0 ? styles.todayButton : null
              ]}
            >
              <Text style={styles.dayButtonText}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.weekEventsContainer}>
          {/* Button to view top events of the week */}
          <TouchableOpacity 
            style={styles.weekEventsButton}
            onPress={() =>
              navigation.navigate('EventsOfWeek', {
                username,
                groupName,
                initialEventData: slices,
              })
            }
          >
            <Text style={styles.customButtonText}>
              View All Events for this Week
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomButtonContainer}>

          {/* Go to Group Screen Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => 
                navigation.goBack()}
            >
              <MaterialIcons 
                name="arrow-back"
                size={60}
                color="black"
                alignSelf='center'
              />
              <Text style={styles.customButtonText}>
                Go To Group Screen
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add Event Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => 
                navigation.navigate('AddSliceScreen', { groupName }
              )}
            >
              <MaterialIcons
                name="add"
                size={60}
                color="black"
                alignSelf='center'
              />
              <Text style={styles.customButtonText}>
                Add Event
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: { // bubble text style
    fontSize: 18,
    color: 'white',
  },
  headerContainer: {
    backgroundColor: '#007AFF',
    marginLeft: 14,
    marginBottom: 2,
    marginTop: 15,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  textBubbleBig: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    marginLeft: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  textBubbleSmall: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    marginTop: 0,
    marginLeft: 5,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  groupText: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  groupTextContainer: {
    backgroundColor: '#F5F5F5',
    borderWidth: 0.5,
    borderColor: 'black',
    borderRadius: 10,
    padding: 5,
    marginVertical: 10,
    alignSelf: 'center',
    width: '90%',
  },
  noEventsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  weekEventsContainer:{
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '83%',
  },
  weekEventsButton: {
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 3,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dayButtonsContainer: {
    flexDirection: 'column',
    marginVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButton: {
    padding: 13,
    backgroundColor: '#444',
    borderRadius: 8,
    width: '93%', 
    alignItems: 'center',
    marginVertical: 5,
  },
  dayButtonText: {
    color: 'white',
    fontSize: 24,
  },
  bottomButtonContainer: {
    flexDirection: "row",
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '45%',
  },
  customButton: {
    marginTop: 6,
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 5,
    borderRadius: 5,
    borderWidth: 3,
    height: 120,
    width: 140,
    justifyContent: 'center',
  },
  customButtonText: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  todayButton: {
    backgroundColor: 'black',
  },


  //FOREHEAD STYLING:

  // titleContainer: {
  //   backgroundColor: 'black',
  //   flexDirection: 'column',
  //   width: '100%',
  //   paddingTop: 5,
  // },
  // get rid of top title text
  // titleTransformContainer: { 
  //   transform: [{ scaleX: 0.9 }, { scaleY: 2.8 }],
  //   alignSelf: 'center',
  // },
  // title: {
  //   fontSize: 55,
  //   marginTop: 20,
  //   fontWeight: 'bold',
  //   color: 'white',
  //   textAlign: 'center',
  //   width: '100%',
  // },
  // titleUnderline: {
  //   height: 5,
  //   width: '50%',
  //   backgroundColor: 'white',
  //   marginTop: 50,
  //   alignSelf: 'center',
  // },
});

export default EventScreen;