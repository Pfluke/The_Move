import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', { transports: ['websocket'] }); // Ensure WebSocket connection

const Screen3 = ({ navigation, route }) => {
  const { username, groupName = 'default_group' } = route.params || {};
  const [slices, setSlices] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingSlices, setLoadingSlices] = useState(true);

  useEffect(() => {
    Alert.alert('Test', 'This is a test alert');

    const requestSlices = () => {
      console.log("Requesting slices...");
      socket.emit('requestSlices', groupName);
    };

    // Request slices immediately on mount
    requestSlices();

    // Set interval to request slices every 5 seconds
    const interval = setInterval(requestSlices, 5000);

    // Handle incoming slice updates
    const handleUpdateSlices = (updatedSlices) => {
      console.log("Received slices:", updatedSlices);
      if (Array.isArray(updatedSlices)) {
        setSlices(updatedSlices);
        setLoadingSlices(false);
      }
    };

    socket.on('updateSlices', handleUpdateSlices);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      socket.off('updateSlices', handleUpdateSlices);
    };
  }, [groupName]);

  const addSlice = () => {
    if (inputText.trim() !== '') {
      const newSlice = inputText.trim();
      if (slices.includes(newSlice)) {
        Alert.alert('Duplicate Slice', 'This slice already exists.');
        return;
      }
      const newSlices = [...slices, newSlice];
      setSlices(newSlices);
      socket.emit('addSlices', { groupName, slices: newSlices });
      setInputText('');
    }
  };

  const removeSlice = (index) => {
    setSlices((prevSlices) => {
      const newSlices = prevSlices.filter((_, i) => i !== index);
      socket.emit('addSlices', { groupName, slices: newSlices });
      return newSlices;
    });
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
              <TouchableOpacity onPress={() => removeSlice(index)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <Button title="Go to Screen 1" onPress={() => navigation.navigate('Screen1')} />
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
