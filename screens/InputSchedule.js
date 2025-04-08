import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const InputSchedule = ({ route, navigation }) => {

    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    
    const [availabilityByDay, setAvailabilityByDay] = useState(
        daysOfWeek.reduce((acc, day) => {
            acc[day] = [];
            return acc;
        }, {})
    );
    
    const [isTimePickerVisible, setTimePickerVisible] = useState(false);
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [isStartTime, setIsStartTime] = useState(true);
    const [tempTimeRange, setTempTimeRange] = useState({ start: null, end: null });
    
    const [showIOSStartPicker, setShowIOSStartPicker] = useState(false);
    const [showIOSEndPicker, setShowIOSEndPicker] = useState(false);
    
    const isAnyPickerVisible = () => {
        return isTimePickerVisible || showIOSStartPicker || showIOSEndPicker;
    };
    
    const formatTime = (date) => {
        if (!date) return '';
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutesStr} ${ampm}`;
    };

    const addAvailability = () => {
        if (Platform.OS === 'ios') {
            setSelectedTime(new Date());
            setShowIOSStartPicker(true);
        } else {
            setTempTimeRange({ start: null, end: null });
            setIsStartTime(true);
            setSelectedTime(new Date());
            setTimePickerVisible(true);
        }
    };

    const handleTimeChange = (event, selectedDate) => {
        if (event.type === 'dismissed') {
            // use has cencelled the action
            if (Platform.OS === 'android') {
                setTimePickerVisible(false);
            }
            return;
        }
        
        const currentDate = selectedDate || selectedTime;
        setSelectedTime(currentDate);
    };

    const handleIOSStartConfirm = () => {
        setShowIOSStartPicker(false);
        setTempTimeRange(prev => ({...prev, start: selectedTime}));
        setShowIOSEndPicker(true);
    };

    const handleIOSEndConfirm = () => {
        setShowIOSEndPicker(false);
        
        if (selectedTime > tempTimeRange.start) {
            const currentDay = daysOfWeek[currentDayIndex];
            const newTimeRange = {
                id: Date.now().toString(),
                start: tempTimeRange.start,
                end: selectedTime
            };
            
            const existingRanges = availabilityByDay[currentDay] || [];
            if (hasOverlap(newTimeRange, existingRanges)) {
                Alert.alert(
                    "Selected Availability Already Exists", 
                    "Please Select a Different Time"
                );
            } else {
                setAvailabilityByDay(prev => ({
                    ...prev,
                    [currentDay]: [...prev[currentDay], newTimeRange]
                }));
            }
        } else {
            Alert.alert("Invalid Time Range", "End time must be after start time");
        }
    };

    const closeAllPickers = () => {
        setTimePickerVisible(false);
        setShowIOSStartPicker(false);
        setShowIOSEndPicker(false);
    };

    const removeTimeRange = (id) => {
        const currentDay = daysOfWeek[currentDayIndex];
        setAvailabilityByDay(prev => ({
            ...prev,
            [currentDay]: prev[currentDay].filter(range => range.id !== id)
        }));
    };

    const goToNextDay = () => {
        if (currentDayIndex < daysOfWeek.length - 1) {
            setCurrentDayIndex(currentDayIndex + 1);
        }
    };

    const goToPrevDay = () => {
        if (currentDayIndex > 0) {
            setCurrentDayIndex(currentDayIndex - 1);
        }
    };

    const handleSave = () => {
        Alert.alert(
            'Save Confirmation', 
            'Are you sure you would like to save these preferences?', 
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'OK', 
                    onPress: () => {
                        //SEND LOGGED DATA TO FIREBASE HERE 
                        console.log('Saved availability:', availabilityByDay);
                        navigation.navigate('GroupScreen');
                    } 
                },
            ]
        );
    };

    const doTimeRangesOverlap = (range1, range2) => {
        return (
        (range1.start <= range2.start && range1.end > range2.start) || 
        (range1.start >= range2.start && range1.start < range2.end) || 
        (range1.start.getTime() === range2.start.getTime() && range1.end.getTime() === range2.end.getTime()) 
        );
    };
    
    const hasOverlap = (newRange, existingRanges) => {
        return existingRanges.some(existingRange => 
        doTimeRangesOverlap(newRange, existingRange)
        );
    };

    //potential feature to be added later - sorting availabilities
    // const sortTimeRanges = (ranges) => {
    //     return [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime());
    // };

    const currentDay = daysOfWeek[currentDayIndex];
    const dayAvailability = availabilityByDay[currentDay] || [];

    return (
        <SafeAreaView style={styles.container}>
            
            <View style={styles.headerContainer}>
                <Text style={styles.title}>When's The Move?</Text>
            </View>
    
            
            <View style={styles.contentWrapper}>
                
                <View style={styles.dayNavigation}>
                    <TouchableOpacity 
                        style={[styles.navButton, currentDayIndex === 0 && styles.disabledButton]} 
                        onPress={goToPrevDay}
                        disabled={currentDayIndex === 0}
                    >
                        <Text style={styles.navButtonText}>Previous</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.dayHeader}>
                        <Text style={styles.dayHeaderText}>{currentDay}</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.navButton, currentDayIndex === daysOfWeek.length - 1 && styles.disabledButton]} 
                        onPress={goToNextDay}
                        disabled={currentDayIndex === daysOfWeek.length - 1}
                    >
                        <Text style={styles.navButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
                
                
                <ScrollView style={styles.availabilityList}>
                    {dayAvailability.length > 0 ? (
                        dayAvailability.map((range) => (
                            <View key={range.id} style={styles.timeRangeCard}>
                                <Text style={styles.timeRangeText}>
                                    {formatTime(range.start)} - {formatTime(range.end)}
                                </Text>
                                <TouchableOpacity 
                                    style={styles.removeButton}
                                    onPress={() => removeTimeRange(range.id)}
                                >
                                    <Text style={styles.removeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No availability times added for {currentDay}</Text>
                        </View>
                    )}
                </ScrollView>
                
                
                <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={addAvailability}
                >
                    <Text style={styles.addButtonText}>+ Add Availability</Text>
                </TouchableOpacity>
            </View>
            
            
            {Platform.OS === 'android' && (
                <Modal
                    transparent={true}
                    visible={isTimePickerVisible}
                    animationType="fade"
                    onRequestClose={() => setTimePickerVisible(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setTimePickerVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>
                                        {isStartTime ? 'Select Start Time' : 'Select End Time'}
                                    </Text>
                                    
                                    <DateTimePicker
                                        value={selectedTime}
                                        mode="time"
                                        is24Hour={false}
                                        display="default"
                                        onChange={handleTimeChange}
                                        textColor="#000000" // Add text color for visibility
                                        minuteInterval={5}
                                        themeVariant='dark'
                                    />
                                    
                                    <View style={styles.modalButtonRow}>
                                        <TouchableOpacity 
                                            style={styles.modalButton}
                                            onPress={() => setTimePickerVisible(false)}
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
            
            
            {Platform.OS === 'ios' && (showIOSStartPicker || showIOSEndPicker) && (
                <Modal
                    transparent={true}
                    visible={showIOSStartPicker || showIOSEndPicker}
                    animationType="fade"
                >
                    <View style={styles.iosPickerOverlay}>
                        <View style={styles.iosPickerWrapper}>
                            <View style={styles.iosPickerHeader}>
                                <TouchableOpacity onPress={closeAllPickers} style={styles.iosPickerButton}>
                                    <Text style={styles.iosPickerCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                
                                <Text style={styles.iosPickerTitle}>
                                    {showIOSStartPicker ? 'Select Start Time' : 'Select End Time'}
                                </Text>
                                
                                <TouchableOpacity 
                                    onPress={showIOSStartPicker ? handleIOSStartConfirm : handleIOSEndConfirm}
                                    style={styles.iosPickerButton}
                                >
                                    <Text style={styles.iosPickerDoneText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.iosPickerContainer}>
                                <DateTimePicker
                                    value={selectedTime}
                                    mode="time"
                                    is24Hour={false}
                                    display="spinner"
                                    onChange={handleTimeChange}
                                    style={styles.iosPicker}
                                    textColor="#000000" 
                                    minuteInterval={5}
                                    themeVariant='dark'
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
    
            
            {!isAnyPickerVisible() && (
                <View style={styles.buttonRow}>
                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={() => navigation.navigate('GroupScreen')}
                    >
                        <Text style={styles.buttonText}>Skip this for now</Text>
                    </TouchableOpacity>
        
                    <TouchableOpacity 
                        style={styles.saveBtn} 
                        onPress={handleSave}
                    >
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