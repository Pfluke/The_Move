import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';

const ScheduleGrid = () => {
  // Constants for grid configuration
  const CELL_HEIGHT = 50;
  const START_HOUR = 8; // 8:00 AM
  const END_HOUR = 22; // 10:00 PM
  const SCROLL_BORDER_WIDTH = 40; // Width of the scroll-only area
  
  // Generate time slots for the day (30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      const hourFormatted = hour % 12 === 0 ? 12 : hour % 12;
      const amPm = hour < 12 ? 'AM' : 'PM';
      
      // Add :00 slot
      slots.push({
        id: `${hour}:00`,
        label: `${hourFormatted}:00 ${amPm}`,
        time: `${hour}:00`
      });
      
      // Add :30 slot
      slots.push({
        id: `${hour}:30`,
        label: `${hourFormatted}:30 ${amPm}`,
        time: `${hour}:30`
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  
  // State to track selected time slots
  const [selectedSlots, setSelectedSlots] = useState({});
  const [gridWidth, setGridWidth] = useState(0);
  
  // Refs for dragging
  const isDraggingRef = useRef(false);
  const lastSelectedRef = useRef(null);
  const selectionModeRef = useRef(true); // true = select, false = deselect
  const scrollViewRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  
  // Track scroll position
  const handleScroll = (event) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  };
  
  // Find the time slot at a specific Y position
  const getTimeSlotAtPosition = (y) => {
    const absoluteY = y + scrollOffsetRef.current;
    const slotIndex = Math.floor(absoluteY / CELL_HEIGHT);
    
    if (slotIndex >= 0 && slotIndex < timeSlots.length) {
      return timeSlots[slotIndex].id;
    }
    return null;
  };

  // Determine if touch is in the selection area or scroll area
  const isInSelectionArea = (x) => {
    // If touch is in the middle part (excluding scroll borders)
    return x > SCROLL_BORDER_WIDTH && x < gridWidth - SCROLL_BORDER_WIDTH;
  };

  // Handle the start of a drag
  const handleDragStart = (event) => {
    const { x, y } = event.nativeEvent;
    
    // Only process selection if in the main grid area (not scroll borders)
    if (isInSelectionArea(x)) {
      const slotId = getTimeSlotAtPosition(y);
      
      if (slotId) {
        isDraggingRef.current = true;
        lastSelectedRef.current = slotId;
        
        // Determine if we're selecting or deselecting
        selectionModeRef.current = !selectedSlots[slotId];
        
        // Update the selected slots
        setSelectedSlots(prev => ({
          ...prev,
          [slotId]: selectionModeRef.current
        }));
      }
    }
  };

  // Handle drag movement
  const handleDrag = (event) => {
    const { x, y } = event.nativeEvent;
    
    // Only process selection if in the middle grid area and we're currently dragging
    if (isDraggingRef.current && isInSelectionArea(x)) {
      const slotId = getTimeSlotAtPosition(y);
      
      if (slotId && lastSelectedRef.current !== slotId) {
        lastSelectedRef.current = slotId;
        
        // Update selected slots while maintaining selection mode
        setSelectedSlots(prev => ({
          ...prev,
          [slotId]: selectionModeRef.current
        }));
      }
    }
  };

  // Handle end of drag
  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };

  // Manually handle time slot selection (for direct taps)
  const handleTimeSlotPress = (slotId) => {
    setSelectedSlots(prev => ({
      ...prev,
      [slotId]: !prev[slotId]
    }));
  };

  // Measure grid width when component mounts
  const onGridLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setGridWidth(width);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={styles.title}>Select Available Times</Text>
      <View style={styles.gridContainer} onLayout={onGridLayout}>
        {/* Left scroll border */}
        <View style={[styles.scrollBorder, { left: 0 }]} />
        
        {/* Right scroll border */}
        <View style={[styles.scrollBorder, { right: 0 }]} />
        
        <PanGestureHandler
          onGestureEvent={handleDrag}
          onHandlerStateChange={(event) => {
            if (event.nativeEvent.state === State.BEGAN) {
              handleDragStart(event);
            } else if (event.nativeEvent.state === State.END) {
              handleDragEnd();
            }
          }}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}
            onScroll={handleScroll}
          >
            {timeSlots.map((slot) => (
              <TouchableWithoutFeedback 
                key={slot.id}
                onPress={() => handleTimeSlotPress(slot.id)}
              >
                <View 
                  style={[
                    styles.timeSlot,
                    selectedSlots[slot.id] ? styles.selectedTimeSlot : null,
                    slot.id.endsWith(':00') ? styles.hourBorder : null
                  ]}
                >
                  <Text style={styles.timeText}>{slot.label}</Text>
                </View>
              </TouchableWithoutFeedback>
            ))}
          </ScrollView>
        </PanGestureHandler>
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.scrollIndicator} />
          <Text style={styles.legendText}>Scroll Areas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.selectIndicator} />
          <Text style={styles.legendText}>Selection Area</Text>
        </View>
      </View>
      
      <View style={styles.selectedTimesContainer}>
        <Text style={styles.selectedTimesTitle}>Selected Times:</Text>
        <Text>
          {Object.keys(selectedSlots)
            .filter(id => selectedSlots[id])
            .sort()
            .map(id => timeSlots.find(slot => slot.id === id)?.label)
            .join(', ') || 'None'}
        </Text>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  gridContainer: {
    position: 'relative',
    height: Dimensions.get('window').height * 0.6,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  scrollBorder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
    zIndex: 10,
    borderRadius: 8,
  },
  timeSlot: {
    height: 50,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  selectedTimeSlot: {
    backgroundColor: '#90caf9',
  },
  hourBorder: {
    borderTopWidth: 2,
    borderTopColor: '#bbb',
  },
  timeText: {
    fontSize: 16,
  },
  selectedTimesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTimesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  scrollIndicator: {
    width: 16,
    height: 16,
    backgroundColor: 'rgba(200, 200, 200, 0.5)',
    marginRight: 4,
    borderRadius: 2,
  },
  selectIndicator: {
    width: 16,
    height: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
});

export default ScheduleGrid;