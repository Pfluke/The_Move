import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView ,StatusBar, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { getFirestore, doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import AddEventModal from './AddEventModal';

const db = getFirestore(app);

const EventScreen = ({ navigation, route }) => {
  const { username, groupName = 'default_group' } = route.params || {};
  const [slices, setSlices] = useState({});
  const [loadingSlices, setLoadingSlices] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);

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

  const handleEventSubmit = async (eventData) => {
    const { title, ...rest } = eventData;
    try {
      const groupRef = doc(db, 'groups', groupName);
      const docSnap = await getDoc(groupRef);
      await updateDoc(groupRef, {
        [`slices.${title}`]: {
          votes: 0,
          voters: {},
          ...rest,
        },
      });
      Alert.alert('Event Added', 'Successfully added event!');
      setShowEventModal(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor:"white" }}>
        <StatusBar barStyle="dark-content" />
        {/* black safe background for ios white text at top */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
    
          {/* Group Name */}
          <View style={styles.headerContainer}>
            <View style={styles.groupNameContainer}>
              <Text style={styles.groupNameText}>{groupName}</Text>
              {/* remove underline if we want */}
              <View style={styles.underline} /> 
            </View>
          </View>

        {/* Day Buttons */}
        <View style={styles.dayButtonsContainer}>
          {sortedDaysOfWeek.map((day, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate('EventsOfWeek', { selectedDay: day, username, groupName, initialEventData: slices, })}
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
        
        <View style={styles.bottomButtonContainer}>
          <View style={styles.weekEventsContainer}>
            {/* Button to view top events of the week */}
            <TouchableOpacity 
              style={styles.weekEventsButton}
              onPress={() =>
                navigation.navigate('EventsOfWeek', {
                  selectedDay: "WEEK",
                  username,
                  groupName,
                  initialEventData: slices,
                })
              }
            >
              <Text style={styles.customButtonText}>
                All Events
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekEventsContainer}>
            {/* Button to view top events of the week */}
            <TouchableOpacity 
              style={styles.weekEventsButton}
              onPress={() =>
                navigation.navigate('EventCard', {
                  username,
                  groupName,
                  initialEventData: slices,
                })
              }
            >
              <Text style={styles.customButtonText}>
                New Events
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.bottomButtonContainer}>

            {/* Go to Group Screen Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.customButton}
                onPress={() => 
                  navigation.navigate('GroupScreen', { username })}
              >
                <MaterialIcons 
                  name="arrow-back"
                  size={60}
                  color="black"
                  alignSelf='center'
                />
                <Text style={styles.customButtonText}>
                  Group Screen
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add Event Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.customButton}
                onPress={() => 
                  setShowEventModal(true)
                }
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
          <AddEventModal
            visible={showEventModal}
            onClose={() => setShowEventModal(false)}
            onSubmit={handleEventSubmit}
          />
          </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: { // header container styling
    backgroundColor: '#FFFFFF',
    paddingTop: 15,
    paddingBottom: 15,
  },
  groupNameContainer: { // group name container
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  groupNameText: { // text styling for group name
    fontSize: 43,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    textTransform: 'uppercase', 
  },
  underline: { 
    height: 4,
    width: '40%',
    backgroundColor: 'black',
    marginTop: 8,
    borderRadius: 2,
  },
  weekEventsContainer:{
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 170,
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
    fontSize: 22,
    fontWeight: '600',
    textTransform: 'uppercase', 
    alignItems: 'center',
  },
  topButtonContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: '#FFFFFF',
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
    fontSize: 18,
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