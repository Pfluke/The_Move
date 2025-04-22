import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const WheelOfFortuneScreen = ({ route }) => {
  const { slices, username, groupName } = route.params;
  const [spinValue] = useState(new Animated.Value(0));
  const [winner, setWinner] = useState(null);

  const numberOfSlices = Object.keys(slices).length;
  const anglePerSlice = 360 / numberOfSlices;
  console.log('Received slices: ', slices);

  slices.forEach(({ sliceName, sliceData }) => {
    console.log('Slice Name:', sliceName);
    console.log('Slice Data:', sliceData);
  });

  const spinWheel = () => {
    const randomSliceIndex = Math.floor(Math.random() * slices.length); // Use slices.length for array length
    const winningAngle = randomSliceIndex * anglePerSlice;
  
    // Animate the wheel spin
    Animated.timing(spinValue, {
      toValue: winningAngle + 360 * 3, // Spin 3 full turns then stop on the winning slice
      duration: 4000,  // 4 seconds spin duration
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  
    // After spin completes, determine the winner
    setTimeout(() => {
      setWinner(slices[randomSliceIndex].sliceName); // Access sliceName directly from the slices array
    }, 4000); // Wait until the animation finishes
  };
  

  // Interpolate spinValue to get the rotation style for the wheel
  const spin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What Wheel We Do?</Text>

      {/* Display the wheel */}
      <View style={styles.wheelContainer}>
        <Animated.View
          style={[
            styles.wheel,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          {Object.keys(slices).map((slice, index) => {
            const sliceAngle = index * anglePerSlice;
            return (
              <View
                key={index}
                style={[
                  styles.slice,
                  {
                    transform: [{ rotate: `${sliceAngle}deg` }],
                    backgroundColor: slices[ slice].color || '#FFD700', // Default color
                  },
                ]}
              >
                <Text style={styles.sliceText}>{slice}</Text>
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* Spin Button */}
      <TouchableOpacity style={styles.spinButton} onPress={spinWheel}>
        <Text style={styles.spinButtonText}>Spin the Wheel</Text>
      </TouchableOpacity>

      {/* Display Winner */}
      {winner && (
        <Text style={styles.winnerText}>
          Congratulations! The winner is: {winner}
        </Text>
      )}
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  wheelContainer: {
    width: width - 40,
    height: width - 40,
    borderRadius: (width - 40) / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wheel: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  slice: {
    position: 'absolute',
    width: '100%', // Now the slice will take the full width of the circle
    height: '50%', // We use 50% for height to split each slice into equal sections from the center to the outer edge
    top: '50%',
    left: '50%',
    backgroundColor: '#FFD700', // Default background color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: 5,
    transformOrigin: '0% 100%', // This ensures the slice rotates from its center outward
  },
  sliceText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    color: '#000',
    fontWeight: 'bold',
  },
  spinButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  spinButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  winnerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6347',
  },
});

export default WheelOfFortuneScreen;
