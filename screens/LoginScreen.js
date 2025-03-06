import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { io } from "socket.io-client";

const socket = io('http://localhost:3000');

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  useEffect(() => {
    // Listen for login success
    socket.on('loginSuccess', (message, groups) => { // have to implement backend first for
      setLoginMessage(message);
      // Navigate to GroupScreen with username and userGroups
      navigation.navigate('GroupScreen', { username, userGroups: groups });
    });

    // Listen for login failure
    socket.on('loginFailure', (message) => {
      setErrorMessage(message);
    });

    // Listen for account creation success
    socket.on('createSuccess', (message, groups) => {
      setLoginMessage(message);
      // Navigate to GroupScreen with username and userGroups
      navigation.navigate('GroupScreen', { username, userGroups: groups });
    });

    // Listen for account creation failure
    socket.on('createUserFailure', (message) => {
      setErrorMessage(message);
      Alert.alert('Error', message);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('loginSuccess');
      socket.off('loginFailure');
      socket.off('createSuccess');
      socket.off('createUserFailure');
    };
  }, [navigation, username]);

  const handleLogin = () => {
    if (username && password) {
      socket.emit('login', username, password);
    } else {
      setErrorMessage('PLEASE ENTER BOTH A USERNAME AND PASSWORD');
    }
  };

  const handleCreate = () => {
    if (username && password) {
      // Emit the 'create' event to the backend
      socket.emit('create', username, password);
    } else {
      setErrorMessage('PLEASE ENTER BOTH A USERNAME AND PASSWORD');
    }
  };

  return (
    <View style={styles.container}>
      {/* Title Section */}
      <View style={styles.titleContainer}>
        <View style={styles.titleTransformContainer}>
          <Text style={styles.title}>THE MOVE</Text>
        </View>
        <View style={styles.titleUnderline}/>
        <Text style={styles.header}>...okay, but what is it??</Text>
      </View>
      
      
      {/* Login Section */}
      <View style={styles.loginContainer}>
        <Text style={styles.login}>LOG IN</Text>
        <View style={styles.loginUnderline}></View>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        {/* Create Account Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleCreate}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
        </TouchableOpacity>

        <View style={styles.buttonSpacer} />

        {/* Login Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        {loginMessage ? <Text style={styles.successText}>{loginMessage}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    alignItems: 'center',
    backgroundColor: 'black',
    flexDirection: 'column',
    width: '100%',
    paddingTop: 40,
  },
  titleTransformContainer: {
    transform: [
      { scaleX: 0.9 },
      { scaleY: 2.8 }
    ],
  },
  title: {
    fontSize: 55,
    marginTop: 45,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    width: '100%',
  },
  header: {
    fontSize: 18,
    marginLeft: 170,
    marginTop: 15,
    color: 'white',
    marginBottom: 40,
  },
  titleUnderline: {
    height: 5,
    width: '50%',
    backgroundColor: 'white',
    marginTop: 75,
  },
  loginContainer: {
    width: '100%',
    marginBottom: 50,
    marginTop: 115,
    padding: 20,
  },
  login: {
    fontSize: 24,
    paddingTop: 20,
    paddingBottom: 5,
    fontWeight: 'bold',
    color: '#000000',
  },
  loginUnderline: {
    height: 3,
    width: '30%',
    backgroundColor: '#000000',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonSpacer: {
    height: 10,
  },
  successText: {
    marginTop: 10,
    color: '#00FF00',
    fontSize: 16,
  },
  errorText: {
    marginBottom: 10,
    color: '#FF0000',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LoginScreen;