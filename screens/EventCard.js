import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getFirestore, collection, getDoc, doc, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const db = getFirestore(app);

const EventCard = ({ navigation, route }) => {
  const { username, groupName } = route.params;
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const pan = useRef(new Animated.ValueXY()).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const groupDocRef = doc(db, 'groups', groupName);
        const groupDocSnap = await getDoc(groupDocRef);

        if (groupDocSnap.exists()) {
          const data = groupDocSnap.data();
          const sliceData = data?.slices || {};

          const arrayData = Object.entries(sliceData)
            .map(([name, data]) => ({ name, ...data }))
            .filter((event) => !(event.hasSeen || []).includes(username));

          setEvents(arrayData);
        } else {
          Alert.alert('Error', 'Group not found.');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const markAsSeen = async (eventName) => {
    try {
      const groupDocRef = doc(db, 'groups', groupName);
      const groupDocSnap = await getDoc(groupDocRef);

      if (groupDocSnap.exists()) {
        const slicePath = `slices.${eventName}.hasSeen`;
        await updateDoc(groupDocRef, {
          [slicePath]: [...(groupDocSnap.data()?.slices?.[eventName]?.hasSeen || []), username],
        });
      }
    } catch (error) {
      console.error('Error updating hasSeen:', error);
    }
  };

  const handleVote = async (eventName, voteValue) => {
    try {
      const groupDocRef = doc(db, 'groups', groupName);
      const groupDocSnap = await getDoc(groupDocRef);

      if (groupDocSnap.exists()) {
        const eventItem = groupDocSnap.data()?.slices?.[eventName] || {};
        const currentVote = eventItem.voters?.[username] || 0;
        const newVote = voteValue; // 1 for accept, -1 for decline
        const voteDiff = newVote - currentVote;

        await updateDoc(groupDocRef, {
          [`slices.${eventName}.votes`]: (eventItem.votes || 0) + voteDiff,
          [`slices.${eventName}.voters.${username}`]: newVote
        });
      }
    } catch (error) {
      console.error('Error updating vote:', error);
    }
  };

  const swipeCard = async (direction) => {
    const event = events[currentIndex];
    if (!event) return;
  
    // Mark as seen and record vote
    await markAsSeen(event.name);
    await handleVote(event.name, direction === 'right' ? 1 : -1);
  
    Animated.spring(pan.x, {
      toValue: direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
  
      // If this is the last card, move past the array length to trigger "no more events"
      if (currentIndex >= events.length - 1) {
        setCurrentIndex(events.length); // go just beyond the last index
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    });
  };

  const resetPosition = () => {
    Animated.spring(pan.x, {
      toValue: 0,
      friction: 4,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (_, gestureState) => gestureState.numberActiveTouches === 2,
    onMoveShouldSetPanResponder: (_, gestureState) =>
      gestureState.numberActiveTouches === 2 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderGrant: () => {
      scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gesture) => {
      scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
      if (gesture.dx > 120) swipeCard('right');
      else if (gesture.dx < -120) swipeCard('left');
      else resetPosition();
    },
    onPanResponderTerminate: () => {
      resetPosition();
      scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  const eventData = events[currentIndex];

  if (!eventData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 18, marginBottom: 20, fontWeight: 'bold' }}>NO MORE NEW EVENTS</Text>
        <TouchableOpacity
          style={styles.button}
          //onPress={() => navigation.navigate('EventScreen', { username, groupName })}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back to Group</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, { transform: [{ translateX: pan.x }] }]}
      >
        <View style={styles.cardInfo}>
          <Text style={styles.eventTitle}>{eventData.name}</Text>
          <View style={styles.underline} />
          <View style={styles.detailsContainer}>
            <View style={{flexDirection: 'row', alignSelf: 'center', paddingBottom: 1, paddingTop: 10}}>
              <Text style={{fontSize: 26, fontWeight: 'bold'}}> TIME</Text>
              <MaterialIcons 
                  name="schedule"
                  size={30}
                  color="black"
                  alignSelf='center'
              />
            </View>
            <Text style={styles.detailText}> {eventData.startTime} - {eventData.endTime}</Text>
            <View style={{flexDirection: 'row', alignSelf: 'center', paddingBottom: 1, paddingTop: 10}}>
              <Text style={{fontSize: 26, fontWeight: 'bold'}}> DAY</Text>
              <MaterialIcons 
                  name="event"
                  size={30}
                  color="black"
                  alignSelf='center'
              />
            </View>
            <Text style={styles.detailText}> {eventData.day || "NO DAY"}</Text>
            <View style={{flexDirection: 'row', alignSelf: 'center', paddingBottom: 1, paddingTop: 10}}>
              <Text style={{fontSize: 26, fontWeight: 'bold'}}> LOCATION</Text>
              <MaterialIcons 
                  name="location-city"
                  size={30}
                  color="black"
                  alignSelf='center'
              />
            </View>
            <Text style={styles.detailText}> {eventData.location || 'No location'} </Text>
            {eventData.address ? (
              <View>
                <View style={{ flexDirection: 'row', alignSelf: 'center', paddingBottom: 1, paddingTop: 10 }}>
                  <Text style={{ fontSize: 26, fontWeight: 'bold' }}> ADDRESS</Text>
                  <MaterialIcons 
                    name="pin-drop"
                    size={30}
                    color="black"
                    style={{ alignSelf: 'center' }}
                  />
                </View>
                <Text style={styles.detailText}>{eventData.address}</Text>
              </View>
            ) : null}

            {/* <Text style={styles.detailText}>📍 {eventData.location || 'No location'}</Text> */}
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.descriptionScroll}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.cardDescription}>{eventData.description}</Text>
          </ScrollView>
        </View>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={() => swipeCard('left')}
        >
          <Text style={[styles.buttonText, styles.declineButtonText]}>Dislike</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => swipeCard('right')}
        >
          <Text style={[styles.buttonText, styles.acceptButtonText]}>Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.78,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardInfo: {
    padding: 20,
    backgroundColor: '#FFF',
    height: '100%',
  },
  eventTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  detailText: {
    fontSize: 18,
    marginBottom: 8,
    color: '#000',
    alignSelf: 'center',
    marginTop: 1,
  },
  descriptionScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  cardDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 150,
    alignItems: 'center',
  },
  declineButton: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B',
  },
  acceptButton: {
    borderColor: '#51B27E',
    backgroundColor: '#51B27E',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  acceptButtonText: {
    color: '#FFF',
  },
  declineButtonText: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  underline: { 
    height: 4,
    width: '60%',
    backgroundColor: 'black',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
});

export default EventCard;