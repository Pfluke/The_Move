import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator,
  TouchableOpacity, StatusBar, SafeAreaView
} from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

const db = getFirestore(app);

const Event = ({ route, navigation }) => {
  const { groupName, sliceName, username } = route.params;
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const groupDocRef = doc(db, 'groups', groupName);
        const groupDocSnap = await getDoc(groupDocRef);

        if (groupDocSnap.exists()) {
          const data = groupDocSnap.data();
          const sliceData = data?.slices?.[sliceName];

          if (sliceData) {
            const safeSliceData = {
              description: sliceData.description || "No description available.",
              startTime: sliceData.startTime || "N/A",
              endTime: sliceData.endTime || "N/A",
              days: Array.isArray(sliceData.days) ? sliceData.days : 
                   (sliceData.day ? [sliceData.day] : ["No days assigned"]),
            };
            setEventData(safeSliceData);
          } else {
            Alert.alert("Error", "Event not found.");
            setEventData({
              description: "Event data missing.",
              startTime: "N/A",
              endTime: "N/A",
              days: ["No days assigned"],
            });
          }
        } else {
          Alert.alert("Error", "Group not found.");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to fetch event data.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [groupName, sliceName]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (!eventData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No event data available.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{sliceName.toUpperCase()}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.cardContent}>{eventData.description}</Text>

          <Text style={styles.sectionTitle}>Time</Text>
          <Text style={styles.cardContent}>
            {eventData.startTime} - {eventData.endTime}
          </Text>

          <Text style={styles.sectionTitle}>Days</Text>
          <Text style={styles.cardContent}>
            {eventData.days.join(', ')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('EventScreen', { username, groupName })}
        >
          <Text style={styles.buttonText}>Back to Group</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#000' },
  container: { padding: 20, alignItems: 'center', backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#888' },
  errorText: { fontSize: 16, color: '#888' },
  card: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  cardContent: { fontSize: 12, color: '#555', marginBottom: 20, textAlign: 'left' },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#000',
    width: '90%',
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default Event;