import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// Firebase imports:
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, setDoc, arrayRemove, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig, app } from '../firebaseConfig';

// Initialize Firebase app and Firestore
//const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const GroupScreen = ({ navigation, route }) => {
  const { username } = route.params || {}; // groups will be fetched from Firestore
  const [message, setMessage] = useState('');
  const [userGroups, setUserGroups] = useState([]); // Array of group objects from Firestore
  const [groupName, setGroupName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [creators, setCreators] = useState({}); // Mapping from group ID to creator

  // Fetch groups from Firestore, members are users
  useEffect(() => {
    if (!username) return;
    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", username.toLowerCase())
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const groupsArray = [];
      const creatorsObj = {};
      querySnapshot.forEach((docSnap) => {
        const groupData = docSnap.data();
        groupsArray.push({ id: docSnap.id, ...groupData });
        creatorsObj[docSnap.id] = groupData.creator;
      });
      setUserGroups(groupsArray);
      setCreators(creatorsObj);
    }, (error) => {
      console.error("Error fetching groups: ", error);
      setErrorMessage(error.message);
    });
    return () => unsubscribe();
  }, [username]);

  // Firestore write functions:
  const joinGroupFirestore = async (groupId, user) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(user.toLowerCase())
      });
    } catch (error) {
      console.error("Error joining group: ", error);
      setErrorMessage(error.message);
    }
  };

  const createGroupFirestore = async (groupId, user) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await setDoc(groupRef, {
        creator: user.toLowerCase(),
        members: [user.toLowerCase()],
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating group: ", error);
      setErrorMessage(error.message);
    }
  };

  const leaveGroupFirestore = async (groupId, user) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(user.toLowerCase())
      });
    } catch (error) {
      console.error("Error leaving group: ", error);
      setErrorMessage(error.message);
    }
  };

  const deleteGroupFirestore = async (groupId) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await deleteDoc(groupRef);
    } catch (error) {
      console.error("Error deleting group: ", error);
      setErrorMessage(error.message);
    }
  };

  const joinGroup = () => {
    if (groupName.trim()) {
      joinGroupFirestore(groupName, username);
      setGroupName('');
    } else {
      Alert.alert('Error', 'Please enter a valid group name');
    }
  };

  const createGroup = () => {
    if (groupName.trim()) {
      createGroupFirestore(groupName, username);
      setGroupName('');
    } else {
      Alert.alert('Error', 'Please enter a valid group name');
    }
  };

  const leaveGroup = (groupId) => {
    leaveGroupFirestore(groupId, username);
  };

  const handleDeleteGroup = (groupId) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete ${groupId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteGroupFirestore(groupId);
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
      
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      
      {/* Group List */}
      <ScrollView style={styles.groupsList}>
        {userGroups.length > 0 ? (
          userGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <Text style={styles.groupName}>Group: {group.id}</Text>
              <Text style={styles.creatorText}>Creator: {creators[group.id] || 'No creator found'}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('EventScreen', { username, groupName: group.id })}
                >
                  <Text style={styles.actionButtonText}>Go to {group.id}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.leaveButton}
                  onPress={() => leaveGroup(group.id)}
                >
                  <Text style={styles.leaveButtonText}>Leave Group</Text>
                </TouchableOpacity>
              </View>
              {creators[group.id] === username.toLowerCase() && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteGroup(group.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete Group</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <TouchableOpacity
            style={styles.addGroupCard}
            onPress={() => setGroupName('')}
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
