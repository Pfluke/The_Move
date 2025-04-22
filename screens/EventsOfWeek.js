import React, { useEffect, useState } from 'react';
import { 
  View, Text, Alert, StyleSheet, ScrollView, TouchableOpacity, 
  KeyboardAvoidingView, Platform, SafeAreaView, StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getFirestore, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

// Helper function to calculate card color based on votes
const getCardColor = (votes) => {
  if (!votes || votes === 0) return '#FFFFFF'; // White for no votes
  
  const maxVotes = 10;
  const normalizedVote = Math.max(-1, Math.min(1, votes / maxVotes));
  
  if (normalizedVote > 0) {
    const intensity = Math.min(0.8, normalizedVote * 1.2);
    return `rgba(200, 255, 200, ${intensity})`; // Light green
  } else {
    const intensity = Math.min(0.8, Math.abs(normalizedVote) * 1.2);
    return `rgba(255, 200, 200, ${intensity})`; // Light red
  }
};

const EventsOfWeek = ({ navigation, route }) => {
  const { selectedDay, username, groupName, initialEventData } = route.params;
  const [loadingEventData, setLoadingEventData] = useState(false);
  const [eventData, setEventData] = useState({});
  const [topEventKeys, setTopEventKeys] = useState([]);

  const groupDocRef = doc(db, "groups", groupName);

  useEffect(() => {
    if (selectedDay === "WEEK") {
      setEventData(initialEventData || {});
      updateTopEvents(initialEventData || {});
      return;
    }

    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const slices = docSnap.data()?.slices || {};

        const filtered = Object.entries(slices).filter(([, sliceData]) => {
          const compareDay = selectedDay.toLowerCase().trim();
          
          if (sliceData.days && Array.isArray(sliceData.days)) {
            return sliceData.days.map(day => day.toLowerCase().trim()).includes(compareDay);
          } else if (sliceData.day) {
            return sliceData.day.toLowerCase().trim() === compareDay;
          } else {
            return false;
          }
        });

        const filteredData = Object.fromEntries(filtered);
        setEventData(filteredData);
        updateTopEvents(filteredData);
      } else {
        Alert.alert("Error", "Group not found");
      }
    });

    return () => unsubscribe();
  }, [selectedDay, groupName]);

  const updateTopEvents = (events) => {
    let maxVotes = -Infinity;
    let topEvents = [];

    Object.entries(events).forEach(([eventKey, sliceData]) => {
      const votes = sliceData.votes || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        topEvents = [eventKey];
      } else if (votes === maxVotes) {
        topEvents.push(eventKey);
      }
    });
    setTopEventKeys(topEvents);
  };

  const getUserVote = (eventKey) => {
    const evt = eventData[eventKey] || {};
    return evt.voters ? evt.voters[username] : 0;
  };

  const handleVote = async (eventKey, voteValue) => {
    try {
      const eventItem = eventData[eventKey];
      if (!eventItem) return;

      const currentVote = eventItem.voters?.[username] || 0;
      const newVote = currentVote === voteValue ? 0 : voteValue;
      const voteDiff = newVote - currentVote;

      if (newVote !== 0) {
        const currentDays = eventItem.days ? eventItem.days.map(day => day.toLowerCase()) : [];
        for (const [otherKey, otherEvent] of Object.entries(eventData)) {
          if (otherKey === eventKey) continue;
          const otherUserVote = (otherEvent.voters && otherEvent.voters[username]) || 0;
          if (otherUserVote === newVote) {
            const otherDays = otherEvent.days ? otherEvent.days.map(day => day.toLowerCase()) : [];
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

      const updatedEventData = {
        ...eventData,
        [eventKey]: {
          ...eventItem,
          votes: (eventItem.votes || 0) + voteDiff,
          voters: {
            ...eventItem.voters,
            [username]: newVote
          }
        }
      };

      setEventData(updatedEventData);
      updateTopEvents(updatedEventData);

      await updateDoc(groupDocRef, {
        [`slices.${eventKey}.votes`]: (eventItem.votes || 0) + voteDiff,
        [`slices.${eventKey}.voters.${username}`]: newVote === 0 ? null : newVote
      }, { merge: true });

    } catch (error) {
      console.error("Voting error:", error);
      Alert.alert("Error", "Failed to update vote. Please try again.");
      setEventData({ ...eventData });
    }
  };

  if (loadingEventData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {selectedDay === "WEEK" ? "WEEKLY EVENTS" : selectedDay?.toUpperCase() || "EVENTS"}
        </Text>

        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {eventData && Object.keys(eventData).length === 0 ? (
            <Text style={styles.noEventsText}>No events scheduled</Text>
          ) : (
            <View style={styles.eventsContainer}>
              {Object.entries(eventData)
                .sort(([, a], [, b]) => (b.votes || 0) - (a.votes || 0))
                .map(([eventKey, data]) => {
                  const userVote = getUserVote(eventKey);
                  const isTopEvent = topEventKeys.includes(eventKey);
                  const cardColor = getCardColor(data.votes || 0);

                  return (
                    <View 
                      key={eventKey} 
                      style={[
                        styles.eventCard,
                        { backgroundColor: cardColor },
                        isTopEvent && styles.topEventBorder
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Event', {
                          groupName,
                          sliceName: eventKey,
                          username,
                        })}
                        style={styles.cardContent}
                      >
                        <View style={styles.cardHeader}>
                          <Text style={styles.eventTitle}>{eventKey}</Text>
                          <View style={styles.voteContainer}>
                            {isTopEvent && (
                              <MaterialIcons 
                                name="star" 
                                size={24} 
                                color="#FFD700" 
                                style={styles.starIcon} 
                              />
                            )}
                            <Text style={styles.voteCount}>{data.votes || 0}</Text>
                          </View>
                        </View>
                        
                        <Text style={styles.eventDetails}>
                          {data.day  || "No day assigned"} | {data.startTime} - {data.endTime}
                        </Text>

                        {data.description && (
                          <Text style={styles.eventDescription} numberOfLines={2}>
                            {data.description}
                          </Text>
                        )}
                      </TouchableOpacity>

                      <View style={styles.votingButtons}>
                        <TouchableOpacity 
                          onPress={() => handleVote(eventKey, 1)}
                          style={[
                            styles.voteButton,
                            userVote === 1 && styles.selectedVote
                          ]}
                        >
                          <MaterialIcons name="thumb-up" size={24} color="#000000" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => handleVote(eventKey, -1)}
                          style={[
                            styles.voteButton,
                            userVote === -1 && styles.selectedVote
                          ]}
                        >
                          <MaterialIcons name="thumb-down" size={24} color="#000000" />
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
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF' 
  },
  loadingText: { 
    fontSize: 18, 
    color: '#888' 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E0E0E0' 
  },
  backButton: { 
    width: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitle: { 
    fontSize: 25, 
    fontWeight: 'bold', 
    color: '#000000', 
    textTransform: 'uppercase', 
    flex: 1, 
    textAlign: 'center' },
  scrollContainer: { 
    flexGrow: 1, 
    padding: 15 
  },
  noEventsText: { 
    fontSize: 16, 
    color: '#888', 
    textAlign: 'center', 
    marginTop: 32 
  },
  eventsContainer: { 
    width: '100%' 
  },
  eventCard: { 
    borderRadius: 8, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#E0E0E0',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 2 
  },
  topEventBorder: { 
    borderColor: '#4CAF50', 
    borderWidth: 2 
  },
  cardContent: { 
    flex: 1 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  eventTitle: { 
    fontSize: 21, 
    fontWeight: 'bold', 
    color: '#000000', 
    flex: 1 
  },
  voteContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  starIcon: { 
    marginRight: 8 
  },
  voteCount: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#000000' 
  },
  eventDetails: { 
    fontSize: 14, 
    color: '#666666', 
    marginBottom: 8 
  },
  eventDescription: { 
    fontSize: 14, 
    color: '#888888', 
    marginBottom: 12 
  },
  votingButtons: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 8 
  },
  voteButton: { 
    padding: 8, 
    marginHorizontal: 16, 
    borderRadius: 8 
  },
  selectedVote: { 
    backgroundColor: 'rgba(0, 122, 255, 0.1)', 
    borderWidth: 1, 
    borderColor: '#007AFF' 
  },
});

export default EventsOfWeek;
