import React, { useEffect, useState } from 'react';
import { 
  View, Text, Alert, StyleSheet, ScrollView, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getFirestore, doc, setDoc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

const EventsOfWeek = ({ navigation, route }) => {
  const { selectedDay, username, groupName, initialEventData } = route.params;
  const [loadingEventData, setLoadingEventData] = useState(false);
  const [eventData, setEventData] = useState([]);

  const groupDocRef = doc(db, "groups", groupName);

  useEffect(() => {
    if (selectedDay === "WEEK") {
      setEventData(initialEventData);
      return;
    }

    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const slices = docSnap.data()?.slices || {};

        const filtered = Object.entries(slices).filter(
          ([, sliceData]) => sliceData.days?.includes(selectedDay)
        );

        setEventData(Object.fromEntries(filtered));
      } else {
        Alert.alert("Error", "Group not found");
      }
    });

    return () => unsubscribe();
  }, [selectedDay, groupName]);

  useEffect(() => {
    setLoadingEventData(!eventData);
  }, [eventData]);

  const getUserVote = (eventKey) => {
    const evt = eventData[eventKey] || {};
    return evt.voters ? evt.voters[username] : 0;
  };

  const getEventWithMostVotes = () => {
    let maxVotes = -Infinity;
    let topEvent = null;
    Object.entries(eventData).forEach(([key, slice]) => {
      if ((slice.votes || 0) > maxVotes) {
        maxVotes = slice.votes;
        topEvent = key;
      }
    });
    return topEvent;
  };

  const eventWithMostVotes = getEventWithMostVotes();

  const handleVote = async (eventKey, voteValue) => {
    const eventItem = eventData[eventKey];
    if (!eventItem) return;

    const currentVote = eventItem.voters?.[username] || 0;
    const newVote = currentVote === voteValue ? 0 : voteValue;
    const voteDiff = newVote - currentVote;

    if (newVote !== 0) {
      const currentDays = eventItem.days?.map(day => day.toLowerCase()) || [];
      for (const [otherKey, otherEvent] of Object.entries(eventData)) {
        if (otherKey === eventKey) continue;
        const otherVote = otherEvent.voters?.[username] || 0;
        if (otherVote === newVote) {
          const overlap = currentDays.filter(day => otherEvent.days?.map(d => d.toLowerCase())?.includes(day));
          if (overlap.length > 0) {
            Alert.alert("Voting Error", `You've already used your ${newVote === 1 ? "like" : "dislike"} for ${overlap[0]}`);
            return;
          }
        }
      }
    }

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

    try {
      const groupSnap = await getDoc(groupDocRef);
      if (!groupSnap.exists()) await setDoc(groupDocRef, { slices: {} });

      const fresh = (await getDoc(groupDocRef)).data();
      const slice = fresh?.slices?.[eventKey] || eventItem;

      const currVotes = slice.votes || 0;
      const currVoters = slice.voters || {};
      const userVote = currVoters[username] || 0;

      let updatedVotes, updatedVoters;

      if (userVote === voteValue) {
        updatedVotes = currVotes - voteValue;
        updatedVoters = { ...currVoters };
        delete updatedVoters[username];
      } else {
        updatedVotes = currVotes + voteValue - userVote;
        updatedVoters = { ...currVoters, [username]: voteValue };
      }

      await updateDoc(groupDocRef, {
        [`slices.${eventKey}`]: {
          ...slice,
          votes: updatedVotes,
          voters: updatedVoters,
        }
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update your vote. Try again.");
    }
  };

  if (loadingEventData) return <Text>Loading events...</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.titleContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={44} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>
          TOP EVENTS OF {selectedDay === "WEEK" ? "THE WEEK" : selectedDay?.toUpperCase() || "THE WEEK"}
        </Text>
      </View>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            {Object.keys(eventData).length === 0 ? (
              <Text style={styles.noEventsText}>NO EVENTS CURRENTLY SCHEDULED</Text>
            ) : (
              <View style={styles.EventDataList}>
                {Object.entries(eventData)
                  .sort(([, a], [, b]) => (b.votes || 0) - (a.votes || 0))
                  .map(([eventKey, data]) => {
                    const userVote = getUserVote(eventKey);
                    const isTopEvent = eventKey === eventWithMostVotes;
                    const bgColor = isTopEvent
                      ? 'rgb(70, 233, 70)'
                      : data.votes > 0
                      ? '#d4f7d4'
                      : data.votes < 0
                      ? '#ffdddd'
                      : '#fff';

                    return (
                      <View key={eventKey} style={[styles.cardContainer, { backgroundColor: bgColor }]}>
                        <View style={styles.cardContentRow}>
                          <View style={styles.eventDetailsColumn}>
                            <Text style={styles.cardTitle}>{eventKey}</Text>
                            {data.imageUri && <Image source={{ uri: data.imageUri }} style={styles.cardImage} />}
                            <Text style={styles.cardDetails}>
                              {data.days?.join(", ") || "No day assigned"} | {data.startTime} - {data.endTime}
                            </Text>
                          </View>
                          <View style={styles.voteColumn}>
                            {isTopEvent && (
                              <View style={styles.starContainer}>
                                <MaterialIcons name="star" size={32} color="black" />
                              </View>
                            )}
                            <Text style={styles.voteCount}>{data.votes || 0}</Text>
                          </View>
                        </View>
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
  backButton: {
    position: 'absolute',
    left: 0,
    top: 52,
    width: 60,
    paddingLeft: 10,
  },
  noEventsText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
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
  },
  eventDetailsColumn: {
    flex: 3,
    paddingRight: 10,
  },
  voteColumn: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  voteCount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 4,
    color: 'black',
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
    marginHorizontal: 5,
    marginTop: 4,
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
    borderRadius: 8,
  },
});

export default EventsOfWeek;
