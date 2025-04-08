import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView ,StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const EventsOfWeek = ({ route }) => {
    const { username, groupName, initialEventData } = route.params;
    const [loadingEventData, setLoadingEventData] = useState(false);
    const [eventData, setEventData] = useState(initialEventData)

    useEffect(() => {
        //Case for when the EventData weren't passed through.
        if (!eventData) {
            setLoadingEventData(true);
        } else {
            setLoadingEventData(false);
        }
    }, [eventData]);

    if (loadingEventData) {
        return <Text>Loading events...</Text>;
    }

    const getUserVote = (sliceName) => {
        const sliceData = eventData[sliceName] || {};
        return sliceData.voters ? sliceData.voters[username] : 0;
    };

    const getEventWithMostVotes = () => { 
        let maxVotes = -1;
        let eventWithMostVotes = null;
    
        Object.entries(eventData).forEach(([sliceName, sliceData]) => {
            if (sliceData.votes > maxVotes) {
                maxVotes = sliceData.votes;
                eventWithMostVotes = sliceName;
            }
        });
    
        return eventWithMostVotes;
    };

    const eventWithMostVotes = getEventWithMostVotes();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor:"white" }}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
        </KeyboardAvoidingView>
        <Text style={styles.subtitle}>All Events</Text>
        {eventData && Object.keys(eventData).length === 0 ? (
            <Text style={styles.noEventsText}>No events scheduled yet. </Text>
        ) : (
            <View style={styles.EventDataList}>
                {Object.entries(eventData)
                    .sort(([, a], [, b]) => (b.votes || 0) - (a.votes || 0))
                    .map(([slice, data]) => {
                    const userVote = getUserVote(slice);  
                    return (
                        <View key={slice} style={styles.cardContainer}>
                        
                            {/* Card Header with Title, Checkmark, and Voting Buttons */}
                            <View style={styles.cardHeader}>
                                <View style={styles.cardTitleContainer}>
                                    <Text style={styles.cardTitle}>
                                        {slice}
                                    </Text>
                                    {slice === eventWithMostVotes && (
                                        <Text style={styles.checkmark}>
                                            ✅
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.voteContainer}>
                                        <Text style={styles.voteCount}>
                                            {data.votes || 0}
                                        </Text>
                                </View>
                            </View>
            
                            {/* Card Content */}
                            <View style={styles.cardContent}>
                                {data.imageUri && (
                                    <Image 
                                        source={{ uri: data.imageUri }}
                                        style={styles.cardImage}
                                    />
                                )}
                                <Text style={styles.cardDetails}>
                                    {data.days ? data.days.join(', ') : 'No day assigned'} | {data.startTime} - {data.endTime}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
        textAlign: 'center',
      },
      EventDataList: {
        width: '100%',
        padding: 10,
      },
      cardContainer: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        padding: 10,
      },
      cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
      },
      cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
      },
      checkmark: {
        marginLeft: 5,
      },
      cardContent: {
        marginBottom: 5,
      },
      cardImage: {
        width: '100%',
        height: 150,
        borderRadius: 5,
        marginBottom: 10,
      },
      cardDetails: {
        fontSize: 14,
        color: '#666',
      },
      voteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      voteButton: {
        padding: 5,
        borderRadius: 20,
        marginHorizontal: 5,
      },
      votedUp: {
        backgroundColor: '#E8F5E9',
      },
      votedDown: {
        backgroundColor: '#FFEBEE',
      },
      voteCount: {
        fontSize: 16,
        color: '#000',
        marginHorizontal: 10,
      },
});

export default EventsOfWeek;