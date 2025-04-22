import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Dimensions, TouchableOpacity, TouchableWithoutFeedback, Alert
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);
const CELL_HEIGHT = 50;
const START_HOUR = 8;
const END_HOUR = 22;
const SCROLL_BORDER = 40;

const generateTimeSlots = () => {
  const slots = [];
  for (let h=START_HOUR; h<END_HOUR; h++) {
    const labH = h%12||12;
    const ampm = h<12?'AM':'PM';
    slots.push({id:`${h}:00`,label:`${labH}:00 ${ampm}`});
    slots.push({id:`${h}:30`,label:`${labH}:30 ${ampm}`});
  }
  return slots;
};

const ScheduleGrid = ({ route, navigation }) => {
  const { username } = route.params;
  const timeSlots = generateTimeSlots();
  const [selected, setSelected] = useState({});
  const [gridWidth, setGridWidth] = useState(0);

  const isDragging = useRef(false);
  const lastSel = useRef(null);
  const selMode = useRef(true);
  const scrollRef = useRef(null);
  const scrollOff = useRef(0);

  const handleScroll = e => { scrollOff.current = e.nativeEvent.contentOffset.y; };
  const getSlotAt = y => {
    const idx = Math.floor((y+scrollOff.current)/CELL_HEIGHT);
    return timeSlots[idx]?.id||null;
  };
  const inArea = x => x>SCROLL_BORDER && x<gridWidth-SCROLL_BORDER;

  const onDragStart = e => {
    const { x,y } = e.nativeEvent;
    if (!inArea(x)) return;
    const id = getSlotAt(y);
    if (!id) return;
    isDragging.current = true;
    lastSel.current = id;
    selMode.current = !selected[id];
    setSelected(p=>({...p, [id]: selMode.current}));
  };
  const onDrag = e => {
    const { x,y } = e.nativeEvent;
    if (!isDragging.current || !inArea(x)) return;
    const id = getSlotAt(y);
    if (id && id!==lastSel.current) {
      lastSel.current = id;
      setSelected(p=>({...p, [id]: selMode.current}));
    }
  };
  const onDragEnd = () => { isDragging.current = false; };

  const toggleSlot = id => {
    setSelected(p=>({...p, [id]:!p[id]}));
  };

  const saveBusySlots = async () => {
    try {
      const userRef = doc(db,'users',username.toLowerCase());
      await updateDoc(userRef,{ busySlots: selected });
      navigation.navigate('GroupScreen',{username,userGroups:[]});
    } catch(e) {
      Alert.alert('Error saving', e.message);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={styles.title}>Select Busy Times</Text>

      <View style={styles.gridContainer} onLayout={e=>setGridWidth(e.nativeEvent.layout.width)}>
        <View style={[styles.scrollBorder,{left:0}]} />
        <View style={[styles.scrollBorder,{right:0}]} />

        <PanGestureHandler
          onGestureEvent={onDrag}
          onHandlerStateChange={ev=>{
            if (ev.nativeEvent.state===State.BEGAN) onDragStart(ev);
            else if (ev.nativeEvent.state===State.END) onDragEnd();
          }}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {timeSlots.map(slot=>(
              <TouchableWithoutFeedback
                key={slot.id}
                onPress={()=>toggleSlot(slot.id)}
              >
                <View style={[
                  styles.timeSlot,
                  selected[slot.id] && styles.selectedTimeSlot,
                  slot.id.endsWith(':00') && styles.hourBorder
                ]}>
                  <Text style={styles.timeText}>{slot.label}</Text>
                </View>
              </TouchableWithoutFeedback>
            ))}
          </ScrollView>
        </PanGestureHandler>
      </View>

      <View style={styles.selectedTimesContainer}>
        <Text style={styles.selectedTimesTitle}>Busy Slots:</Text>
        <Text>
          {Object.keys(selected)
            .filter(id=>selected[id])
            .map(id=>timeSlots.find(s=>s.id===id).label)
            .join(', ')||'None'}
        </Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveBusySlots}>
        <Text style={styles.saveText}>Save Busy Times</Text>
      </TouchableOpacity>
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