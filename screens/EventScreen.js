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
        <StatusBar barStyle="black-content" />
        {/* black safe background for ios white text at top */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >

            {/* Go to Group Screen Button */}
            <View style={styles.topBarContainer}>
              <TouchableOpacity
                style={styles.topBarButton}
                onPress={() =>
                  //navigation.navigate('GroupScreen', { username })}
                  navigation.goBack()}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={60}
                  color="black"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topBarButton}
                onPress={() => {
                  Alert.alert('Options Pressed', 'Implement options action here.');
                }}
              >
                <MaterialIcons
                  name="groups"
                  size={56}
                  color="black"
                />
              </TouchableOpacity>
            </View>
    
          {/* Group Name */}
          <View style={styles.headerContainer}>
            <View style={styles.groupNameContainer}>
              <Text style={styles.groupNameText}>{groupName}</Text>
              {/* remove underline if we want */}
              <View style={styles.underline} /> 
            </View>
          </View>

        {/* Day Buttons */}
        {/* <View style={styles.dayButtonsContainer}>
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
        </View> */}
        
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
                View All Events
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
                View New Events
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.bottomButtonContainer}>

            {/* Go to Group Screen Button
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
            </View> */}

            {/* Add Event Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.addEventButton}
                onPress={() => 
                  setShowEventModal(true)
                }
              >
                <MaterialIcons
                  name="add"
                  size={110}
                  color="black"
                  alignSelf='center'
                />
                <Text style={[styles.customButtonText, {fontSize: 28}]}>
                  Add New Event
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
  topBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 0 : 6,
    width: '100%',
  },
  topBarButton: {
      padding: 10, // Makes the touch area slightly larger around the icon
  },
  headerContainer: { // header container styling
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
  },
  groupNameContainer: { // group name container
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  groupNameText: { // text styling for group name
    fontSize: 50,
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
    width: 320,
    marginTop: 10,
  },
  weekEventsButton: {
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 3,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dayButtonsContainer: {
    flexDirection: 'column',
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
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  bottomButtonContainer: {
    flexDirection: "col",
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  backButton: {
    marginRight: 300,
    marginTop: 15,
  },
  addEventButton: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 5,
    borderRadius: 5,
    borderWidth: 3,
    height: 200,
    width: 200,
    justifyContent: 'center',
  },
  customButtonText: {
    color: 'black',
    fontSize: 24,
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