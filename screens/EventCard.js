import React, { useRef } from 'react';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EventCard = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { event } = route.params;

  const pan = useRef(new Animated.ValueXY()).current;
  const scrollViewRef = useRef(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (_, gestureState) => gestureState.numberActiveTouches === 2,
    onMoveShouldSetPanResponder: (_, gestureState) => 
      gestureState.numberActiveTouches === 2 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderGrant: () => {
      scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gesture) => {
      scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
      if (gesture.dx > 120) swipeCard('right');
      else if (gesture.dx < -120) swipeCard('left');
      else resetPosition();
    },
    onPanResponderTerminate: () => {
      resetPosition();
      scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
    }
  });

  const swipeCard = (direction) => {
    Animated.spring(pan.x, {
      toValue: direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH,
      useNativeDriver: false
    }).start(() => {
      resetPosition();
    });
  };

  const resetPosition = () => {
    Animated.spring(pan.x, {
      toValue: 0,
      friction: 5,
      useNativeDriver: false
    }).start();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={styles.backButton} /> {/* Empty to balance layout */}
      </View>

      {/* Card Content */}
      <View style={styles.container}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            { transform: [{ translateX: pan.x }] }
          ]}
        >

          <View style={styles.cardInfo}>
            <Text style={styles.eventTitle}>{event.title}</Text>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailText}>🕒 {event.startTime} - {event.endTime}</Text>
              <Text style={styles.detailText}>📅 {event.days.join(', ')}</Text>
              <Text style={styles.detailText}>📍 {event.location}</Text>
            </View>

            <ScrollView 
              ref={scrollViewRef}
              style={styles.descriptionScroll}
              contentContainerStyle={styles.scrollContent}
              scrollEnabled={true}
            >
              <Text style={styles.cardDescription}>
                {event.description}
              </Text>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  card: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.8,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    overflow: 'hidden',
    borderColor: '#DDD',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '40%',
  },
  cardInfo: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  detailsContainer: {
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 6,
  },
  descriptionScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
});

export default EventCard;
