import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { getFirestore, doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

const EventScreen = ({ navigation, route }) => {
  const { username, groupName = 'default_group' } = route.params || {};
  const [slices, setSlices] = useState({});
  const [loadingSlices, setLoadingSlices] = useState(true);

  const groupDocRef = doc(db, "groups", groupName);

  // Hide the header
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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

  // Abbreviated days of the week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
            <Text style={{ fontSize: 8 }}>       </Text>
          </View>
          <View style={styles.textBubbleSmall}>
            <Text style={{ fontSize: 6 }}>    </Text>
          </View>
        </View>

        {/* Group Name */}
        <View style={styles.groupTextContainer}>
          <Text style={styles.groupText}>{groupName}</Text>
        </View>

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

        <Button title="Add Event" onPress={() => navigation.navigate('AddSliceScreen', { groupName })} />

        <Text style={styles.subtitle}>All Events</Text>

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

        {/* <Button
          title="Go to Wheel Screen"
          onPress={() => navigation.navigate('WheelOfFortune', { 
            slices: Object.entries(slices).map(([sliceName, sliceData]) => ({ sliceName, sliceData })), 
            username, 
            groupName 
          })}
        /> */}

        <Button title="Go to Group Screen" onPress={() => navigation.navigate('GroupScreen', { username })} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 50,
  },
  titleTransformContainer: {
    transform: [
      { scaleX: 0.9 },
      { scaleY: 2.8 }
    ],
    alignSelf: 'center',
  },
  title: {
    fontSize: 55,
    marginTop: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    width: '100%',
  },
  titleUnderline: {
    height: 5,
    width: '50%',
    backgroundColor: 'white',
    marginTop: 50,
    alignSelf: 'center'
  },
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
    marginTop: 0,
    marginLeft: 5,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  groupText: {
    fontSize: 45,
    fontWeight: 'bold', 
    color: '#000000',
    textAlign: 'center',
  },
  groupTextContainer: {
    backgroundColor: '#F5F5F5',
    borderWidth: 0.5, 
    borderColor: 'black', 
    borderRadius: 10,
    padding: 5, 
    marginVertical: 10, 
    alignSelf: 'center', 
    width: '90%', 
  },
  dayButtonsContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    justifyContent: 'space-around',
  },
  dayButton: {
    padding: 10,
    backgroundColor: 'black',
    borderRadius: 5,
  },
  dayButtonText: {
    color: 'white',
    fontSize: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
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
});

export default EventScreen;