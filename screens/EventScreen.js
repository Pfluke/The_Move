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

  const voteSlice = async (sliceName, voteType) => {
    try {
      const groupSnap = await getDoc(groupDocRef);
      if (!groupSnap.exists()) {
        await setDoc(groupDocRef, { slices: {} });
      }

      const data = groupSnap.data();
      const sliceData = data?.slices?.[sliceName] || {
        votes: 0,
        voters: {},
        days: [],
        description: '',
        startTime: '',
        endTime: '',
        imageUri: '',
      };

      const currentVotes = sliceData.votes || 0;
      const currentVoters = sliceData.voters || {};
      const userCurrentVote = currentVoters[username] || 0;
      let newVotes = currentVotes;
      let updatedVoters = { ...currentVoters };

      if (userCurrentVote === voteType) {
        newVotes -= voteType;
        delete updatedVoters[username];
      } else {
        newVotes += voteType - userCurrentVote;
        updatedVoters[username] = voteType;
      }

      await updateDoc(groupDocRef, {
        [`slices.${sliceName}`]: {
          ...sliceData,
          votes: newVotes,
          voters: updatedVoters,
        },
      });

    } catch (error) {
      console.error("Error updating vote:", error);
      Alert.alert("Error", error.message);
    }
  };

  const getUserVote = (sliceName) => {
    const sliceData = slices[sliceName] || {};
    return sliceData.voters ? sliceData.voters[username] : 0;
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getEventWithMostVotes = () => { 
    let maxVotes = -1;
    let eventWithMostVotes = null;

    Object.entries(slices).forEach(([sliceName, sliceData]) => {
      if (sliceData.votes > maxVotes) {
        maxVotes = sliceData.votes;
        eventWithMostVotes = sliceName;
      }
    });

    return eventWithMostVotes;
  };

  const eventWithMostVotes = getEventWithMostVotes();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor:"white" }}>
      <StatusBar barStyle="dark-content" />
      {/* black safe background for ios white text at top */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* <View style={styles.headerContainer}>
              <Text style={styles.header}>What are we doing later?</Text>
            </View>
            <View style={styles.textBubbleBig}>
              <Text style={{ fontSize: 8 }}>       </Text>
            </View>
            <View style={styles.textBubbleSmall}>
              <Text style={{ fontSize: 6 }}>    </Text>
            </View> */}
  
            {/* Group Name */}
            <View style={styles.groupTextContainer}>
              <Text style={styles.groupText}>{groupName}</Text>
            </View>
  
            {/* Day Buttons */}
            <View style={styles.dayButtonsContainer}>
              {daysOfWeek.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => navigation.navigate('DayCalendar', { selectedDay: day, username, groupName })}
                  style={styles.dayButton}
                >
                  <Text style={styles.dayButtonText}>{day.substring(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </View>
  
            <Text style={styles.subtitle}>All Events</Text>
  
            {loadingSlices ? (
              <Text>Loading slices...</Text>
            ) : Object.keys(slices).length === 0 ? (
              <Text style={styles.noEventsText}>No events scheduled yet. </Text>
            ) : (
              <View style={styles.slicesList}>
                {Object.entries(slices)
                  .sort(([, a], [, b]) => (b.votes || 0) - (a.votes || 0))
                  .map(([slice, data]) => {
                    const userVote = getUserVote(slice);
                    return (
                      <View key={slice} style={styles.cardContainer}>
                        {/* Card Header with Title, Checkmark, and Voting Buttons */}
                        <View style={styles.cardHeader}>
                          <View style={styles.cardTitleContainer}>
                            <Text style={styles.cardTitle}>{slice}</Text>
                            {slice === eventWithMostVotes && (
                              <Text style={styles.checkmark}>✅</Text>
                            )}
                          </View>
                          <View style={styles.voteContainer}>
                            <TouchableOpacity
                              onPress={() => voteSlice(slice, 1)}
                              style={[styles.voteButton, userVote === 1 && styles.votedUp]}
                            >
                              <MaterialIcons name="thumb-up" size={20} color={userVote === 1 ? '#4CAF50' : '#888'} />
                            </TouchableOpacity>
                            <Text style={styles.voteCount}>{data.votes || 0}</Text>
                            <TouchableOpacity
                              onPress={() => voteSlice(slice, -1)}
                              style={[styles.voteButton, userVote === -1 && styles.votedDown]}
                            >
                              <MaterialIcons name="thumb-down" size={20} color={userVote === -1 ? '#F44336' : '#888'} />
                            </TouchableOpacity>
                          </View>
                        </View>
  
                        {/* Card Content */}
                        <View style={styles.cardContent}>
                          {data.imageUri && (
                            <Image source={{ uri: data.imageUri }} style={styles.cardImage} />
                          )}
                          <Text style={styles.cardDetails}>
                            {data.days ? data.days.join(', ') : 'No day assigned'} | {data.startTime} - {data.endTime}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}
          </ScrollView>
          <View style={styles.bottomButtonContainer}>
            <Button title="Add Event" onPress={() => navigation.navigate('AddSliceScreen', { groupName })} />
            <Button title="Go to Group Screen" onPress={() => navigation.navigate('GroupScreen', { username })} />
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  titleContainer: {
    backgroundColor: 'black',
    flexDirection: 'column',
    width: '100%',
    // paddingTop: 5,
  },
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
    marginTop: 0,
  },
  dayButtonsContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    justifyContent: 'space-around',
  },
  dayButton: {
    padding: 8,
    backgroundColor: 'black',
    borderRadius: 3,
    width: 50, 
    alignItems: 'center', 
  },
  dayButtonText: {
    color: 'white',
    fontSize: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  slicesList: {
    width: '100%',
    padding: 10,
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  checkmark: {
    marginLeft: 5,
  },
  cardContent: {
    marginBottom: 5,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: 5,
    marginBottom: 10,
  },
  cardDetails: {
    fontSize: 14,
    color: '#666',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    padding: 5,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  votedUp: {
    backgroundColor: '#E8F5E9',
  },
  votedDown: {
    backgroundColor: '#FFEBEE',
  },
  voteCount: {
    fontSize: 16,
    color: '#000',
    marginHorizontal: 10,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 5,
    // paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    borderTopColor: '#E0E0E0',
  },
});

export default EventScreen;