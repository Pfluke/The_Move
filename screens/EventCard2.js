import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getFirestore, collection, getDoc, doc, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// const EventCard = () => {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const { event } = route.params;

//   const pan = useRef(new Animated.ValueXY()).current;
//   const scrollViewRef = useRef(null);

//   const panResponder = PanResponder.create({
//     onStartShouldSetPanResponder: (_, gestureState) => gestureState.numberActiveTouches === 2,
//     onMoveShouldSetPanResponder: (_, gestureState) => 
//       gestureState.numberActiveTouches === 2 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
//     onPanResponderGrant: () => {
//       scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
//     },
//     onPanResponderMove: Animated.event(
//       [null, { dx: pan.x }],
//       { useNativeDriver: false }
//     ),
//     onPanResponderRelease: (_, gesture) => {
//       scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
//       if (gesture.dx > 120) swipeCard('right');
//       else if (gesture.dx < -120) swipeCard('left');
//       else resetPosition();
//     },
//     onPanResponderTerminate: () => {
//       resetPosition();
//       scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
//     }
//   };

//   const swipeCard = async (direction) => {
//     const event = events[currentIndex];
//     if (!event) return;
  
//     await markAsSeen(event.name);
  
//     Animated.spring(pan.x, {
//       toValue: direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH,
//       useNativeDriver: false,
//     }).start(() => {
//       pan.setValue({ x: 0, y: 0 });
  
//       // If this is the last card, move past the array length to trigger "no more events"
//       if (currentIndex >= events.length - 1) {
//         setCurrentIndex(events.length); // go just beyond the last index
//       } else {
//         setCurrentIndex((prev) => prev + 1);
//       }
//     });
//   };
  

//   const resetPosition = () => {
//     Animated.spring(pan.x, {
//       toValue: 0,
//       friction: 5,
//       useNativeDriver: false
//     }).start();
//   };

//   const panResponder = PanResponder.create({
//     onStartShouldSetPanResponder: (_, gestureState) => gestureState.numberActiveTouches === 2,
//     onMoveShouldSetPanResponder: (_, gestureState) =>
//       gestureState.numberActiveTouches === 2 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
//     onPanResponderGrant: () => {
//       scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
//     },
//     onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
//     onPanResponderRelease: (_, gesture) => {
//       scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
//       if (gesture.dx > 120) swipeCard('right');
//       else if (gesture.dx < -120) swipeCard('left');
//       else resetPosition();
//     },
//     onPanResponderTerminate: () => {
//       resetPosition();
//       scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
//     },
//   });

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#333" />
//       </View>
//     );
//   }

//   const eventData = events[currentIndex];

//   if (!eventData) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={{ fontSize: 18 }}>No more events 🎉</Text>
//          <TouchableOpacity
//                 style={styles.button}
//                 onPress={() => navigation.navigate('EventScreen', { username, groupName })}
//               >
//                 <Text style={styles.buttonText}>Back to Group</Text>
//               </TouchableOpacity>
//       </View>
      
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       {/* Header with Back Button */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//           <MaterialIcons name="arrow-back" size={28} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Event Details</Text>
//         <View style={styles.backButton} /> {/* Empty to balance layout */}
//       </View>

//       {/* Card Content */}
//       <View style={styles.container}>
//         <Animated.View
//           {...panResponder.panHandlers}
//           style={[
//             styles.card,
//             { transform: [{ translateX: pan.x }] }
//           ]}
//         >

//         <View style={styles.cardInfo}>
//           <Text style={styles.eventTitle}>{eventData.name}</Text>

//           <View style={styles.detailsContainer}>
//             <Text style={styles.detailText}>
//               🕒 {eventData.startTime} - {eventData.endTime}
//             </Text>
//             <Text style={styles.detailText}>
//               📅 {eventData.day}
//             </Text>
//             <Text style={styles.detailText}>
//               📍 {eventData.location}
//             </Text>
//           </View>

//             <ScrollView 
//               ref={scrollViewRef}
//               style={styles.descriptionScroll}
//               contentContainerStyle={styles.scrollContent}
//               scrollEnabled={true}
//             >
//               <Text style={styles.cardDescription}>
//                 {event.description}
//               </Text>
//             </ScrollView>
//           </View>
//         </Animated.View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//     backgroundColor: '#FFFFFF',
//   },
//   backButton: {
//     width: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     flex: 1,
//     fontSize: 22,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     color: '#000',
//   },
//   container: {
//     flex: 1,
//     padding: 20,
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//   },
//   card: {
//     width: '100%',
//     height: SCREEN_HEIGHT * 0.8,
//     borderRadius: 20,
//     backgroundColor: '#F9F9F9',
//     overflow: 'hidden',
//     borderColor: '#DDD',
//     borderWidth: 1,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   cardImage: {
//     width: '100%',
//     height: '40%',
//   },
//   cardInfo: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#FFFFFF',
//   },
//   eventTitle: {
//     fontSize: 26,
//     fontWeight: 'bold',
//     color: '#000',
//     marginBottom: 10,
//   },
//   detailsContainer: {
//     marginBottom: 15,
//   },
//   detailText: {
//     fontSize: 16,
//     color: '#444',
//     marginBottom: 6,
//   },
//   descriptionScroll: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 20,
//   },
//   cardDescription: {
//     fontSize: 16,
//     color: '#666',
//     lineHeight: 22,
//   },
// });

// export default EventCard;
