import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ScrollView, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, Modal } from 'react-native';
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
  const [activeMenu, setActiveMenu] = useState(null); // state to track which group's menu is open
  const [editingGroupId, setEditingGroupId] = useState(null); // ID of group currently being edited
  const [showEditModal, setShowEditModal] = useState(false); // edit modal visibility 
  const [isKeyboardVisible, setKeyboardVisible] = useState(false); // Track keyboard visibility

  // Modal visibility states:
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        setKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
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
      if (!groupSnap.exists()) { // group does not exist
        Alert.alert('Error', 'Group does not exist.');
        return;
      }
      const groupData = groupSnap.data();
      if (groupData.password !== providedPassword) { // incorrect password
        Alert.alert('Error', 'Incorrect group password. Please try again.');
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

  const GroupContextMenu = ({ groupId, isCreator, onLeave, onEdit, onDelete }) => {
    const [isMenuVisible, setIsMenuVisible] = useState(false);
  
    return (
      <View style={styles.contextMenuContainer}>
        <TouchableOpacity 
          style={styles.contextMenuButton} 
          onPress={() => setIsMenuVisible(!isMenuVisible)}
        >
          <Text style={styles.contextMenuIcon}>⋮</Text>
        </TouchableOpacity>
        
        {isMenuVisible && (
          <>
            {/* Full-screen overlay that will close the menu when clicked */}
            <TouchableOpacity
              style={styles.fullScreenOverlay}
              activeOpacity={1}
              onPress={() => setIsMenuVisible(false)}
            />
            
            <View style={styles.contextMenuDropdown}>
              <TouchableOpacity 
                style={styles.contextMenuItem} 
                onPress={() => {
                  onLeave();
                  setIsMenuVisible(false);
                }}
              >
                <Text style={styles.contextMenuItemText}>Leave Group</Text>
              </TouchableOpacity>
              
              {isCreator && (
                <>
                  <TouchableOpacity 
                    style={styles.contextMenuItem} 
                    onPress={() => {
                      onEdit();
                      setIsMenuVisible(false);
                    }}
                  >
                    <Text style={styles.contextMenuItemText}>Edit Name</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.contextMenuItem, styles.contextMenuDeleteItem]} 
                    onPress={() => {
                      onDelete();
                      setIsMenuVisible(false);
                    }}
                  >
                    <Text style={styles.contextMenuDeleteText}>Delete Group</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  const editGroupName = async (newName) => {
    const trimmedName = newName.trim();
  
    // check if field is empty
    if (!trimmedName) {
      Alert.alert('Error', 'Group name cannot be empty.');
      return;
    }
  
    // check if group name is the same
    if (trimmedName === editingGroupId) {
      Alert.alert('Error', 'The new name is the same as the current name.');
      return;
    }
  
    try {
      // old document reference
      const groupRef = doc(db, "groups", editingGroupId);

      // new doc reference
      const newGroupRef = doc(db, "groups", trimmedName);
  
      const groupSnap = await getDoc(groupRef);
      const groupData = groupSnap.data();
  
      // create new doc with updated name and same data for rest
      await setDoc(newGroupRef, {
        ...groupData,
        id: trimmedName
      });
  
      // delete old group doc
      await deleteDoc(groupRef);
  
      // reset modal and state
      setShowEditModal(false);
      setEditingGroupId(null);
      setGroupName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to edit group name');
      console.error("Error editing group: ", error);
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

  // Modal submit handlers:
  // joining group
  const onJoinModalSubmit = () => {
    if (groupName.trim() && groupPassword.trim()) {
      joinGroupFirestore(groupName, username, groupPassword);
      setGroupName('');
      setGroupPassword('');
      setShowJoinModal(false);
    } else { // one or both fields are not filled out
      Alert.alert('Error', 'Please enter a group name and password');
    }
  };

  // creating group
  const onCreateModalSubmit = () => { 
    if (groupName.trim() && groupPassword.trim()) {
      createGroupFirestore(groupName, username, groupPassword);
      setGroupName('');
      setGroupPassword('');
      setShowCreateModal(false);
    } else { // one or both fields are not filled out
      Alert.alert('Error', 'Please enter a group name and password');
    }
  };

  // Open modal functions:
  const openJoinModal = () => {
    setGroupName('');
    setGroupPassword('');
    setShowJoinModal(true);
  };

  const openCreateModal = () => {
    setGroupName('');
    setGroupPassword('');
    setShowCreateModal(true);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" />
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
            {/* Error Message */}
            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            {/* Group List */}
            <View style={styles.groupsList}>
              {userGroups.length > 0 ? (
                userGroups.map((group) => (
                  <View key={group.id} style={styles.groupCard}>
                    <View style={styles.groupCardHeader}>
                      <Text style={styles.groupNameText} numberOfLines={1} ellipsizeMode="tail">
                        3{group.id}
                      </Text>
                      <GroupContextMenu
                        groupId={group.id}
                        isCreator={creators[group.id] === username.toLowerCase()}
                        onLeave={() => leaveGroup(group.id)}
                        onEdit={() => {
                          setGroupName(group.id);
                          setShowEditModal(true);
                          setEditingGroupId(group.id);
                        }}
                        onDelete={() => handleDeleteGroup(group.id)}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => navigation.navigate('EventScreen', { username, groupName: group.id })}
                    >
                      <Text style={styles.actionButtonText}>
                        Go to Group
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.noGroupsText}>No groups found. Create or join a group!</Text>
              )}
            </View>
          </ScrollView>

          {/* Fixed Bottom Section with only buttons */}
          <View style={[styles.bottomContainer, { bottom: isKeyboardVisible ? 325 : 0 }]}>
            <View style={styles.horizontalButtonContainer}>
              <TouchableOpacity style={styles.halfWidthButton} onPress={openJoinModal}>
                <Text style={styles.buttonText}>JOIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.halfWidthButton} onPress={openCreateModal}>
                <Text style={styles.buttonText}>CREATE</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showEditModal && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showEditModal}
              onRequestClose={() => setShowEditModal(false)}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Edit Group Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="New Group Name"
                    placeholderTextColor="#888"
                    value={groupName}
                    onChangeText={setGroupName}
                    autoCapitalize="none"
                    maxLength={20} // Prevent overly long names
                  />
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={() => editGroupName(groupName)}
                  >
                    <Text style={styles.buttonText}>SAVE CHANGES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalCancelButton]} 
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* Join Group Modal */}
          {showJoinModal && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showJoinModal}
              onRequestClose={() => setShowJoinModal(false)}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Join Group</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter Group Name"
                    placeholderTextColor="#888"
                    value={groupName}
                    onChangeText={(text) => setGroupName(text.slice(0, 20))} // Limit to 20 characters
                    maxLength={20} // Double protection
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter Group Password"
                    placeholderTextColor="#888"
                    value={groupPassword}
                    onChangeText={setGroupPassword}
                    secureTextEntry={true}
                  />
                  <TouchableOpacity style={styles.modalButton} onPress={onJoinModalSubmit}>
                    <Text style={styles.buttonText}>JOIN GROUP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, { marginTop: 10, backgroundColor: '#aaa' }]} 
                    onPress={() => setShowJoinModal(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* Create Group Modal */}
          {showCreateModal && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showCreateModal}
              onRequestClose={() => setShowCreateModal(false)}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Create Group</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter Group Name"
                    placeholderTextColor="#888"
                    value={groupName}
                    onChangeText={(text) => setGroupName(text.slice(0, 20))} // Limit to 20 characters
                    maxLength={20} // Double protection
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter Group Password"
                    placeholderTextColor="#888"
                    value={groupPassword}
                    onChangeText={setGroupPassword}
                    secureTextEntry={true}
                  />
                  <TouchableOpacity style={styles.modalButton} onPress={onCreateModalSubmit}>
                    <Text style={styles.buttonText}>CREATE GROUP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, { marginTop: 10, backgroundColor: '#aaa' }]} 
                    onPress={() => setShowCreateModal(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { // background color 
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: { // styling for scroll function, how much space there is at the bottom of the container after scrolling
    flexGrow: 1,
    paddingBottom: 90,
  },
  groupsList: { // list styling
    width: '100%',
    padding: 15,
  },
  groupCard: { // card containing group
    marginBottom: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    overflow: 'visible', 
  },
  groupNameText: { // Group name text
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flexShrink: 1, // Allow text to shrink if needed
  },
  creatorText: { // text of group creator 
    fontSize: 16,
    color: '#000000',
    marginTop: 5,
  },
  buttonContainer: { // buttons in main group cards
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    flexWrap: 'wrap', // Allow buttons to wrap if needed  
  },
  actionButton: { // "go to" button styling
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 20, // Reduced from 20
    borderRadius: 5,
    minWidth: '45%', // Minimum width
    marginBottom: 5, // Space if buttons wrap
  },
  actionButtonText: { // "go to" button text
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // leaveButton: { // leave button styling
  //   backgroundColor: '#FF0000',
  //   paddingVertical: 10,
  //   paddingHorizontal: 20,
  //   borderRadius: 5,
  //   marginBottom: 5,
  // },
  // leaveButtonText: { // leave button text
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   color: '#FFFFFF',
  // },
  // deleteButton: { // button for deleting group 
  //   backgroundColor: '#FFCCCC',
  //   paddingVertical: 10,
  //   paddingHorizontal: 20,
  //   borderRadius: 5,
  //   marginTop: 10,
  //   alignItems: 'center',
  // },
  deleteButtonText: { // text for deleting group
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  noGroupsText: { // text for when no groups exist
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: { // text for error
    color: '#FF0000', // red 
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  // Context Menu Styles
  contextMenuContainer: { // container for "..."
    position: 'relative',
    zIndex: 99999, 
  },
  contextMenuButton: { // "..." button padding
    padding: 10, 
  },
  contextMenuIcon: { // "..." button styling
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  contextMenuDropdown: { // dropdown styling for options after pressing "..."
    position: 'absolute',
    right: 15,
    top: 35,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 150,
    zIndex: 99999, 
  },
  contextMenuItem: { // container styling for dropdown menu
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contextMenuItemText: { // text styling for items in dropdown menu
    fontSize: 16,
    color: '#333',
    alignItems: 'center',
  },
  contextMenuDeleteText: { // text styling for the delete text in dropdown menu to be red
    fontSize: 16,
    color: 'red', // red
  },
  menuOverlay: {
    position: 'absolute',
  },

  // Group Card Header
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Space between header and content
  }, 

  // Modal Styles
  modalCancelButton: {
    marginTop: 10, 
    backgroundColor: '#aaa' // Gray cancel button
  },
  bottomContainer: { // fixes styling for the join and create buttons 
    width: '100%',
    padding: 20,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  horizontalButtonContainer: { // contains the join and create buttons
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfWidthButton: { // button styling for the half widths at the bottom
    backgroundColor: '#000000',
    paddingVertical: 15,
    borderRadius: 10,
    width: '47%', 
    alignItems: 'center',
  },
  buttonText: { // font for join/create buttons, also used in the modal
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalButton: { // modal buttons for joining and canceling
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalInput: { // input field for join/create modal
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
  modalBackground: { // background of the screen behind the modal 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: { // container of popup for join/create group modal
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 200, // make modal higher for keyboard
  },
  modalTitle: { // title for join/create group modal
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default GroupScreen;

