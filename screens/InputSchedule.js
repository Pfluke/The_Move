import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  SafeAreaView, ScrollView, Platform, Modal, TouchableWithoutFeedback
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);
const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const InputSchedule = ({ route, navigation }) => {
  const { username } = route.params;
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [busyTimes, setBusyTimes] = useState(
    daysOfWeek.reduce((acc,d)=>{ acc[d]=[]; return acc; },{})
  );

  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [tempRange, setTempRange] = useState({start:null,end:null});
  const [isStart, setIsStart] = useState(true);
  const [showIOSStart, setShowIOSStart] = useState(false);
  const [showIOSEnd, setShowIOSEnd] = useState(false);

  const isAnyPickerVisible = () =>
    isTimePickerVisible || showIOSStart || showIOSEnd;

  const formatTime = date => {
    if (!date) return '';
    let h=date.getHours(), m=date.getMinutes();
    const ampm=h>=12?'PM':'AM';
    h=h%12||12;
    m=m<10?'0'+m:m;
    return `${h}:${m} ${ampm}`;
  };

  const addBusy = () => {
    if (Platform.OS==='ios') {
      setSelectedTime(new Date());
      setShowIOSStart(true);
    } else {
      setTempRange({start:null,end:null});
      setIsStart(true);
      setSelectedTime(new Date());
      setTimePickerVisible(true);
    }
  };

  const handleTimeChange = (e,d) => {
    if (e.type==='dismissed' && Platform.OS==='android') {
      return setTimePickerVisible(false);
    }
    setSelectedTime(d||selectedTime);
  };

  const handleIOSStart = () => {
    setShowIOSStart(false);
    setTempRange(p=>({...p,start:selectedTime}));
    setShowIOSEnd(true);
  };

  const handleIOSEnd = () => {
    setShowIOSEnd(false);
    if (selectedTime>tempRange.start) {
      const day=daysOfWeek[currentDayIndex];
      const newR={ id:Date.now().toString(), start:tempRange.start, end:selectedTime };
      const existing=busyTimes[day];
      if (existing.some(r=>(
        (newR.start<=r.start && newR.end>r.start) ||
        (newR.start>=r.start && newR.start<r.end)
      ))) {
        return Alert.alert('Overlap','That busy time overlaps existing.');
      }
      setBusyTimes(p=>({
        ...p,
        [day]: [...p[day],newR]
      }));
    } else {
      Alert.alert('Invalid','End must be after start');
    }
  };

  const closeAll = () => {
    setTimePickerVisible(false);
    setShowIOSStart(false);
    setShowIOSEnd(false);
  };

  const removeRange = id => {
    const day=daysOfWeek[currentDayIndex];
    setBusyTimes(p=>({
      ...p,
      [day]: p[day].filter(r=>r.id!==id)
    }));
  };

  const navDay = delta => {
    setCurrentDayIndex(i=>Math.min(Math.max(i+delta,0),6));
  };

  const handleSave = () => {
    Alert.alert(
      'Save Confirmation',
      'Are you sure you want to save your busy times?',
      [
        { text:'Cancel', style:'cancel' },
        {
          text:'OK', onPress: async () => {
            try {
              const userRef = doc(db,'users',username.toLowerCase());
              await updateDoc(userRef,{ busyTimes });
              navigation.navigate('GroupScreen',{
                username,
                userGroups: []
              });
            } catch(e) {
              Alert.alert('Error saving',e.message);
            }
          }
        }
      ]
    );
  };

  const day=daysOfWeek[currentDayIndex];
  const list=busyTimes[day];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>When Are You Busy?</Text>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.dayNavigation}>
          <TouchableOpacity
            style={[styles.navButton, currentDayIndex===0 && styles.disabledButton]}
            onPress={()=>navDay(-1)} disabled={currentDayIndex===0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          <View style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
          <TouchableOpacity
            style={[styles.navButton, currentDayIndex===6 && styles.disabledButton]}
            onPress={()=>navDay(1)} disabled={currentDayIndex===6}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.availabilityList}>
          {list.length
            ? list.map(r=>(
                <View key={r.id} style={styles.timeRangeCard}>
                  <Text style={styles.timeRangeText}>
                    {formatTime(r.start)} - {formatTime(r.end)}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={()=>removeRange(r.id)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            : <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No busy times added for {day}
                </Text>
              </View>
          }
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={addBusy}>
          <Text style={styles.addButtonText}>+ Add Busy Time</Text>
        </TouchableOpacity>
      </View>

      {/* Android picker */}
      {Platform.OS==='android' && isTimePickerVisible && (
        <Modal transparent visible animationType="fade" onRequestClose={()=>setTimePickerVisible(false)}>
          <TouchableWithoutFeedback onPress={()=>setTimePickerVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {isStart ? 'Select Start Time' : 'Select End Time'}
                  </Text>
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                    minuteInterval={5}
                  />
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={()=>{
                        if (isStart) {
                          setIsStart(false);
                          setTempRange({ start:selectedTime, end:null });
                        } else {
                          handleIOSEnd();
                          setTimePickerVisible(false);
                        }
                      }}
                    >
                      <Text style={styles.modalButtonText}>
                        {isStart?'Next':'Done'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={()=>setTimePickerVisible(false)}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* iOS picker */}
      {Platform.OS==='ios' && (showIOSStart || showIOSEnd) && (
        <Modal transparent animationType="fade">
          <View style={styles.iosPickerOverlay}>
            <View style={styles.iosPickerWrapper}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={closeAll}><Text style={styles.iosPickerCancelText}>Cancel</Text></TouchableOpacity>
                <Text style={styles.iosPickerTitle}>
                  {showIOSStart?'Select Start Time':'Select End Time'}
                </Text>
                <TouchableOpacity onPress={showIOSStart?handleIOSStart:handleIOSEnd}>
                  <Text style={styles.iosPickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                minuteInterval={5}
              />
            </View>
          </View>
        </Modal>
      )}

      {!isAnyPickerVisible() && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={()=>navigation.navigate('GroupScreen',{username,userGroups:[]})}
          >
            <Text style={styles.buttonText}>Skip this for now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    headerContainer: {
        paddingTop: 20,
        paddingBottom: 10,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    contentWrapper: {
        flex: 1,
        paddingHorizontal: 24,
    },
    dayNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    navButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#000000',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    navButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    dayHeader: {
        padding: 10,
        alignItems: 'center',
    },
    dayHeaderText: {
        fontSize: 22,
        fontWeight: '600',
    },
    availabilityList: {
        flex: 1,
        marginBottom: 8,
        borderBottomColor: '#000000',
        borderBottomWidth: 2,
        //shadowColor: '#000000',
        //shadowOpacity: '1'
    },
    timeRangeCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000000',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    timeRangeText: {
        fontSize: 16,
        flex: 1,
        color: '#FFFFFF',
    },
    removeButton: {
        padding: 5,
        borderRadius: 15,
        backgroundColor: '#ff6b6b',
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyState: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    addButton: {
        backgroundColor: '#000000',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginBottom: 15,
        borderColor: '#000000',
        borderWidth: 2,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        padding: 16,
        paddingHorizontal: 24,
    },
    button: {
        paddingVertical: 12,
        //paddingHorizontal: 50,
        paddingLeft: 25,
        paddingRight: 25,
        borderRadius: 8,
        backgroundColor: '#aaaaaa',
        borderColor: '#000000',
        borderWidth: 2,
    },
    saveBtn: {
        paddingVertical: 12,
        paddingLeft: 70,
        paddingRight: 70,
        //paddingHorizontal: 45,
        borderRadius: 8,
        backgroundColor: '#000000',
        borderColor: '#000000',
        borderWidth: 2,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#000000', 
        backgroundColor: '#f0f0f0', 
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 15,
    },
    modalButton: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#2289f0',
        minWidth: 100,
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    iosPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    iosPickerWrapper: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iosPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#f8f8f8',
    },
    iosPickerTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        flex: 1,
        color: '#000000', 
    },
    iosPickerButton: {
        padding: 8,
        width: 70,
        alignItems: 'center',
    },
    iosPickerDoneText: {
        color: '#2289f0',
        fontSize: 16,
        fontWeight: '600',
    },
    iosPickerCancelText: {
        color: '#ff6b6b',
        fontSize: 16,
        fontWeight: '600',
    },
    iosPickerContainer: {
        backgroundColor: 'white',
    },
    iosPicker: {
        height: 200,
        color: '#000000', 
    }
});

export default InputSchedule;