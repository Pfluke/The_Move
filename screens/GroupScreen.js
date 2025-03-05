import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { io } from "socket.io-client";

const socket = io('http://localhost:3000'); // Update IP if needed

const GroupScreen = ({ navigation, route }) => {
  const { username, userGroups: initialGroups = [] } = route.params || {}; // Get username & initial groups from route params
  const [message, setMessage] = useState('');
  const [userGroups, setUserGroups] = useState(initialGroups); // Store groups the user is part of
  const [groupName, setGroupName] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // State to store error messages
  const [creators, setCreators] = useState({}); // Store creators for each group
  const [loadingCreators, setLoadingCreators] = useState(new Set()); // Track loading state for creators

  useEffect(() => {
    // Fetch creators for updated groups
    userGroups.forEach(group => getGroupCreator(group));

    // Listen for group updates (when a new group is created or joined)
    socket.on('updateGroups', (updatedGroups) => {
      const NewuserGroups = Object.entries(updatedGroups)
        .filter(([_, members]) => members.includes(username.toLowerCase()))
        .map(([groupName]) => groupName);
      setUserGroups(NewuserGroups); // Update state with latest groups

      // Fetch creators for updated groups
      NewuserGroups.forEach(group => getGroupCreator(group));
    });

    socket.on('groupDeleteResponse', (message) => {
      setMessage(message); // Display response
    });

    socket.on('groupUpdate', (msg) => {
      setMessage(msg);
    });

    // Listen for 'groupJoinFailure' and display the error message
    socket.on('groupJoinFailure', (error) => {
      setErrorMessage(error); // Set the error message from the server
    });

    // Set interval to refresh group list every 5 seconds
    const interval = setInterval(() => {
      socket.emit('requestGroups');
    }, 50000);

    return () => {
      socket.off('updateGroups');
      socket.off('groupUpdate');
      socket.off('groupJoinFailure');
      socket.off('groupDeleteResponse'); // Clean up event listener
      clearInterval(interval); // Clear interval when the component unmounts
    };
  }, [username]);

  // Function to fetch creator of a group
  const getGroupCreator = (group) => {
    setLoadingCreators((prev) => new Set(prev).add(group)); // Start loading state
    socket.emit('getGroupCreatorInfo', group); // Request the group creator

    socket.on('groupCreatorInfo', (data) => {
      if (!data || typeof data !== "object" || !data.groupName || !data.creator) {
        console.error("Invalid event data received:", data);
        return;
      }

      setCreators((prevCreators) => ({
        ...prevCreators,
        [data.groupName]: data.creator,
      }));

      setLoadingCreators((prev) => {
        const newLoading = new Set(prev);
        newLoading.delete(data.groupName);
        return newLoading;
      });
    });
  };

  const joinGroup = () => {
    if (groupName.trim()) {
      socket.emit('joinGroup', groupName, username);
      setGroupName('');
    } else {
      Alert.alert('Error', 'Please enter a valid group name');
    }
  };

  const createGroup = () => {
    if (groupName.trim()) {
      socket.emit('createGroup', groupName, username);
      setGroupName('');
    } else {
      Alert.alert('Error', 'Please enter a valid group name');
    }
  };

  const leaveGroup = (group) => {
    socket.emit('leaveGroup', group, username);
    setUserGroups((prevGroups) => prevGroups.filter(g => g !== group));
  };

  const handleDeleteGroup = (group) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete ${group}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            socket.emit('deleteGroup', group);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Title Section */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>THE MOVE</Text>
        <View style={styles.titleUnderline}></View>
      </View>
      <View style={styles.titleUnderline}></View>
      <Text style={styles.headerLeft}>...c'mon, WTM!?</Text>
      <Text style={styles.headerRight}>...patience, my friend.</Text>
      <Text>What's Up, {username}!</Text>
      {/* Placeholder!
      <View style={styles.welcomeTransformContainer}>
        <Text style={styles.welcomeText}>
          Hey there, <Text style={[styles.welcomeText, { fontWeight: 'bold' }]}>{username}</Text>
        </Text>
      </View>
      <View style={styles.welcomeUnderline}></View>
      {/* Wrap message in <Text> */}
      {/* {message && <Text>{message}</Text>} */}
      {/* Wrap error message in <Text> */} 

      {/* Error Message */}
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {/* Group List */}
      <ScrollView style={styles.groupsList}>
        {userGroups.length > 0 ? (
          userGroups.map((group) => (
            <View key={group} style={styles.groupCard}>
              <Text style={styles.groupName}>Group: {group}</Text>
              {loadingCreators.has(group) ? (
                <Text style={styles.creatorText}>Loading creator...</Text>
              ) : (
                <Text style={styles.creatorText}>Creator: {creators[group] || 'No creator found'}</Text>
              )}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Screen3', { username, groupName: group })}
                >
                  <Text style={styles.actionButtonText}>Go to {group}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.leaveButton}
                  onPress={() => leaveGroup(group)}
                >
                  <Text style={styles.leaveButtonText}>Leave Group</Text>
                </TouchableOpacity>
              </View>
              {creators[group] === username && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteGroup(group)}
                >
                  <Text style={styles.deleteButtonText}>Delete Group</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <TouchableOpacity
            style={styles.addGroupCard}
            onPress={() => setGroupName('')} // Focus on the input field
          >
            <Text style={styles.addGroupText}>+ Add Group</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Group Input and Buttons */}
      <View style={styles.bottomContainer}>
        <TextInput
          style={styles.input}
          placeholder="ENTER GROUP NAME"
          placeholderTextColor="#888"
          value={groupName}
          onChangeText={setGroupName}
        />
        <TouchableOpacity style={styles.button} onPress={joinGroup}>
          <Text style={styles.buttonText}>JOIN GROUP</Text>
        </TouchableOpacity>
        <View style={styles.buttonSpacer} />
        <TouchableOpacity style={styles.button} onPress={createGroup}>
          <Text style={styles.buttonText}>CREATE GROUP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 30, 
  },
  title: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    width: '100%',
    paddingBottom: 15,
  },
  titleUnderline: {
    height: 5,
    width: '75%',
    backgroundColor: '#000000',
  },
  groupsList: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 140,
  },
  groupCard: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  addGroupCard: {
    marginBottom: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#000000',
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGroupText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  creatorText: {
    fontSize: 16,
    color: '#000000',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  leaveButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#FFCCCC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonSpacer: {
    height: 10,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  bottomContainer: {
    width: '100%',
    marginBottom: 20,
  },
});

export default GroupScreen;