import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Alert, StyleSheet,
  ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
  SafeAreaView, StatusBar,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  getFirestore,
  doc,
  updateDoc,
  onSnapshot,
  deleteField
} from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

const getCardColor = votes => {
  if (!votes) return '#FFFFFF';
  const norm = Math.max(-1, Math.min(1, votes / 10));
  if (norm > 0) {
    const i = Math.min(0.8, norm * 1.2);
    return `rgba(200,255,200,${i})`;
  } else {
    const i = Math.min(0.8, Math.abs(norm) * 1.2);
    return `rgba(255,200,200,${i})`;
  }
};

const EventsOfWeek = ({ navigation, route }) => {
  const { selectedDay, username, groupName } = route.params;
  const [eventData, setEventData] = useState({});
  const [topEventKeys, setTopEventKeys] = useState([]);
  const [filterDay, setFilterDay] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const groupRef = doc(db, 'groups', groupName);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(groupRef, snap => {
      if (!snap.exists()) {
        Alert.alert('Error', 'Group not found');
        return;
      }

      const raw = snap.data().slices || {};
      // Determine which "day" to filter by:
      //   - If modal = "All", treat as WEEK (no filter)
      //   - Otherwise use filterDay if set, else selectedDay
      const dayToShow =
        filterDay === 'All'
          ? 'WEEK'
          : filterDay || selectedDay;

      // Build entries, filtering only if dayToShow !== 'WEEK'
      let entries = Object.entries(raw);
      if (dayToShow !== 'WEEK') {
        entries = entries.filter(([_, sl]) => {
          const days = sl.days || (sl.day ? [sl.day] : []);
          return days
            .map(d => d.toLowerCase().trim())
            .includes(dayToShow.toLowerCase().trim());
        });
      }

      // Compute vote totals from voters map
      const withVotes = Object.fromEntries(
        entries.map(([key, sl]) => {
          const voters = sl.voters || {};
          const total = Object.values(voters).reduce(
            (sum, v) => sum + (Number(v) || 0),
            0
          );
          return [key, { ...sl, votes: total }];
        })
      );

      setEventData(withVotes);
      updateTopEvents(withVotes);
    }, err => {
      console.error(err);
      Alert.alert('Error', 'Could not load events');
    });

    return () => unsubscribe();
  }, [groupName, selectedDay, filterDay]);

  const updateTopEvents = events => {
    let max = -Infinity, winners = [];
    for (const [k, sl] of Object.entries(events)) {
      if (sl.votes > max) {
        max = sl.votes;
        winners = [k];
      } else if (sl.votes === max) {
        winners.push(k);
      }
    }
    setTopEventKeys(winners);
  };

  const getUserVote = key => {
    const v = eventData[key]?.voters?.[username];
    return v === 1 || v === -1 ? v : 0;
  };

  const handleVote = async (key, val) => {
    const sl = eventData[key];
    if (!sl) return;
    const current = getUserVote(key);
    const next = current === val ? 0 : val;
    const diff = next - current;

    // Optimistically update UI
    const updated = {
      ...eventData,
      [key]: {
        ...sl,
        votes: sl.votes + diff,
        voters: {
          ...sl.voters,
          [username]: next !== 0 ? next : undefined
        }
      }
    };
    setEventData(updated);
    updateTopEvents(updated);

    // Persist only the voter field
    const voterPath = `slices.${key}.voters.${username}`;
    try {
      await updateDoc(groupRef, {
        [voterPath]: next === 0 ? deleteField() : next
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not register vote');
    }
  };

  const renderEvents = () => {
    const keys = Object.keys(eventData);
    if (!keys.length) {
      return <Text style={styles.noEventsText}>NO EVENTS SCHEDULED</Text>;
    }
    return keys
      .sort((a, b) => eventData[b].votes - eventData[a].votes)
      .map(key => {
        const sl = eventData[key];
        const userVote = getUserVote(key);
        const isTop = topEventKeys.includes(key);
        return (
          <View
            key={key}
            style={[
              styles.eventCard,
              { backgroundColor: getCardColor(sl.votes) },
              isTop && styles.topEventBorder
            ]}
          >
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() =>
                navigation.navigate('Event', { groupName, sliceName: key, username })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.eventTitle}>{key}</Text>
                <View style={styles.voteContainer}>
                  {isTop && (
                    <MaterialIcons name="star" size={24} color="#FFD700" />
                  )}
                  <Text style={styles.voteCount}>{sl.votes}</Text>
                </View>
              </View>
              <Text style={styles.eventDetails}>
                {sl.day || 'No day'} | {sl.startTime}–{sl.endTime}
              </Text>
              {sl.description && (
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {sl.description}
                </Text>
              )}
            </TouchableOpacity>
            <View style={styles.votingButtons}>
              <TouchableOpacity
                onPress={() => handleVote(key, 1)}
                style={[styles.voteButton, userVote === 1 && styles.selectedVote]}
              >
                <MaterialIcons name="thumb-up" size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleVote(key, -1)}
                style={[styles.voteButton, userVote === -1 && styles.selectedVote]}
              >
                <MaterialIcons name="thumb-down" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        );
      });
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={32} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {(filterDay || selectedDay).toUpperCase()} EVENTS
          </Text>
          <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            <MaterialIcons name="filter-list" size={28} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContainer}
          >
            {renderEvents()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {showFilterModal && (
        <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
          <View style={styles.overlay}>
            <View style={styles.filterModalContent}>
              {[
                'All',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday'
              ].map(day => (
                <TouchableOpacity
                  key={day}
                  onPress={() => {
                    setFilterDay(day);
                    setShowFilterModal(false);
                  }}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scrollContainer: { padding: 15 },
  noEventsText: { textAlign: 'center', marginTop: 32, color: '#888' },

  eventCard: {
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  topEventBorder: { borderColor: '#4CAF50', borderWidth: 2 },

  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  eventTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  voteContainer: { flexDirection: 'row', alignItems: 'center' },
  voteCount: { marginLeft: 4, fontSize: 16, fontWeight: 'bold' },
  eventDetails: { color: '#666', marginBottom: 8 },
  eventDescription: { color: '#888', marginBottom: 12 },

  votingButtons: { flexDirection: 'row', justifyContent: 'center' },
  voteButton: { padding: 8, marginHorizontal: 16, borderRadius: 8 },
  selectedVote: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderWidth: 1,
    borderColor: '#007AFF'
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center'
  },
  modalItem: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc'
  },
  modalItemText: { fontSize: 18, fontWeight: 'bold' }
});

export default EventsOfWeek;
