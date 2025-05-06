import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import AddEventModal from './AddEventModal';

const db = getFirestore(app);

const EventScreen = ({ navigation, route }) => {
  const { username, groupName = 'default_group' } = route.params || {};
  const [slices, setSlices] = useState({});
  const [loadingSlices, setLoadingSlices] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);

  // NEW: members + code + popup
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupCode, setGroupCode] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);

  const groupDocRef = doc(db, 'groups', groupName);

  // Hide the header
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Subscribe to group document for slices, members, code
  useEffect(() => {
    const unsubscribe = onSnapshot(
      groupDocRef,
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSlices(data.slices || {});
            setGroupMembers(data.members || []);
            setGroupCode(data.code || '');
            setLoadingSlices(false);
          } else {
            // If it doesn't exist, create minimal document
            setDoc(groupDocRef, { slices: {}, members: [], code: '' })
              .then(() => {
                setSlices({});
                setGroupMembers([]);
                setGroupCode('');
                setLoadingSlices(false);
              })
              .catch((error) => {
                console.error('Error creating group document:', error);
                Alert.alert('Error', error.message);
              });
          }
        } catch (error) {
          console.error('Error in snapshot listener:', error);
          Alert.alert('Error', error.message);
        }
      }
    );
    return () => unsubscribe();
  }, [groupName]);

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  const getSortedDays = () => {
    const today = new Date();
    const currentDayIndex = today.getDay();
    return [
      ...daysOfWeek.slice(currentDayIndex),
      ...daysOfWeek.slice(0, currentDayIndex)
    ];
  };

  const sortedDaysOfWeek = getSortedDays();

  const handleEventSubmit = async (eventData) => {
    const { title, ...rest } = eventData;
    try {
      const groupRef = doc(db, 'groups', groupName);
      await updateDoc(groupRef, {
        [`slices.${title}`]: {
          votes: 0,
          voters: {},
          ...rest
        }
      });
      Alert.alert('Event Added', 'Successfully added event!');
      setShowEventModal(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <StatusBar barStyle="black-content" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Go to Group Screen Button */}
          <View style={styles.topBarContainer}>
            <TouchableOpacity
              style={styles.topBarButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={60} color="black" />
            </TouchableOpacity>

            {/* GROUP MEMBERS ICON */}
            <TouchableOpacity
              style={styles.topBarButton}
              onPress={() => setShowMembersModal(true)}
            >
              <MaterialIcons name="groups" size={56} color="black" />
            </TouchableOpacity>
          </View>

          {/* Group Name */}
          <View style={styles.headerContainer}>
            <View style={styles.groupNameContainer}>
              <Text style={styles.groupNameText}>{groupName}</Text>
              <View style={styles.underline} />
              {/* NEW: show code */}
              {groupCode ? (
                <Text style={styles.groupCodeText}>
                  Group Code: {groupCode}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Day Buttons */}
          {/* <View style={styles.dayButtonsContainer}>
            {sortedDaysOfWeek.map((day, index) => (
              <TouchableOpacity
                key={index}
                onPress={() =>
                  navigation.navigate('EventsOfWeek', {
                    selectedDay: day,
                    username,
                    groupName,
                    initialEventData: slices
                  })
                }
                style={[
                  styles.dayButton,
                  index === 0 ? styles.todayButton : null
                ]}
              >
                <Text style={styles.dayButtonText}>{day}</Text>
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
                    selectedDay: 'WEEK',
                    username,
                    groupName,
                    initialEventData: slices
                  })
                }
              >
                <Text style={styles.customButtonText}>View All Events</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weekEventsContainer}>
              {/* Button to view new events */}
              <TouchableOpacity
                style={styles.weekEventsButton}
                onPress={() =>
                  navigation.navigate('EventCard', {
                    username,
                    groupName,
                    initialEventData: slices
                  })
                }
              >
                <Text style={styles.customButtonText}>View New Events</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomButtonContainer}>
            {/* Add Event Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.addEventButton}
                onPress={() => setShowEventModal(true)}
              >
                <MaterialIcons name="add" size={110} color="black" style={{alignSelf:'center'}}/>
                <Text style={[styles.customButtonText, { fontSize: 28 }]}>
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

          {/* MEMBERS POPUP */}
          <Modal
            transparent
            visible={showMembersModal}
            animationType="fade"
            onRequestClose={() => setShowMembersModal(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowMembersModal(false)}
            >
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Group Members</Text>
                    <ScrollView style={{ marginVertical: 10 }}>
                      {groupMembers.map((m, i) => (
                        <Text key={i} style={styles.memberText}>
                          {m}
                        </Text>
                      ))}
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={() => setShowMembersModal(false)}
                    >
                      <Text style={styles.modalCloseText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 0 : 6,
    width: '100%'
  },
  topBarButton: { padding: 10 },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10
  },
  groupNameContainer: {
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 10
  },
  groupNameText: {
    fontSize: 50,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  underline: {
    height: 4,
    width: '40%',
    backgroundColor: 'black',
    marginTop: 8,
    borderRadius: 2
  },
  // NEW: group code text
  groupCodeText: {
    fontSize: 16,
    color: '#555',
    marginTop: 4,
    textAlign: 'center'
  },
  weekEventsContainer: {
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 320,
    marginTop: 10
  },
  weekEventsButton: {
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 3,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30
  },
  // commented out Day Buttons:
  dayButtonsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dayButton: {
    padding: 13,
    backgroundColor: '#444',
    borderRadius: 8,
    width: '93%',
    alignItems: 'center',
    marginVertical: 5
  },
  dayButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    textTransform: 'uppercase',
    alignItems: 'center'
  },
  bottomButtonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginTop: 20,
    backgroundColor: '#FFFFFF'
  },
  buttonContainer: { alignItems: 'center' },
  addEventButton: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 5,
    borderRadius: 5,
    borderWidth: 3,
    height: 200,
    width: 200,
    justifyContent: 'center'
  },
  customButtonText: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  todayButton: { backgroundColor: 'black' },

// MEMBERS MODAL STYLES
modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.3)'  
},
modalContent: {
  width: '80%',
  padding: 20,
  backgroundColor: '#fff',  
  borderRadius: 10
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 10,
  color: '#000'  
},
memberText: {
  fontSize: 16,
  marginVertical: 4,
  color: '#000',
  fontWeight: 'bold',  
},
modalCloseBtn: {
  marginTop: 10,
  alignSelf: 'flex-end'
},
modalCloseText: {
  color: '#000',  
  fontSize: 16
},


  // FOREHEAD STYLING:
  // titleContainer: { … },
  // titleTransformContainer: { … },
  // title: { … },
  // titleUnderline: { … },
});

export default EventScreen;