import React, { useState } from 'react';
import {
  View, Text, Button, Alert, StyleSheet, Image, TextInput, 
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { Picker } from '@react-native-picker/picker';

const db = getFirestore(app);

const AddSliceScreen = ({ navigation, route }) => {
  const { groupName } = route.params;
  const [inputText, setInputText] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [imageUri, setImageUri] = useState(null);
  
  // Days available for selection
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Simplified time slots - only show half-hour increments
  const timeOptions = Array.from({length: 24}, (_, i) => {
    const hour = i < 10 ? `0${i}` : i;
    return [`${hour}:00`, `${hour}:30`];
  }).flat();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // Add a day to selectedDays
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const addSlice = async () => {
    if (inputText.trim() === '' || description.trim() === '' || 
        !selectedDays.length || !startTime || !endTime) {
      Alert.alert('Invalid Input', 'All fields must be filled.');
      return;
    }
    
    try {
      const groupRef = doc(db, 'groups', groupName);
      const docSnap = await getDoc(groupRef);

      const newSliceData = {
        votes: 0,
        voters: {},
        description: description,
        days: selectedDays,
        startTime: startTime,
        endTime: endTime,
        imageUri: imageUri || '',
      };

      await updateDoc(groupRef, {
        [`slices.${inputText.trim()}`]: newSliceData,
      });

      Alert.alert('Success', 'Slice added!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Add a New Event</Text>

          <TextInput
            placeholder="Event name"
            value={inputText}
            onChangeText={setInputText}
            style={styles.input}
          />

          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />

          <View style={styles.sectionContainer}>
            <Text style={styles.subtitle}>Select Days</Text>
            
            {/* Direct day selection buttons instead of picker */}
            <View style={styles.dayButtonsContainer}>
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(day) ? styles.dayButtonSelected : {}
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={selectedDays.includes(day) ? styles.dayButtonTextSelected : styles.dayButtonText}>
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.timeContainer}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <View style={styles.timePickerContainer}>
                <Picker
                  selectedValue={startTime}
                  style={styles.timePicker}
                  onValueChange={setStartTime}
                >
                  {timeOptions.map(time => (
                    <Picker.Item key={`start-${time}`} label={time} value={time} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>End Time</Text>
              <View style={styles.timePickerContainer}>
                <Picker
                  selectedValue={endTime}
                  style={styles.timePicker}
                  onValueChange={setEndTime}
                >
                  {timeOptions.map(time => (
                    <Picker.Item key={`end-${time}`} label={time} value={time} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <Button title="Pick an Image" onPress={pickImage} />
          {imageUri && <Image source={{uri: imageUri}} style={styles.imagePreview} />}

          <View style={styles.buttonContainer}>
            <Button title="Add Event" onPress={addSlice} />
            <View style={styles.buttonSpacer} />
            <Button title="Cancel" onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'lightgray',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    padding: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  sectionContainer: {
    marginVertical: 8,
  },
  dayButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  dayButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#0d47a1',
  },
  dayButtonText: {
    color: '#333',
    fontSize: 14,
  },
  dayButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  timeColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 120,
    overflow: 'hidden',
  },
  timePicker: {
    height: 120,
  },
  imagePreview: {
    width: 80,
    height: 80,
    marginVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonContainer: {
    marginTop: 8,
  },
  buttonSpacer: {
    height: 8,
  }
});

export default AddSliceScreen;