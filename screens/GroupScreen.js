import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, Alert, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

  console.log(`Received groups: ${JSON.stringify(initialGroups)}`);

  useEffect(() => {

    // Fetch creators for updated groups
    userGroups.forEach(group => getGroupCreator(group));

    // Listen for group updates (when a new group is created or joined)
    socket.on('updateGroups', (updatedGroups) => {
      const NewuserGroups = Object.entries(updatedGroups)
        .filter(([_, members]) => members.includes(username.toLowerCase()))
        .map(([groupName]) => groupName);
      console.log('Updated Groups:', NewuserGroups);
      console.log('Updated Groups after deletion:', NewuserGroups);
      setUserGroups(NewuserGroups); // Update state with latest groups

      // Fetch creators for updated groups
      NewuserGroups.forEach(group => getGroupCreator(group));
    });

    

    socket.on('groupDeleteResponse', (message) => {
      console.log(`Delete response: ${message}`);
      setMessage(message); // Display response
    });

    socket.on('groupUpdate', (msg) => {
      console.log(msg);
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
    console.log(`Requesting creator for: ${group}`);
  
    socket.emit('getGroupCreatorInfo', group); // Request the group creator
  
    socket.on('groupCreatorInfo', (data) => {
      console.log("Received event data:", data);
    
      // Ensure data is an object and has the expected keys
      if (!data || typeof data !== "object" || !data.groupName || !data.creator) {
        console.error("Invalid event data received:", data);
        return;
      }
    
      console.log(`Received creator for ${data.groupName}: ${data.creator}`);
    
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
      console.log(`Joining group: ${groupName}`);
      socket.emit('joinGroup', groupName, username);
      setGroupName('');
    } else {
      Alert.alert('Error', 'Please enter a valid group name');
    }
  };

  const createGroup = () => {
    if (groupName.trim()) {
      console.log(`Creating group: ${groupName}`);
      socket.emit('createGroup', groupName, username);
      setGroupName('');
    } else {
      Alert.alert('Error', 'Please enter a valid group name');
    }
  };

  const leaveGroup = (group) => {
    console.log(`Leaving group: ${group}`);
    socket.emit('leaveGroup', group, username);
    setUserGroups((prevGroups) => prevGroups.filter(g => g !== group));
  };

  const handleDeleteGroup = (group) => {
    console.log(`Attempting to delete group: ${group}`); // Debugging
    socket.emit('deleteGroup', group);
    console.log(`Delete request sent for: ${group}`); // Debugging
    setTimeout(() => {
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
              console.log(`Delete request sent for: ${group}`); // Debugging
            }
          }
        ]
      );
    }, 100); // Small delay to ensure UI thread updates
  };
  
  

  return (
    <View style={styles.container}>
      <View style={styles.titleTransformContainer}>
        <Text style={styles.title}>THE  MOVE</Text>
      </View>
      <View style={styles.titleUnderline}></View>
      <Text style={styles.headerLeft}>...c'mon, WTM!?</Text>
      <Text style={styles.headerRight}>...patience, my friend.</Text>
      {/* <Text>What's Up, {username}!</Text> */}
      {/* Placeholder! */}
      <View style={styles.welcomeTransformContainer}>
        <Text style={styles.welcomeText}>
          Hey there, <Text style={[styles.welcomeText, { fontWeight: 'bold' }]}>John Doe</Text>
        </Text>
      </View>
      <View style={styles.welcomeUnderline}></View>
      {/* Wrap message in <Text> */}
      {message && <Text>{message}</Text>}
      {/* Wrap error message in <Text> */}
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {/* Scrollable group containers */}
      <ScrollView style={styles.groupsList}>
        {userGroups.length > 0 ? (
          userGroups.map((group) => (
            <View key={group} style={styles.groupContainer}>
              <Text>Group: {group}</Text>
              {loadingCreators.has(group) ? (
                <Text>Loading creator...</Text>
              ) : (
                <Text>Creator: {creators[group] || 'No creator found'}</Text>
              )}
              <View style={styles.buttonContainer}>
                <Button 
                  title={`Go to ${group}`} 
                  onPress={() => navigation.navigate('Screen3', { username, groupName: group })} 
                />
                <TouchableOpacity onPress={() => leaveGroup(group)}>
                  <Text style={styles.leaveButton}>Leave Group</Text>
                </TouchableOpacity>
              </View>
              {creators[group] === username && (
                <TouchableOpacity 
                style={[styles.deleteButton, { padding: 10 }]} 
                onPress={() => handleDeleteGroup(group)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteButtonText}>Delete Group</Text>
              </TouchableOpacity>           
              
              )}
            </View>
          ))
        ) : (
          <Text style={{ 
            textAlign: 'center', 
            width: '100%', 
            color: 'red',
            fontWeight: 'bold',
          }}>
            YOU ARE NOT IN ANY GROUPS
          </Text>
        )}
      </ScrollView>

      <TextInput
        style={styles.input}
        placeholder="ENTER GROUP NAME"
        value={groupName}
        onChangeText={setGroupName}
      />
      
      <TouchableOpacity
        style={styles.button}
        onPress={joinGroup}>
        <Text style={styles.buttonText}>JOIN GROUP</Text>
      </TouchableOpacity>
      
      <View style={styles.buttonSpacer}/>
      
      <TouchableOpacity
        style={styles.button}
        onPress={createGroup}>
        <Text style={styles.buttonText}>CREATE GROUP</Text>
      </TouchableOpacity>
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
    fontSize: 35,
    fontWeight: 'bold',
    //color: '#4B0082',
    color: 'black',
    textAlign: 'center',
    width: '100%',
    paddingBottom: 9,
  },
  headerLeft: {
    fontSize: 16,
    marginRight: 232,
    marginTop: 5,
  },
  headerRight: {
    fontSize: 16,
    marginLeft: 193,
    marginBottom: 70,
  },
  titleTransformContainer: {
    transform: [
      { scaleX: 0.9 },
      { scaleY: 2.8 }
    ],
    alignSelf: 'center',
  },
  welcomeTransformContainer: {
    transform: [
      { scaleX: 1.5 },
      { scaleY: 2.1 }
    ],
    alignSelf: 'center',
  },
  titleUnderline: {
    height: 5,
    width: '45%',
    backgroundColor: 'black',
  },
  welcomeText: {
    marginBottom: 4,
    fontSize: 18
  },
  welcomeUnderline: {
    height: 3,
    width: '70%',
    backgroundColor: 'black',
    marginBottom: 10,
  },
  groupsList: {
    width: '100%',
    maxHeight: 300, // Limiting the max height of the list to make it scrollable
  },
  groupContainer: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  leaveButton: {
    color: 'red',
    fontWeight: 'bold',
    alignSelf: 'center',
    marginLeft: 10,
  },
  input: {
    width: '80%',
    padding: 10,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'black',
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  deleteButton: {
    marginTop: 10,
    padding: 10,
    borderWidth: 2,
    borderColor: 'red',
    borderRadius: 5,
    backgroundColor: '#ffcccc',
    alignItems: 'center',
  },
  button: {
    //backgroundColor: '#4B0082',
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    paddingBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonSpacer: {
    height: 10,
  },
  deleteButtonText: {
    color: 'red',
    fontWeight: 'bold',
  },  
});

export default GroupScreen;
