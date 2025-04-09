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
        <View style={{ flex: 1, backgroundColor:"black" }}>
            <StatusBar barStyle="light-content" backgroundColor="black" />
            
            <View style={styles.titleContainer}>
                <Text style={styles.title}>TOP EVENTS OF THE WEEK</Text>
            </View>
            
            <SafeAreaView style={{ flex: 1}}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, backgroundColor: 'white' }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <ScrollView // wrap the content in a scroll view
                        contentContainerStyle={styles.scrollContainer} // Ensure the content is scrollable
                        keyboardShouldPersistTaps="handled" // Allow taps to dismiss the keyboard
                    >      
                        {eventData && Object.keys(eventData).length === 0 ? (
                            <Text style={styles.noEventsText}>NO EVENTS CURRENTLY SCHEDULED </Text>
                        ) : (
                            <View style={styles.EventDataList}>
                                {Object.entries(eventData)
                                    .sort(([, a], [, b]) => (b.votes || 0) - (a.votes || 0))
                                    .map(([slice, data]) => {
                                    const userVote = getUserVote(slice);  

                                    // Determine card background color based on conditions
                                    const isTopEvent = slice === eventWithMostVotes;
                                    const hasPositiveVotes = data.votes > 0;
                                    const hasNegativeVotes = data.votes < 0;
                                    
                                    let cardBackgroundColor;
                                    if (isTopEvent) {
                                        cardBackgroundColor = '#FFD700'; // gold for top event
                                    } else if (hasPositiveVotes) {
                                        cardBackgroundColor = '#d4f7d4'; // light green for positive votes
                                    } else if (hasNegativeVotes) {
                                        cardBackgroundColor = '#ffdddd'; // light red for negative votes
                                    } else {
                                        cardBackgroundColor = '#FFF'; // default white for zero votes
                                    }

                                    return (
                                        <View key={slice} style={[styles.cardContainer, {backgroundColor: cardBackgroundColor}]}>
                                            <View style={styles.cardContentRow}>
                                                {/* Left Column: Event Title and Details */}
                                                <View style={styles.eventDetailsColumn}>
                                                    <Text style={styles.cardTitle}>
                                                        {slice}
                                                    </Text>

                                                    {/* Event Image */}
                                                    {data.imageUri && (
                                                        <Image source={{ uri: data.imageUri }} style={styles.cardImage} />
                                                    )}

                                                    {/* Event Days and Time */}
                                                    <Text style={styles.cardDetails}>
                                                        {data.days ? data.days.join(', ') : 'No day assigned'} | {data.startTime} - {data.endTime}
                                                    </Text>
                                                </View>

                                                {/* Right Column: Vote Count */}
                                                <View style={ styles.voteColumn }>
                                                    <Text style={styles.voteCount}>
                                                        {data.votes || 0}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                        </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1, // Ensure the content grows to fill the available space
        alignItems: 'center',
    },
    titleContainer: {
        alignItems: 'center',
        backgroundColor: 'black',
        width: '100%',
        height: 120,
        paddingTop: 60
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginVertical: 10,
        textAlign: 'center',
        color: 'white',
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
        shadowOpacity: 0.3,
        shadowRadius: 4,
        padding: 10,
        flexDirection: 'column',
    },
    cardHeader: {
        justifyContent: 'space-between',
        alignSelf: 'center',
        marginBottom: 8,
    },
    cardContentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    eventDetailsColumn: {
        flex: 3,
        paddingLeft: 10,
    },
    voteColumn: {
        alignItems: 'center',
    },
// Container to add black circles around number, cannot fit to all numbers
//   voteCountContainer: {
//     borderRadius: 50,
//     paddingHorizontal: 6,
//     backgroundColor: 'black',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 4,
//   },
    voteCount: {
        fontSize: 32,
        color: 'black',
        fontWeight: 'bold',
        marginRight: 12,
        marginTop: 4,
    },
    cardTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    checkmark: {
        marginLeft: 5,
    },
    cardContent: {
        marginBottom: 5,
        alignSelf: 'center',
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
});

export default EventsOfWeek;