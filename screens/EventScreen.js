import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getFirestore, doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig'; 

const db = getFirestore(app);

const Screen3 = ({ navigation, route }) => {
  const { username, groupName = 'default_group' } = route.params || {};
  const [slices, setSlices] = useState({});
  const [loadingSlices, setLoadingSlices] = useState(true);

  // reference to the Firestore document for the current group
  const groupDocRef = doc(db, "groups", groupName);

  useEffect(() => {
    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSlices(data.slices || []);
        setLoadingSlices(false);
      } else {
        setDoc(groupDocRef, { slices: [] })
          .then(() => {
            setSlices([]);
            setLoadingSlices(false);
          })
          .catch((error) => {
            console.error("Error creating group document:", error);
            Alert.alert("Error", error.message);
          });
      }
    }, (error) => {
      console.error("Error fetching slices: ", error);
      Alert.alert("Error", error.message);
    });

    return () => unsubscribe();
  }, [groupName]);
  
  useEffect(() => {
    console.log(slices);  // Log slices to check if they're updated
  }, [slices]);
  
  // Sort slices based on votes
  const sortedSlices = Object.entries(slices)
    .sort((a, b) => b[1].votes - a[1].votes); // Sorting slices by votes in descending order
  
    const removeSlice = async (sliceName) => {
      try {
        // Get current slices from Firestore
        const groupSnap = await getDoc(groupDocRef);
        if (!groupSnap.exists()) {
          console.error("Group not found");
          return;
        }
    
        const data = groupSnap.data();
        const currentSlices = data?.slices || {};
    
        // Create a new slices object without the removed slice
        const updatedSlices = { ...currentSlices };
        delete updatedSlices[sliceName];  // Delete the slice by its name
    
        // Update Firestore with the new slices object
        await updateDoc(groupDocRef, {
          slices: updatedSlices
        });
      } catch (error) {
        console.error("Error removing slice:", error);
        Alert.alert("Error", error.message);
      }
    };
    
    

  const voteSlice = async (sliceName, voteType) => {
    try {
      const groupSnap = await getDoc(groupDocRef);
      if (!groupSnap.exists()) {
        await setDoc(groupDocRef, { slices: {} }); // Create the document if missing
      }
  
      const data = groupSnap.data();
      const sliceData = data?.slices?.[sliceName] || { votes: 0, voters: {} };
  
      const currentVotes = sliceData.votes || 0;
      const currentVoters = sliceData.voters || {};
  
      const userCurrentVote = currentVoters[username] || 0;
      let newVotes = currentVotes;
      let updatedVoters = { ...currentVoters };
  
      if (userCurrentVote === voteType) {
        // Remove vote
        newVotes -= voteType;
        delete updatedVoters[username];
      } else {
        // Change vote
        newVotes += voteType - userCurrentVote;
        updatedVoters[username] = voteType;
      }
  
      await updateDoc(groupDocRef, {
        [`slices.${sliceName}`]: {
          votes: newVotes,
          voters: updatedVoters,
        },
      });
  
    } catch (error) {
      console.error("Error updating vote:", error);
      Alert.alert("Error", error.message);
    }
  };

  const getUserVote = (sliceName) => {
    const sliceData = slices[sliceName] || {};
    return sliceData.voters ? sliceData.voters[username] : 0;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wheel of Fortune</Text>
      <Text style={styles.groupText}>Group: {groupName}</Text>
      
      <Button title="Add Slice" onPress={() => navigation.navigate('AddSliceScreen', { groupName })} />

      <Text style={styles.subtitle}>All Slices</Text>

      {loadingSlices ? (
        <Text>Loading slices...</Text>
      ) : Object.keys(slices).length === 0 ? (
        <Text>No slices available yet...</Text>
      ) : (
        <ScrollView style={styles.slicesList}>
          {sortedSlices.map(([slice, data]) => {
            const userVote = getUserVote(slice);
            return (
              <View key={slice} style={styles.sliceContainer}>
                <Text style={styles.sliceText}>{slice}</Text>
                <View style={styles.voteRemoveContainer}>
                  <View style={styles.voteContainer}>
                    <TouchableOpacity 
                      onPress={() => voteSlice(slice, 1)} 
                      style={userVote === 1 ? styles.votedUp : styles.voteButton}
                    >
                      <Text style={styles.upvote}>⬆️</Text>
                    </TouchableOpacity>
                    <Text style={styles.voteCount}>{data.votes || 0}</Text>
                    <TouchableOpacity 
                      onPress={() => voteSlice(slice, -1)} 
                      style={userVote === -1 ? styles.votedDown : styles.voteButton}
                    >
                      <Text style={styles.downvote}>⬇️</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => removeSlice(slice)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Button title="Go to Group Screen" onPress={() => navigation.navigate('GroupScreen', { username })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  slicesList: {
    maxHeight: 300,
    width: '100%',
    padding: 10,
  },
  sliceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  sliceText: {
    fontSize: 16,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvote: {
    fontSize: 24,
    color: 'green',
    marginHorizontal: 5,
  },
  downvote: {
    fontSize: 24,
    color: 'red',
    marginHorizontal: 5,
  },
  voteCount: {
    fontSize: 18,
  },
  removeButton: {
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  voteButton: {
    padding: 3,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  votedUp: {
    padding: 3,
    backgroundColor: '#a0e0a0',
    borderRadius: 5,
  },
  votedDown: {
    padding: 3,
    backgroundColor: '#e0a0a0',
    borderRadius: 5,
  },
});

export default Screen3;
