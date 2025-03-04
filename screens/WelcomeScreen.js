import React, { useState, useEffect } from 'react';
import { Button, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { io } from "socket.io-client";

const socket = io('http://localhost:3000');

const WelcomeScreen = ({ navigation }) => {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}> What's...</Text>
        </View>
        <View style={styles.innerContainer}>
          <View style={styles.titleContainer}>
            <View style={styles.titleTransformContainer}>
              <Text style={styles.title}>THE  MOVE</Text>
            </View>
            <View style={styles.underline}></View>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('LoginScreen')}>
            <Text style={styles.buttonText}>Let's Find Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      );
    };
    const styles = StyleSheet.create({
      outerContainer: {
        flex: 1,
        backgroundColor: 'white',
        paddingTop: 50,
      },
      innerContainer: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      },
      titleContainer: {
        alignItems: 'center',
        width: "100%",
        paddingBottom: 50,
      },
      headerContainer: {
        //backgroundColor: '#007AFF',
        paddingHorizontal: 17,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 0,
        paddingTop: 0
      },
      headerText: {
        fontSize: 35,
        color: "black",
        transform: [
          { scaleX: .8 },
          { scaleY: 1.2 }
        ],
        paddingTop: 18,
      },
      title: {
        fontSize: 75,
        fontWeight: 'bold',
        //color: '#4B0082',
        color: 'black',
        textAlign: 'center',
        width: '100%',
        paddingBottom: 30,
      },
      titleTransformContainer: {
        transform: [
          { scaleX: 0.9 },
          { scaleY: 2.8 }
        ],
        alignSelf: 'center',
      },
      underline: {
        height: 5,
        width: '85%',
        backgroundColor: 'black',
      },
      button: {
        backgroundColor: 'white',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        borderWidth: 2,
        //borderColor: '#4B0082',
        borderColor: 'black',
      },
      buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
      },
    });
    console.log('Title Style:', styles.title);
  

export default WelcomeScreen;