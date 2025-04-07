import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Keyboard, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
// Firebase imports:
import { 
  getFirestore, collection, query, where, onSnapshot, doc, updateDoc, 
  arrayUnion, setDoc, arrayRemove, deleteDoc, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { app } from '../firebaseConfig'; // Adjust the import path as needed

// Initialize Firestore
const db = getFirestore(app);

const GroupScreen = ({ navigation, route }) => {
  const { username } = route.params || {}; // groups will be fetched from Firestore
  const [message, setMessage] = useState('');
  const [userGroups, setUserGroups] = useState([]); // Array of group objects from Firestore
  const [groupName, setGroupName] = useState('');
  const [groupPassword, setGroupPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [creators, setCreators] = useState({}); // Mapping from group ID to creator
  const [isKeyboardVisible, setKeyboardVisible] = useState(false); // Track keyboard visibility

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

  // Listen for keyboard show/hide events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true); // Set keyboard visibility to true
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false); // Set keyboard visibility to false
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Firestore write functions:
  const joinGroupFirestore = async (groupId, user, providedPassword) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) {
        Alert.alert('Error', 'No group under that name.');
        return;
      }
      const groupData = groupSnap.data();
      if (groupData.password !== providedPassword) {
        Alert.alert('Error', 'Incorrect group password.');
        return;
      }
      await updateDoc(groupRef, {
        members: arrayUnion(user.toLowerCase())
      });
    } catch (error) {
      Alert.alert('Error', 'An error occurred while joining the group.');
      setErrorMessage(error.message);
    }
  };

  const createGroupFirestore = async (groupId, user, password) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await setDoc(groupRef, {
        creator: user.toLowerCase(),
        members: [user.toLowerCase()],
        createdAt: serverTimestamp(),
        password: password
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
    if (groupName.trim() && groupPassword.trim()) {
      joinGroupFirestore(groupName, username, groupPassword);
      setGroupName('');
      setGroupPassword('');
    } else {
      Alert.alert('Error', 'Please enter a valid group name and password');
    }
  };

  const createGroup = () => {
    if (groupName.trim() && groupPassword.trim()) {
      createGroupFirestore(groupName, username, groupPassword);
      setGroupName('');
      setGroupPassword('');
    } else {
      Alert.alert('Error', 'Please enter a valid group name and password');
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
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 0, backgroundColor: 'black' }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Scrollable Content */}
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title Section */}
            <View style={styles.titleContainer}>
              <View style={styles.titleTransformContainer}>
                <Text style={styles.title}>THE MOVE</Text>
              </View>
              <View style={styles.titleUnderline} />
              <View style={styles.headerContainer}>
                <Text style={styles.header}>What are we doing later?</Text>
              </View>
              <View style={styles.textBubbleBig}>
                <Text style={{ fontSize: 9 }}>       </Text>
              </View>
              <View style={styles.textBubbleSmall}>
                <Text style={{ fontSize: 6 }}>    </Text>
              </View>
            </View>

            {/* Error Message */}
            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            {/* Group List */}
            <View style={styles.groupsList}>
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
                <Text style={styles.noGroupsText}>No groups found. Create or join a group!</Text>
              )}
            </View>
          </ScrollView>

          {/* Fixed Bottom Section */}
          <View style={[styles.bottomContainer, { bottom: isKeyboardVisible ? 325 : 0 }]}>
            <TextInput
              style={styles.input}
              placeholder="ENTER GROUP NAME"
              placeholderTextColor="#888"
              value={groupName}
              onChangeText={setGroupName}
            />
            <TextInput
              style={styles.input}
              placeholder="ENTER GROUP PASSWORD"
              placeholderTextColor="#888"
              value={groupPassword}
              onChangeText={setGroupPassword}
              secureTextEntry={true}
            />
            <TouchableOpacity style={styles.button} onPress={joinGroup}>
              <Text style={styles.buttonText}>JOIN GROUP</Text>
            </TouchableOpacity>
            <View style={styles.buttonSpacer} />
            <TouchableOpacity style={styles.button} onPress={createGroup}>
              <Text style={styles.buttonText}>CREATE GROUP</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 150, // add padding to ensure the bottom section doesn't overlap
  },
  titleContainer: {
    backgroundColor: 'black',
    flexDirection: 'column',
    width: '100%',
    paddingTop: 5,
  },
  // titleTransformContainer: {
  //   transform: [
  //     { scaleX: 0.9 },
  //     { scaleY: 2.8 }
  //   ],
  //   alignSelf: 'center',
  // },
  // title: {
  //   fontSize: 55,
  //   marginTop: 20,
  //   fontWeight: 'bold',
  //   color: 'white',
  //   textAlign: 'center',
  //   width: '100%',
  // },
  // titleUnderline: {
  //   height: 5,
  //   width: '50%',
  //   backgroundColor: 'white',
  //   marginTop: 50,
  //   alignSelf: 'center'
  // },
  header: {
    fontSize: 18,
    color: 'white',
  },
  headerContainer: {
    backgroundColor: "#007AFF",
    marginLeft: 14,
    marginBottom: 2,
    marginTop: 15,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  textBubbleBig: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    marginLeft: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  textBubbleSmall: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    marginLeft: 5,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  groupsList: {
    width: '100%',
    padding: 15,
  },
  groupCard: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
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
  noGroupsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
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
    height: 15,
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

export default GroupScreen;