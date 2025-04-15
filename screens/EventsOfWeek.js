import React, { useEffect, useState } from 'react';
import { 
  View, Text, Alert, StyleSheet, ScrollView, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Firebase imports:
import { 
  getFirestore, doc, setDoc, updateDoc, getDoc, onSnapshot 
} from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

const EventsOfWeek = ({ navigation, route }) => {
  const { username, groupName, initialEventData } = route.params;
  const [loadingEventData, setLoadingEventData] = useState(true);
  const [eventData, setEventData] = useState(initialEventData || {});

  // Reference to the group document.
  const groupDocRef = doc(db, "groups", groupName);

  // Real-time listener: updates eventData state whenever changes occur in Firebase.
  useEffect(() => {
    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEventData(data.slices || {});
      } else {
        // If the group document doesn't exist, create it with an empty slices object.
        setDoc(groupDocRef, { slices: {} })
          .then(() => setEventData({}))
          .catch((error) => console.error("Error creating group doc:", error));
      }
      setLoadingEventData(false);
    }, (error) => {
      console.error("onSnapshot error:", error);
      setLoadingEventData(false);
    });

    return () => unsubscribe();
  }, [groupDocRef]);

  if (loadingEventData) {
    return <Text>Loading events...</Text>;
  }

  // Helper: Retrieve the user's current vote (if any) on an event.
    const getUserVote = (eventKey) => {
        const evt = eventData[eventKey] || {};
        return evt.voters ? evt.voters[username] : 0;
    };

    const getTopVotedEventKeys = () => {
        let maxVotes = -Infinity;
        let topEvents = [];
  
        Object.entries(eventData).forEach(([eventKey, sliceData]) => {
        const votes = sliceData.votes || 0;
        if (votes > maxVotes) {
            maxVotes = votes;
            topEvents = [eventKey];
        } else if (votes === maxVotes) {
            topEvents.push(eventKey);
        }
        });
        return topEvents;
    };

    const topVotedEventKeys = getTopVotedEventKeys();

  // Handle vote action:
  // Users can vote (like/dislike) on each event—change their vote or remove it.
  // Additionally, the user can only use one like and one dislike per day.
  const handleVote = async (eventKey, voteValue) => {
    const eventItem = eventData[eventKey];
    if (!eventItem) return;

    // Determine current vote and compute new vote.
    const currentVote = (eventItem.voters && eventItem.voters[username]) || 0;
    const newVote = currentVote === voteValue ? 0 : voteValue;
    const voteDiff = newVote - currentVote;

    // If adding a new vote (or changing to a different vote), check per-day limits.
    // This check is skipped if the vote is being removed.
    if (newVote !== 0) {
      const currentDays = eventItem.days ? eventItem.days.map(day => day.toLowerCase()) : [];
      // For every other event in the state:
      for (const [otherKey, otherEvent] of Object.entries(eventData)) {
        if (otherKey === eventKey) continue;
        const otherUserVote = (otherEvent.voters && otherEvent.voters[username]) || 0;
        if (otherUserVote === newVote) {
          const otherDays = otherEvent.days ? otherEvent.days.map(day => day.toLowerCase()) : [];
          // Check if there is any day overlap between the two events.
          const intersectingDays = currentDays.filter(day => otherDays.includes(day));
          if (intersectingDays.length > 0) {
            const conflictDay = intersectingDays[0];
            Alert.alert(
              "Voting Error",
              `You've already used your ${newVote === 1 ? "like" : "dislike"} for ${conflictDay.charAt(0).toUpperCase() + conflictDay.slice(1)}.`
            );
            return;
          }
        }
      }
    }

    // Optimistically update local state.
    setEventData(prev => ({
      ...prev,
      [eventKey]: {
        ...prev[eventKey],
        votes: (prev[eventKey].votes || 0) + voteDiff,
        voters: {
          ...prev[eventKey].voters,
          [username]: newVote
        }
      }
    }));

    // Update Firebase.
    try {
      // Fetch the latest group document data.
      const groupSnap = await getDoc(groupDocRef);
      let currentSliceData;
      if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        currentSliceData = (groupData.slices && groupData.slices[eventKey]) || {
          votes: eventItem.votes || 0,
          voters: eventItem.voters || {},
          days: eventItem.days || [],
          startTime: eventItem.startTime || '',
          endTime: eventItem.endTime || '',
          imageUri: eventItem.imageUri || '',
          description: eventItem.description || '',
        };
      } else {
        // Create the group document if it doesn't exist.
        currentSliceData = {
          votes: eventItem.votes || 0,
          voters: eventItem.voters || {},
          days: eventItem.days || [],
          startTime: eventItem.startTime || '',
          endTime: eventItem.endTime || '',
          imageUri: eventItem.imageUri || '',
          description: eventItem.description || '',
        };
        await setDoc(groupDocRef, { slices: {} });
      }

      const currentVotes = currentSliceData.votes || 0;
      const currentVoters = currentSliceData.voters || {};
      const userCurrentVote = currentVoters[username] || 0;
      let newVotes, updatedVoters;

      if (userCurrentVote === voteValue) {
        // Removing the vote.
        newVotes = currentVotes - voteValue;
        updatedVoters = { ...currentVoters };
        delete updatedVoters[username];
      } else {
        // Adding/changing the vote.
        newVotes = currentVotes + voteValue - userCurrentVote;
        updatedVoters = { ...currentVoters, [username]: voteValue };
      }

      // Update the specific event slice in the group document.
      await updateDoc(groupDocRef, {
        [`slices.${eventKey}`]: {
          ...currentSliceData,
          votes: newVotes,
          voters: updatedVoters,
        }
      });
    } catch (error) {
      console.error("Error updating vote:", error);
      Alert.alert("Error", "Failed to update your vote. Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor:"black" }}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      <View style={styles.titleContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { position: 'absolute', left: 0, top: 52 }]}
        >
          <MaterialIcons 
            name="arrow-back"
            size={44}
            color="white"
            alignSelf='center'
          />
        </TouchableOpacity>
        <Text style={styles.title}>TOP EVENTS OF THE WEEK</Text>
      </View>
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'white' }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {eventData && Object.keys(eventData).length === 0 ? (
              <Text style={styles.noEventsText}>NO EVENTS CURRENTLY SCHEDULED</Text>
            ) : (
              <View style={styles.EventDataList}>
                {Object.entries(eventData)
                  .sort(([, a], [, b]) => (b.votes || 0) - (a.votes || 0))
                  .map(([eventKey, data]) => {
                    const userVote = getUserVote(eventKey);

                    // Determine card background color.
                    const isTopEvent = topVotedEventKeys.includes(eventKey);
                    const hasPositiveVotes = data.votes > 0;
                    const hasNegativeVotes = data.votes < 0;
                    
                    let cardBackgroundColor;
                    if (isTopEvent) {
                      cardBackgroundColor = 'rgb(70, 233, 70)';
                    } else if (hasPositiveVotes) {
                      cardBackgroundColor = '#d4f7d4';
                    } else if (hasNegativeVotes) {
                      cardBackgroundColor = '#ffdddd';
                    } else {
                      cardBackgroundColor = '#FFF';
                    }

                    return (
                      <View key={eventKey} style={[styles.cardContainer, { backgroundColor: cardBackgroundColor }]}>
                        <View style={styles.cardContentRow}>
                          {/* Left column: Event title, image, details */}
                          <View style={styles.eventDetailsColumn}>
                            <Text style={styles.cardTitle}>{eventKey}</Text>
                            {data.imageUri && (
                              <Image source={{ uri: data.imageUri }} style={styles.cardImage} />
                            )}
                            <Text style={styles.cardDetails}>
                              {data.days ? data.days.join(", ") : "No day assigned"} | {data.startTime} - {data.endTime}
                            </Text>
                          </View>

                          {/* Right column: Vote count and top event star */}
                          <View style={styles.voteColumn}>
                            {isTopEvent && (
                              <View style={styles.starContainer}>
                                <MaterialIcons name="star" size={32} color="black" />
                              </View>
                            )}
                            <Text style={styles.voteCount}>{data.votes || 0}</Text>
                          </View>
                        </View>
                        {/* Voting buttons */}
                        <View style={styles.votingButtonsContainer}>
                          <TouchableOpacity 
                            onPress={() => handleVote(eventKey, 1)}
                            style={[styles.voteButton, userVote === 1 && styles.selectedVoteButton]}
                          >
                            <MaterialIcons name="thumb-up" size={28} color="black" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleVote(eventKey, -1)}
                            style={[styles.voteButton, userVote === -1 && styles.selectedVoteButton]}
                          >
                            <MaterialIcons name="thumb-down" size={28} color="black" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
  },
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
  EventDataList: {
    width: '100%',
    padding: 10,
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    padding: 10,
    flexDirection: 'column',
  },
  cardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventDetailsColumn: {
    flex: 3,
    paddingLeft: 10,
  },
  voteColumn: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  voteCount: {
    fontSize: 32,
    color: 'black',
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
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
  starContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    marginLeft: 10,
    marginTop: 4,
  },
  backButton: {
    alignItems: 'center',
    width: '20%',
    backgroundColor: 'black',
  },
  noEventsText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
  },
  votingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  voteButton: {
    marginHorizontal: 20,
    padding: 10,
  },
  selectedVoteButton: {
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 5,
  },
});

export default EventsOfWeek;



