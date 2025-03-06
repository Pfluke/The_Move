import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getFirestore, doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig'; 

const db = getFirestore(app);

const Screen3 = ({ navigation, route }) => {
  const { username, groupName = 'default_group' } = route.params || {};
  const [slices, setSlices] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingSlices, setLoadingSlices] = useState(true);

  // reference to the Firestore document for the current group
  const groupDocRef = doc(db, "groups", groupName);

  useEffect(() => {
    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSlices(data.slices || []);
        setLoadingSlices(false);
      } else {
        setDoc(groupDocRef, { slices: [] })
          .then(() => {
            setSlices([]);
            setLoadingSlices(false);
          })
          .catch((error) => {
            console.error("Error creating group document:", error);
            Alert.alert("Error", error.message);
          });
      }
    }, (error) => {
      console.error("Error fetching slices: ", error);
      Alert.alert("Error", error.message);
    });

    return () => unsubscribe();
  }, [groupName]);

  const addSlice = async () => {
    if (inputText.trim() !== '') {
      const newSlice = inputText.trim();
      if (slices.includes(newSlice)) {
        Alert.alert('Duplicate Slice', 'This slice already exists.');
        return;
      }
      try {
        await updateDoc(groupDocRef, {
          slices: arrayUnion(newSlice)
        });
        setInputText('');
      } catch (error) {
        console.error("Error adding slice:", error);
        Alert.alert("Error", error.message);
      }
    }
  };

  const removeSlice = async (sliceToRemove) => {
    try {
      await updateDoc(groupDocRef, {
        slices: arrayRemove(sliceToRemove)
      });
    } catch (error) {
      console.error("Error removing slice:", error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wheel of Fortune</Text>
      <Text style={styles.groupText}>Group: {groupName}</Text>

      <TextInput
        placeholder="Enter slice name"
        value={inputText}
        onChangeText={setInputText}
        style={styles.input}
      />
      <Button title="Add Slice" onPress={addSlice} />

      <Text style={styles.subtitle}>All Slices</Text>

      {loadingSlices ? (
        <Text>Loading slices...</Text>
      ) : slices.length === 0 ? (
        <Text>No slices available yet...</Text>
      ) : (
        <ScrollView style={styles.slicesList}>
          {slices.map((slice, index) => (
            <View key={index} style={styles.sliceContainer}>
              <Text style={styles.sliceText}>
                {index + 1}. {slice}
              </Text>
              <TouchableOpacity onPress={() => removeSlice(slice)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* When navigating back to the Group Screen, pass the username parameter */}
      <Button
        title="Go to Group Screen"
        onPress={() => navigation.navigate('GroupScreen', { username })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  groupText: {
    marginVertical: 10,
  },
  input: {
    width: '80%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  slicesList: {
    maxHeight: 200,
    width: '80%',
    borderWidth: 1,
    padding: 10,
  },
  sliceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  sliceText: {
    fontSize: 16,
  },
  removeButton: {
    color: 'red',
    fontSize: 16,
  },
});

export default Screen3;
