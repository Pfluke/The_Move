import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, Image, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { Picker } from '@react-native-picker/picker';

const db = getFirestore(app);

const AddSliceScreen = ({ navigation, route }) => {
  const { groupName } = route.params;
  const [inputText, setInputText] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [imageUri, setImageUri] = useState(null);
  const [selectedDay, setSelectedDay] = useState(''); // Track latest selected day

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImageUri(result.uri);
    }
  };

  const generateTimeSlots = () => {
    const timeSlots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = h < 10 ? `0${h}` : h;
        const minute = m < 10 ? `0${m}` : m;
        timeSlots.push(`${hour}:${minute}`);
      }
    }
    return timeSlots;
  };

  const handleDaySelection = (day) => {
    if (!selectedDays.includes(day)) {
      setSelectedDays([...selectedDays, day]);
    }
    setSelectedDay(day);
  };

  const addSlice = async () => {
    if (inputText.trim() !== '' && description.trim() !== '' && selectedDays.length > 0 && startTime && endTime) {
      const newSlice = inputText.trim();
      try {
        const newSliceData = {
          votes: 0,
          voters: {},
          description: description,
          days: selectedDays,
          startTime: startTime,
          endTime: endTime,
          imageUri: imageUri || '',
        };

        await updateDoc(doc(db, "groups", groupName), {
          [`slices.${newSlice}`]: newSliceData
        });

        Alert.alert("Success", "Slice added!");
        navigation.goBack();
      } catch (error) {
        console.error("Error adding slice:", error);
        Alert.alert("Error", error.message);
      }
    } else {
      Alert.alert("Invalid Input", "All fields must be filled.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a New Slice</Text>

      <TextInput
        placeholder="Enter slice name"
        value={inputText}
        onChangeText={setInputText}
        style={styles.input}
      />

      <TextInput
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />

      <Text style={styles.subtitle}>Select Days</Text>
      <Picker
        selectedValue={selectedDay}
        style={styles.picker}
        onValueChange={(itemValue) => handleDaySelection(itemValue)}
      >
        <Picker.Item label="Select a day" value="" />
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
          <Picker.Item key={day} label={day} value={day} />
        ))}
      </Picker>
      <Text>Selected Days: {selectedDays.join(', ')}</Text>

      <Text style={styles.subtitle}>Set Start and End Times</Text>

      <Text>Start Time</Text>
      <Picker
        selectedValue={startTime}
        style={styles.picker}
        onValueChange={(itemValue) => setStartTime(itemValue)}
      >
        {generateTimeSlots().map((time, index) => (
          <Picker.Item key={index} label={time} value={time} />
        ))}
      </Picker>

      <Text>End Time</Text>
      <Picker
        selectedValue={endTime}
        style={styles.picker}
        onValueChange={(itemValue) => setEndTime(itemValue)}
      >
        {generateTimeSlots().map((time, index) => (
          <Picker.Item key={index} label={time} value={time} />
        ))}
      </Picker>

      <Button title="Pick an Image" onPress={pickImage} />

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
      )}

      <Button title="Add Slice" onPress={addSlice} />
      <Button title="Cancel" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'lightgray',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    width: '80%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  picker: {
    height: 50,
    width: '80%',
    marginBottom: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginVertical: 10,
    borderRadius: 10,
  },
});

export default AddSliceScreen;
