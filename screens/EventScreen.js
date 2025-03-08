import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { getFirestore, doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig'; 

const db = getFirestore(app);

const Screen3 = ({ navigation, route }) => {
  const { username, groupName = 'default_group' } = route.params || {};
  const [slices, setSlices] = useState({});
  const [loadingSlices, setLoadingSlices] = useState(true);

  const groupDocRef = doc(db, "groups", groupName);

  useEffect(() => {
    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      try {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Fetched slices:", data.slices);  // Log to check data
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
      } catch (error) {
        console.error("Error in snapshot listener:", error);
        Alert.alert("Error", error.message);
      }
    });
  
    return () => unsubscribe();
  }, [groupName]);

  const removeSlice = async (sliceName) => {
    try {
      const groupSnap = await getDoc(groupDocRef);
      if (!groupSnap.exists()) {
        console.error("Group not found");
        return;
      }

      const data = groupSnap.data();
      const currentSlices = data?.slices || {};

      const updatedSlices = { ...currentSlices };
      delete updatedSlices[sliceName];

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
        await setDoc(groupDocRef, { slices: {} });
      }
  
      const data = groupSnap.data();
      const sliceData = data?.slices?.[sliceName] || {
        votes: 0,
        voters: {},
        days: [],
        description: '',
        startTime: '',
        endTime: '',
        imageUri: '',  // Make sure imageUri is part of the initial structure
      };
  
      const currentVotes = sliceData.votes || 0;
      const currentVoters = sliceData.voters || {};
      const currentDays = sliceData.days || [];
      const currentDescription = sliceData.description || '';
      const currentStartTime = sliceData.startTime || '';
      const currentEndTime = sliceData.endTime || '';
      const currentImageUri = sliceData.imageUri || ''; // Ensure imageUri is preserved
  
      const userCurrentVote = currentVoters[username] || 0;
      let newVotes = currentVotes;
      let updatedVoters = { ...currentVoters };
  
      if (userCurrentVote === voteType) {
        newVotes -= voteType;
        delete updatedVoters[username];
      } else {
        newVotes += voteType - userCurrentVote;
        updatedVoters[username] = voteType;
      }
  
      await updateDoc(groupDocRef, {
        [`slices.${sliceName}`]: {
          votes: newVotes,
          voters: updatedVoters,
          days: currentDays,
          description: currentDescription,
          startTime: currentStartTime,
          endTime: currentEndTime,
          imageUri: currentImageUri, // Ensure imageUri is preserved during the update
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

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wheel of Fortune</Text>
      <Text style={styles.groupText}>Group: {groupName}</Text>

      {/* Day Buttons Across the Top */}
      <View style={styles.dayButtonsContainer}>
        {daysOfWeek.map((day, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate('DayCalendar', { 
              selectedDay: day, 
              username, 
              groupName 
            })}
            style={styles.dayButton}
          >
            <Text style={styles.dayButtonText}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button title="Add Slice" onPress={() => navigation.navigate('AddSliceScreen', { groupName })} />

      <Text style={styles.subtitle}>All Slices</Text>

      {loadingSlices ? (
        <Text>Loading slices...</Text>
      ) : Object.keys(slices).length === 0 ? (
        <Text>No slices available yet...</Text>
      ) : (
        <ScrollView style={styles.slicesList}>
          {Object.entries(slices)
            .sort(([, a], [, b]) => (b.votes || 0) - (a.votes || 0)) // Sort slices by votes in descending order
            .map(([slice, data]) => {
              const userVote = getUserVote(slice);
              return (
                <View key={slice} style={styles.sliceContainer}>
                  {/* Check if image URL is available before rendering */}
                  {data.imageUri ? (
                    <ImageBackground
                      source={{ uri: data.imageUri }}  // Handle base64 image
                      style={styles.imageBackground}
                      imageStyle={styles.imageStyle}
                    >
                      <Text style={styles.sliceText}>{slice}</Text>
                    </ImageBackground>
                  ) : (
                    <Text>No Image Available</Text>
                  )}

                  <Text style={styles.sliceDescription}>{data.description}</Text>
                  <Text style={styles.sliceDay}>
                    {data.days ? data.days.join(', ') : 'No day assigned'}
                  </Text>
                  <Text style={styles.sliceTime}>
                    {data.startTime} - {data.endTime}
                  </Text>
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

      <Button
        title="Go to Wheel Screen"
        onPress={() => navigation.navigate('WheelOfFortune', { 
          slices: Object.entries(slices).map(([sliceName, sliceData]) => ({ sliceName, sliceData })), 
          username, 
          groupName 
        })}
      />


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
    height: 120,  // Adjust height as needed
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    resizeMode: 'cover',  // Stretches the image to cover the container
    height: 100,  // Adjust the height of the background image
  },
  imageStyle: {
    borderRadius: 5,
  },
  sliceText: {
    fontSize: 20,
    color: 'white',  // Ensure text is visible over image
    textShadowColor: 'black',  // Black border color
    textShadowOffset: { width: 2, height: 2 },  // Shadow offset to create a border effect
    textShadowRadius: 2,  // Controls the blur of the shadow
  },
  sliceDescription: {
    fontSize: 12,
    color: 'black',
    marginLeft: 10,
  },
  sliceDay: {
    fontSize: 12,
    color: 'black',
    marginLeft: 10,
  },
  sliceTime: {
    fontSize: 14,
    color: 'black',
    marginLeft: 10,
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
    color: 'black',
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
  dayButtonsContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  dayButton: {
    margin: 5,
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  dayButtonText: {
    color: 'white',
    fontSize: 16,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginTop: 10,
  },
});

export default Screen3;
