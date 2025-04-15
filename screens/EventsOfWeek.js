import React, { useEffect, useState } from 'react';
import { 
  View, Text, Alert, StyleSheet, ScrollView, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Firebase imports:
import { getFirestore, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

const EventsOfWeek = ({ navigation, route }) => {
  const { username, groupName, initialEventData } = route.params;
  const [loadingEventData, setLoadingEventData] = useState(false);
  const [eventData, setEventData] = useState(initialEventData);

  // Reference to the group document.
  const groupDocRef = doc(db, "groups", groupName);

  useEffect(() => {
    if (!eventData) {
      setLoadingEventData(true);
    } else {
      setLoadingEventData(false);
    }
  }, [eventData]);

  if (loadingEventData) {
    return <Text>Loading events...</Text>;
  }

  // Helper: Retrieve the user's current vote (if any) on an event.
  const getUserVote = (eventKey) => {
    const evt = eventData[eventKey] || {};
    return evt.voters ? evt.voters[username] : 0;
  };

  // Helper: Get the event with the most votes.
  const getEventWithMostVotes = () => { 
    let maxVotes = -Infinity;
    let eventWithMostVotes = null;
  
    Object.entries(eventData).forEach(([eventKey, sliceData]) => {
      if ((sliceData.votes || 0) > maxVotes) {
        maxVotes = sliceData.votes;
        eventWithMostVotes = eventKey;
      }
    });
  
    return eventWithMostVotes;
  };

  const eventWithMostVotes = getEventWithMostVotes();

  // Handle vote action:
  // Users can vote (like/dislike) on each event—change their vote or remove it,
  // and the user is allowed only one like and one dislike per day.
  const handleVote = async (eventKey, voteValue) => {
    const eventItem = eventData[eventKey];
    if (!eventItem) return;

    // Determine current vote and compute new vote.
    const currentVote = (eventItem.voters && eventItem.voters[username]) || 0;
    const newVote = currentVote === voteValue ? 0 : voteValue;
    const voteDiff = newVote - currentVote;

    // If adding a new vote (or changing to a different vote), check per-day limits.
    // This check is skipped if the vote is being removed (newVote === 0).
    if (newVote !== 0) {
      // Make a lowercase copy of days for the current event.
      const currentDays = eventItem.days ? eventItem.days.map(day => day.toLowerCase()) : [];
      // For each event other than the current one:
      for (const [otherKey, otherEvent] of Object.entries(eventData)) {
        if (otherKey === eventKey) continue;
        const otherUserVote = (otherEvent.voters && otherEvent.voters[username]) || 0;
        // If the user has already voted the same way on the other event…
        if (otherUserVote === newVote) {
          // Get the days for the other event.
          const otherDays = otherEvent.days ? otherEvent.days.map(day => day.toLowerCase()) : [];
          // Check if there is any overlap.
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

    // Update local state immediately.
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
      // Get the current group document snapshot.
      const groupSnap = await getDoc(groupDocRef);
      if (!groupSnap.exists()) {
        await setDoc(groupDocRef, { slices: {} });
      }
      // Retrieve a fresh snapshot.
      const groupData = (await getDoc(groupDocRef)).data();
      const sliceData = groupData.slices ? groupData.slices[eventKey] : null;
      // Use Firebase data if it exists; otherwise, fall back to our local eventItem.
      const currentSliceData = sliceData || {
        votes: eventItem.votes || 0,
        voters: eventItem.voters || {},
        days: eventItem.days || [],
        startTime: eventItem.startTime || '',
        endTime: eventItem.endTime || '',
        imageUri: eventItem.imageUri || '',
        description: eventItem.description || '',
      };

      const currentVotes = currentSliceData.votes || 0;
      const currentVoters = currentSliceData.voters || {};
      const userCurrentVote = currentVoters[username] || 0;
      let newVotes, updatedVoters;

      if (userCurrentVote === voteValue) {
        // If toggling the same vote, remove it.
        newVotes = currentVotes - voteValue;
        updatedVoters = { ...currentVoters };
        delete updatedVoters[username];
      } else {
        // Otherwise, update the vote.
        newVotes = currentVotes + voteValue - userCurrentVote;
        updatedVoters = { ...currentVoters, [username]: voteValue };
      }

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
      
      <SafeAreaView style={{ flex: 1}}>
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
                    const isTopEvent = eventKey === eventWithMostVotes;
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


