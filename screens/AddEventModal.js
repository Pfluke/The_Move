// AddEventModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';
import { getFirestore, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// build 30‑min AM/PM options
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const total = i * 30;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12 || 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${h12}:${mm} ${ampm}`;
});

// parse "H:MM AM/PM" → minutes since midnight
function parse12Hour(str) {
  const [time, ampm] = str.trim().split(' ');
  let [h, m] = time.split(':').map(Number);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

// format a Date → "H:MM AM/PM"
function formatTime(date) {
  let h = date.getHours();
  let m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  m = m < 10 ? '0'+m : m;
  return `${h}:${m} ${ampm}`;
}

export default function AddEventModal({ visible, onClose, onSubmit }) {
  const route = useRoute();
  const { groupName, username } = route.params;
  //console.log('🔑 AddEventModal mount; groupName =', groupName, 'username =', username);

  const [groupMembers, setGroupMembers] = useState([]);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [startTime, setStartTime] = useState('9:00 AM');
  const [endTime, setEndTime] = useState('5:00 PM');
  const [descriptionWarning, setDescriptionWarning] = useState(false);

  // subscribe to group.members
  useEffect(() => {
    if (!groupName) {
      //console.warn('⚠️ No groupName passed');
      return;
    }
    //console.log('subscribing to groups/', groupName);
    const unsub = onSnapshot(
      doc(db, 'groups', groupName),
      snap => {
        if (snap.exists()) {
          const mem = snap.data().members || [];
          //console.log('loaded group.members:', mem);
          setGroupMembers(mem);
        } else {
          //console.warn('group doc missing for', groupName);
        }
      },
      //err => console.error('groups onSnapshot error:', err)
    );
    return () => unsub();
  }, [groupName]);

  // count how many members overlap
  async function countBusyMembersForTime(day, start, end) {
    //console.log('🔍 countBusyMembersForTime()', { day, start, end });
    //console.log('👥 groupMembers:', groupMembers);
    const eventStart = parse12Hour(start);
    const eventEnd = parse12Hour(end);
    let busyCount = 0;

    for (let user of groupMembers) {
      //console.log(`  fetching busyTimes for user=${user}`);
      const snap = await getDoc(doc(db, 'users', user.toLowerCase()));
      if (!snap.exists()) {
        //console.log('   → no user doc for', user);
        continue;
      }
      // Normalize old-object & string formats
      const raw = snap.data().busyTimes?.[day] || [];
      const busyArr = raw
        .map(item => {
          if (typeof item === 'string') {
            return item;
          } else if (item.start && item.end) {
            return `${formatTime(item.start.toDate())} – ${formatTime(item.end.toDate())}`;
          }
          return null;
        })
        .filter(Boolean);
      //console.log(`   → normalized busyArr[${day}] for ${user}:`, busyArr);

      const overlaps = busyArr.some(rangeStr => {
        const [sStr, eStr] = rangeStr.split('–').map(s => s.trim());
        const sMin = parse12Hour(sStr);
        const eMin = parse12Hour(eStr);
        const isOverlap = eventStart < eMin && eventEnd > sMin;
        if (isOverlap) //console.log(`     overlap with ${user}: ${rangeStr}`);
        return isOverlap;
      });
      if (overlaps) busyCount++;
    }

    //console.log('total busyCount =', busyCount);
    return busyCount;
  }

  // wizard navigation
  const handleNext = async () => {
    //console.log('▶️ handleNext() step=', step);
    if (step === 1) {
      if (!title.trim()) {
        return Alert.alert('Title Required','Please enter a title.');
      }
      if (!description.trim() && !descriptionWarning) {
        Alert.alert('Missing Details','Your buddies may appreciate more info.');
        setDescriptionWarning(true);
        return;
      }
      setStep(2);

    } else if (step === 2) {
      //console.log('  inputs:', selectedDay, startTime, endTime);
      if (!selectedDay) {
        return Alert.alert('Missing Info','Please select a day.');
      }
      if (parse12Hour(endTime) <= parse12Hour(startTime)) {
        return Alert.alert('Invalid Time','End must be after start.');
      }
      const numBusy = await countBusyMembersForTime(selectedDay, startTime, endTime);
      //console.log('  numBusy =', numBusy);
      if (numBusy > 0) {
        return Alert.alert(
          'Busy Members',
          `${numBusy} ${numBusy===1?'person is':'people are'} busy during this slot.`,
          [
            { text:'Reschedule', style:'cancel', onPress:()=>console.log('🔄 Reschedule') },
            { text:'Continue', onPress:()=>{ console.log('➡️ Continue'); setStep(3); } }
          ]
        );
      }
      setStep(3);
    }
  };

  const resetModal = () => {
    //console.log('resetModal()');
    setStep(1);
    setTitle('');
    setDescription('');
    setSelectedDay('');
    setStartTime('9:00 AM');
    setEndTime('5:00 PM');
    setDescriptionWarning(false);
  };

  const handleCancel = () => {
    //console.log('handleCancel()');
    resetModal();
    onClose();
  };

  const handleSubmit = () => {
    //console.log('✅ handleSubmit()');
    const eventData = { title: title.trim(), description: description.trim(), day: selectedDay, startTime, endTime };
    //console.log(' → submitting', eventData);
    resetModal();
    onSubmit(eventData);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[
          step===1 ? styles.titleModalContent :
          step===2 ? styles.dateAndTimeModalContent :
          styles.reviewModalContent
        ]}>
          <View style={styles.innerModal}>

            {step===1 && (
              <>
                <Text style={styles.header}>Event Title</Text>
                <TextInput
                  placeholder="Event Title"
                  placeholderTextColor="#888"
                  textAlign="center"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                  onSubmitEditing={Keyboard.dismiss}
                />
                <Text style={styles.details}>Optional: Event Details</Text>
                <TextInput
                  placeholder="Event Details"
                  placeholderTextColor="#888"
                  textAlign="center"
                  value={description}
                  onChangeText={setDescription}
                  style={[styles.input,{height:100}]}
                  onSubmitEditing={Keyboard.dismiss}
                />
              </>
            )}

            {step===2 && (
              <>
                <Text style={styles.header}>Choose Day & Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
                  {DAYS.map(day=>(
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayOption, selectedDay===day && styles.selectedDay]}
                      onPress={()=>{ console.log('pick day',day); setSelectedDay(day); }}
                    >
                      <Text style={ selectedDay===day ? styles.selectedDayText : styles.dayOptionText }>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.timeContainer}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <View style={styles.timePickerContainer}>
                      <Picker
                        selectedValue={startTime}
                        style={styles.timePicker}
                        onValueChange={val=>{ console.log('startTime->',val); setStartTime(val); }}
                      >
                        {timeOptions.map(t=> <Picker.Item key={t} label={t} value={t} color='black'/> )}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>End Time</Text>
                    <View style={styles.timePickerContainer}>
                      <Picker
                        selectedValue={endTime}
                        style={styles.timePicker}
                        onValueChange={val=>{ console.log('endTime->',val); setEndTime(val); }}
                      >
                        {timeOptions.map(t=> <Picker.Item key={t} label={t} value={t} color='black'/> )}
                      </Picker>
                    </View>
                  </View>
                </View>
              </>
            )}

            {step===3 && (
              <>
                <Text style={[styles.header,styles.reviewHeader]}>Review Event</Text>
                <ScrollView contentContainerStyle={styles.reviewScrollContainer}>
                  <Text style={styles.summaryText}>
                    <Text style={{fontWeight:'bold'}}>Title:</Text> {title}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={{fontWeight:'bold'}}>Details:</Text> {description||'None'}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={{fontWeight:'bold'}}>Day:</Text> {selectedDay}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={{fontWeight:'bold'}}>Time:</Text> {startTime} – {endTime}
                  </Text>
                </ScrollView>
              </>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              {step===3
                ? <TouchableOpacity onPress={handleSubmit} style={styles.nextButton}>
                    <Text style={styles.nextText}>Confirm</Text>
                  </TouchableOpacity>
                : <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                    <Text style={styles.nextText}>Next</Text>
                  </TouchableOpacity>
              }
            </View>

          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.6)' },
  titleModalContent: { backgroundColor:'white',borderRadius:20,padding:25,width:'90%',height:'45%' },
  dateAndTimeModalContent: { backgroundColor:'white',borderRadius:20,padding:25,width:'95%',height:'52%' },
  reviewModalContent: { backgroundColor:'white',borderRadius:20,padding:25,width:'85%',height:'40%' },
  innerModal: { alignItems:'center',justifyContent:'center' },
  header: { fontSize:30,fontWeight:'bold',marginBottom:16,alignSelf:'center' },
  reviewHeader: { marginBottom:10 },
  details: { fontSize:16,fontWeight:'bold',marginBottom:8 },
  input: { width:'100%',borderColor:'black',borderWidth:2,borderRadius:16,padding:12,marginBottom:10 },
  daySelector:{ height:66,borderRadius:5,borderWidth:1,borderColor:'black',marginVertical:8 },
  dayOption:{ paddingHorizontal:15,paddingVertical:10,marginHorizontal:5,borderRadius:10,borderWidth:1,borderColor:'#ccc',justifyContent:'center',alignItems:'center'},
  selectedDay:{ backgroundColor:'#e8f4e8',borderColor:'#4CAF50',borderWidth:2},
  dayOptionText:{ fontSize:18}, selectedDayText:{ fontSize:16,fontWeight:'bold',color:'#2E7D32'},
  timeContainer:{ flexDirection:'row',justifyContent:'space-between',marginVertical:8},
  timeColumn:{ flex:1,marginHorizontal:4},
  timeLabel:{ fontSize:16,fontWeight:'bold',alignSelf:'center'},
  timePickerContainer:{ borderRadius:5,borderWidth:1,borderColor:'black',overflow:'hidden'},
  timePicker:{ height:140,},
  summaryText:{ fontSize:18,marginVertical:5},
  buttonRow:{ flexDirection:'row',justifyContent:'space-evenly',marginTop:20},
  cancelButton:{ padding:10,backgroundColor:'#ffdddd',borderRadius:3,borderWidth:2,width:'40%',alignItems:'center'},
  cancelText:{ fontWeight:'bold',fontSize:20},
  nextButton:{ padding:10,backgroundColor:'#d4f7d4',borderRadius:3,borderWidth:2,width:'40%',alignItems:'center'},
  nextText:{ fontWeight:'bold',fontSize:20},
  reviewScrollContainer:{ paddingBottom:30},
});
