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
  TouchableOpacity
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EventCard = () => {
  // Hardcoded event data
  const eventData = {
    name: "Friday Night Party",
    description: "Weekly social gathering with music and drinks. This event is open to all members and friends. Come enjoy live music, great food, and amazing company! We'll have special guests this week including a live DJ and mixology demonstrations. Don't forget to bring your friends - the first 50 attendees get free drink tickets!\n\nLocation: The Rooftop Lounge\nDress Code: Smart Casual\nAge Limit: 21+",
    startTime: "8:00 PM",
    endTime: "11:30 PM",
    days: ["Friday"],
    location: "The Rooftop Lounge, 123 Main St",
    imageUri: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819"
  };

  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const scrollViewRef = useRef(null);
  const isScrolling = useRef(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (_, gestureState) => {
      return gestureState.numberActiveTouches === 2;
    },
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.numberActiveTouches === 2 && 
             Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderGrant: () => {
      scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
      isScrolling.current = false;
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gesture) => {
      scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
      
      if (gesture.dx > 120) {
        swipeCard('right');
      } else if (gesture.dx < -120) {
        swipeCard('left');
      } else {
        resetPosition();
      }
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
      friction: 4,
      useNativeDriver: false
    }).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            transform: [
              { translateX: pan.x }
            ]
          }
        ]}
      >
        <Image 
          source={{ uri: eventData.imageUri }} 
          style={styles.cardImage}
          resizeMode="cover"
        />

        <View style={styles.cardInfo}>
          <Text style={styles.eventTitle}>{eventData.name}</Text>
          
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>
              🕒 {eventData.startTime} - {eventData.endTime}
            </Text>
            <Text style={styles.detailText}>
              📅 {eventData.day(', ')}
            </Text>
            <Text style={styles.detailText}>
              📍 {eventData.location}
            </Text>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.descriptionScroll}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={true}
          >
            <Text style={styles.cardDescription}>
              {eventData.description}
            </Text>
          </ScrollView>
        </View>
      </Animated.View>

      {/* Accept/Decline Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.declineButton]}
          onPress={() => swipeCard('left')}
        >
          <Text style={[styles.buttonText, styles.declineButtonText]}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.acceptButton]}
          onPress={() => swipeCard('right')}
        >
          <Text style={[styles.buttonText, styles.acceptButtonText]}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.78, 
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardImage: {
    width: '100%',
    height: '40%',
  },
  cardInfo: {
    padding: 20,
    backgroundColor: '#FFF',
    height: '60%',
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
    textAlign: 'left',
  },
  detailsContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  detailText: {
    fontSize: 18,
    marginBottom: 8,
    color: '#000',
  },
  descriptionScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  cardDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 150,
    alignItems: 'center',
  },
  declineButton: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B',
  },
  acceptButton: {
    borderColor: '#51B27E',
    backgroundColor: '#51B27E',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  acceptButtonText: {
    color: '#FFF',
  },
  declineButtonText: {
    color: '#FFF',
  },
});

export default EventCard;