import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard, Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Simplified time slots - only show half-hour increments
const timeOptions = Array.from({length: 24}, (_, i) => {
  const hour = i < 10 ? `0${i}` : i;
  return [`${hour}:00`, `${hour}:30`];
}).flat();

const AddEventModal = ({ visible, onClose, onSubmit }) => {
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [descriptionWarning, setDescriptionWarning] = useState(false);
  
    const handleNext = () => {
      if (step === 1) {
        if (!title.trim()) {
          Alert.alert('Title Required', 'Please enter a title for your event.');
          return;
        }
    
        if (!description.trim() && !descriptionWarning) {
          Alert.alert(
            'Missing Details',
            'Your buddies may appreciate information regarding event location, pricing, and any other important details.'
          );
          setDescriptionWarning(true);
          return;
        }
    
        setStep(2);
      } else if (step === 2) {
        if (!selectedDay || !startTime || !endTime) {
          Alert.alert('Missing Info', 'Please select a day and time.');
          return;
        }
        setStep(3);
      }
    };
  
    const resetModal = () => {
      setStep(1);
      setTitle('');
      setDescription('');
      setSelectedDay();
      setStartTime('09:00');
      setEndTime('17:00');
      setDescriptionWarning(false)
    };
  
    const handleCancel = () => {
      resetModal();
      onClose();
    };
  
    const handleSubmit = () => {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        day: selectedDay,
        startTime,
        endTime,
        hasSeen:[]
      };
      resetModal();
      onSubmit(eventData);
    };
  
    return (
      <Modal visible={visible} animationType="fade" transparent={true}>
        <View style={styles.overlay}>
          <View style={[
            step === 1 ? styles.titleModalContent :
            step === 2 ? styles.dateAndTimeModalContent :
            styles.reviewModalContent
          ]}>
            <View contentContainerStyle={styles.innerModal}>
              {step === 1 && (
                <>
                  <Text style={styles.header}>Event Title</Text>
                  <TextInput
                    placeholder="Event Title"
                    placeholderTextColor="#888"
                    textAlign='center'
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                  <Text style={styles.details}>Optional: Event Details</Text>
                  <TextInput
                    placeholder="Event Details"
                    placeholderTextColor="#888"
                    textAlign='center'
                    value={description}
                    onChangeText={setDescription}
                    style={[styles.input, { height: 100 }]}
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </>
              )}
  
              {step === 2 && (
                <>
                  <Text style={styles.header}>Choose Day & Time</Text>
                  <View style={styles.scrollPickerContainer}>
                    <Text style={styles.timeLabel}>Select Day</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
                      {DAYS.map(day => (
                        <TouchableOpacity
                          key={day}
                          style={[styles.dayOption, selectedDay === day ? styles.selectedDay : null]}
                          onPress={() => setSelectedDay(day)}
                        >
                          <Text style={selectedDay === day ? styles.selectedDayText : styles.dayOptionText}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
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
                            <Picker.Item key={`start-${time}`} label={time} value={time} color="black"/>
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
                            <Picker.Item key={`end-${time}`} label={time} value={time} color="black"/>
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </View>
                </>
              )}
  
              {step === 3 && (
              <>
                <Text style={[styles.header, styles.reviewHeader]}>Review Event</Text>
                <ScrollView contentContainerStyle={styles.reviewScrollContainer}>
                  <Text style={styles.summaryText}>
                    <Text style={{ fontWeight: 'bold' }}>Title:</Text> {title}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={{ fontWeight: 'bold' }}>Description:</Text> {description || 'None'}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={{ fontWeight: 'bold' }}>Day:</Text> {selectedDay}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={{ fontWeight: 'bold' }}>Time:</Text> {startTime} - {endTime}
                  </Text>
                </ScrollView>
              </>
            )}
              
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
  
                {step === 3 ? (
                  <TouchableOpacity onPress={handleSubmit} style={styles.nextButton}>
                    <Text style={styles.nextText}>Confirm</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                    <Text style={styles.nextText}>Next</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  export default AddEventModal;
  
  const styles = StyleSheet.create({
    overlay: {
      flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)',
    },
    titleModalContent: {
      backgroundColor: 'white', borderRadius: 20, padding: 25, width: '90%', height: '45%',
    },
    dateAndTimeModalContent: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      width: '95%',
      height: '52%',
    },
    reviewModalContent: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      width: '85%',
      height: '40%',
    },
    innerModal: {
      alignItems: 'center', justifyContent: 'center',
    },
    header: {
      fontSize: 30, fontWeight: 'bold', marginBottom: 16, alignSelf: 'center',
    },
    reviewHeader: {
      fontSize: 30, fontWeight: 'bold', marginBottom: 10, alignSelf: 'center',
    },
    details: {
      fontSize: 16, fontWeight: 'bold', marginBottom: 8, alignSelf: 'center',
    },
    input: {
      width: '100%', borderColor: 'black', borderWidth: 2, borderRadius: 16, padding: 12, marginBottom: 10,
    },
    pickerRow: {
      flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15,
    },
    picker: {
      flex: 1,
    },
    summaryText: {
      fontSize: 18, marginVertical: 5, alignSelf: 'center',
    },
    buttonRow: {
      flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20,
    },
    cancelButton: {
      padding: 10, backgroundColor: '#ffdddd', borderRadius: 3, borderWidth: 2, width: '40%', alignItems: 'center', marginHorizontal: 6,
    },
    cancelText: {
      fontWeight: 'bold', fontSize: 20, color: 'black',
    },
    nextButton: {
      padding: 10, backgroundColor: '#d4f7d4', borderRadius: 3, borderWidth: 2, width: '40%', alignItems: 'center', marginHorizontal: 6,
    },
    nextText: {
      color: 'black', fontWeight: 'bold', fontSize: 20,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 8,
      marginBottom: 10,
    },
    timeColumn: {
      flex: 1,
      marginHorizontal: 4,
    },
    timeLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 2,
      alignSelf: 'center',
    },
    timePicker: {
      height: 140,
      overflow: 'hidden',
      borderRadius: 5,
      borderWidth: 1,
      borderColor: 'black',
    },
    scrollPickerContainer: {
      marginBottom: 8,
      width: '90%',
      alignSelf: 'center',
    },
    daySelector: {
      marginVertical: 0,
      height: 66,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: 'black',
      paddingHorizontal: 0,
      paddingVertical: 10,
    },
    dayOption: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginHorizontal: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
      height: 45,
    },
    selectedDay: {
      backgroundColor: '#e8f4e8',
      borderColor: '#4CAF50',
      borderWidth: 2,
    },
    dayOptionText: {
      fontSize: 18,
      color: 'black',
    },
    selectedDayText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#2E7D32',
    },
    reviewScrollContainer: {
      paddingBottom: 30,
    },
  });