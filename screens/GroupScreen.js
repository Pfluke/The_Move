// GroupScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Modal
} from 'react-native';
// Firebase imports:
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { app } from '../firebaseConfig';
import ArrowsIcon from '../assets/arrowsiconupdated.png';

const db = getFirestore(app);

function randomSixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const GroupScreen = ({ navigation, route }) => {
  const { username } = route.params || {};

  // state for your original logic
  const [userGroups, setUserGroups] = useState([]);
  const [groupName, setGroupName] = useState('');       // used by Create/Edit
  const [joinCode, setJoinCode] = useState('');         // used by Join
  const [errorMessage, setErrorMessage] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // new state for context‐menu & rename
  const [creators, setCreators] = useState({});         // map groupId → creator
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const scrollViewRef = useRef(null);

  // fetch only groups you belong to, plus creator map
  useEffect(() => {
    if (!username) return;
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', username.toLowerCase())
    );
    const unsub = onSnapshot(
      q,
      snap => {
        const arr = [];
        const creatorsObj = {};
        snap.forEach(d => {
          arr.push({ id: d.id, ...d.data() });
          creatorsObj[d.id] = d.data().creator;
        });
        arr.sort(
          (a, b) => (b.lastAccessed?.seconds || 0) - (a.lastAccessed?.seconds || 0)
        );
        setUserGroups(arr);
        setCreators(creatorsObj);
      },
      e => setErrorMessage(e.message)
    );
    return unsub;
  }, [username]);

  // original Create
  const createGroupFirestore = async (newGroupName, user) => {
    const code = randomSixDigit();
    const groupRef = doc(db, 'groups', newGroupName);
    await setDoc(groupRef, {
      creator: user.toLowerCase(),
      members: [user.toLowerCase()],
      createdAt: serverTimestamp(),
      code,
      lastAccessed: serverTimestamp()
    });
  };

  // original Join
  const joinGroupByCode = async (code) => {
    const snaps = await getDocs(
      query(collection(db, 'groups'), where('code', '==', code))
    );
    if (snaps.empty) {
      Alert.alert('Error', 'Invalid group code.');
      return;
    }
    const groupSnap = snaps.docs[0];
    await updateDoc(groupSnap.ref, {
      members: arrayUnion(username.toLowerCase()),
      lastAccessed: serverTimestamp()
    });
    navigation.navigate('EventScreen', {
      username,
      groupName: groupSnap.id
    });
  };

  // leave group (context menu)
  const leaveGroupFirestore = async (groupId) => {
    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayRemove(username.toLowerCase())
    });
  };

  // rename group (context menu)
  const editGroupName = async (newName) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      return Alert.alert('Error', 'Group name cannot be empty.');
    }
    if (trimmed === editingGroupId) {
      return Alert.alert('Error', 'The new name is the same as the current name.');
    }
    try {
      const oldRef = doc(db, 'groups', editingGroupId);
      const oldSnap = await getDoc(oldRef);
      if (!oldSnap.exists()) {
        return Alert.alert('Error', 'Original group not found.');
      }
      const data = oldSnap.data();
      const newRef = doc(db, 'groups', trimmed);
      await setDoc(newRef, { ...data });
      await deleteDoc(oldRef);
      setShowEditModal(false);
      setEditingGroupId(null);
      setGroupName('');
    } catch (e) {
      Alert.alert('Error', 'Failed to rename group.');
      setErrorMessage(e.message);
    }
  };

  // handlers
  const onCreateModalSubmit = () => {
    if (!groupName.trim()) {
      return Alert.alert('Error', 'Please enter a group name.');
    }
    createGroupFirestore(groupName.trim(), username)
      .then(() => setShowCreateModal(false))
      .catch(e => setErrorMessage(e.message));
    setGroupName('');
  };

  const onJoinModalSubmit = () => {
    if (!joinCode.trim() || joinCode.trim().length !== 6) {
      return Alert.alert('Error', 'Please enter the 6‑digit code.');
    }
    joinGroupByCode(joinCode.trim())
      .then(() => setShowJoinModal(false))
      .catch(e => setErrorMessage(e.message));
    setJoinCode('');
  };

  // Context‑menu UI
  const GroupContextMenu = ({ groupId, isCreator }) => {
    const [visible, setVisible] = useState(false);

    return (
      <View style={styles.contextMenuContainer}>
        <TouchableOpacity
          style={styles.contextMenuButton}
          onPress={() => setVisible(v => !v)}
        >
          <Text style={styles.contextMenuIcon}>⋮</Text>
        </TouchableOpacity>

        {visible && (
          <>
            <TouchableOpacity
              style={styles.fullScreenOverlay}
              activeOpacity={1}
              onPress={() => setVisible(false)}
            />
            <View style={styles.contextMenuDropdown}>
              <TouchableOpacity
                style={styles.contextMenuItem}
                onPress={() => {
                  leaveGroupFirestore(groupId);
                  setVisible(false);
                }}
              >
                <Text style={styles.contextMenuItemText}>Leave Group</Text>
              </TouchableOpacity>

              {isCreator && (
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  onPress={() => {
                    setGroupName(groupId);
                    setEditingGroupId(groupId);
                    setShowEditModal(true);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.contextMenuItemText}>Rename Group</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Top Section */}
        <View style={styles.topSection}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={ArrowsIcon}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.verticalButtonContainer}>
            <TouchableOpacity
              style={styles.verticalButton}
              onPress={() => setShowJoinModal(true)}
            >
              <Text style={styles.buttonText}>JOIN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.verticalButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.buttonText}>CREATE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Group List */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.groupsList}>
            {userGroups.length > 0 ? (
              userGroups.map(g => (
                <View key={g.id} style={styles.groupCard}>
                  <View style={styles.groupCardHeader}>
                    <Text
                      style={styles.groupNameText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {g.id}
                    </Text>
                    <GroupContextMenu
                      groupId={g.id}
                      isCreator={creators[g.id] === username.toLowerCase()}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      navigation.navigate('EventScreen', {
                        username,
                        groupName: g.id
                      });
                      setTimeout(() => {
                        updateDoc(doc(db, 'groups', g.id), {
                          lastAccessed: serverTimestamp()
                        });
                      }, 1000);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Go to Group</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noGroupsText}>No groups yet.</Text>
            )}
          </View>
        </ScrollView>

        {/* Join Modal */}
        <Modal visible={showJoinModal} transparent animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Enter 6‑digit Code</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="123456"
                placeholderTextColor="#888"
                value={joinCode}
                onChangeText={setJoinCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={onJoinModalSubmit}
              >
                <Text style={styles.buttonText}>JOIN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Create Modal */}
        <Modal visible={showCreateModal} transparent animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Create Group</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Group Name"
                placeholderTextColor="#888"
                value={groupName}
                onChangeText={text => setGroupName(text.slice(0, 20))}
                maxLength={20}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={onCreateModalSubmit}
              >
                <Text style={styles.buttonText}>CREATE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit (Rename) Modal */}
        {showEditModal && (
          <Modal
            transparent
            animationType="slide"
            visible={showEditModal}
            onRequestClose={() => setShowEditModal(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Rename Group</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="New Group Name"
                  placeholderTextColor="#888"
                  value={groupName}
                  onChangeText={setGroupName}
                  autoCapitalize="none"
                  maxLength={20}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'flex-start'
  },
  logoImage: { width: 75, height: 75, marginRight: 15 },
  verticalButtonContainer: { justifyContent: 'space-between', height: 100 },
  verticalButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 101,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center'
  },
  buttonText: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF' },

  scrollContainer: { flexGrow: 1, paddingBottom: 90 },
  groupsList: { width: '100%', padding: 15 },

  groupCard: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    overflow: 'visible'
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  groupNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flexShrink: 1
  },
  actionButton: {
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center'
  },
  noGroupsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  },

  // Context Menu Styles
  contextMenuContainer: { position: 'relative', zIndex: 99999 },
  contextMenuButton: { padding: 10 },
  contextMenuIcon: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  contextMenuDropdown: {
    position: 'absolute',
    right: 15,
    top: 35,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 150,
    zIndex: 99999
  },
  contextMenuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  contextMenuItemText: { fontSize: 16, color: '#333' },

  // Modal styles (shared)
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 200
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  modalInput: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontSize: 16
  },
  modalButton: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center'
  },
  modalCancelButton: {
    marginTop: 10,
    backgroundColor: '#aaa'
  }
});

export default GroupScreen;