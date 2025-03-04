import React, { useState, useEffect } from 'react';
import { Button, View, TextInput, Text, StyleSheet } from 'react-native';
import { io } from "socket.io-client";

const socket = io('http://localhost:3000');

const Screen1 = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [groups] = useState('');
  const [errorMessage, setErrorMessage] = useState('');  // State for error notification
  const [loginMessage, setLoginMessage] = useState('');  // State for login success message

  // Listen for loginSuccess and loginFailure to handle navigation
  useEffect(() => {
    socket.on('loginSuccess', (message, groups) => {
      setLoginMessage(message); // Set login success message
      navigation.navigate('Screen2', { username, userGroups: groups });  // Pass username to Screen2
    });

    socket.on('loginFailure', (message) => {
      setErrorMessage(message); // Set error message if login fails
    });

    socket.on('createSuccess', (message) => {
      setLoginMessage(message); // Set account creation success message
      navigation.navigate('Screen2', { username });  // Pass username to Screen2
    });

    socket.on('createUserFailure', (message) => {
      setErrorMessage(message); // Set error message if creation fails
    });


    return () => {
      // Cleanup the listeners when the component unmounts
      socket.off('loginSuccess');
      socket.off('loginFailure');
      socket.off('createSuccess');
      socket.off('createFailure');
    };
  }, [navigation, username]);

  const handleLogin = () => {
    if (username && password) {
      socket.emit('login', username, password);
    } else {
      setErrorMessage('Please enter both username and password'); // Set error message if creation fails
    }
  };

  const handleCreate = () => {
    if (username && password) {
      socket.emit('create', username, password);
    } else {
      setErrorMessage('Please enter both username and password'); // Set error message if creation fails
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Screen</Text>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />

      <Button title="Login" onPress={handleLogin} />
      <View style={styles.spacer} />
      <Button title="Create Account" onPress={handleCreate} />

      {/* Display login success or error messages inline */}
      {loginMessage ? <Text style={styles.successText}>{loginMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  spacer: {
    marginVertical: 10,
  },
  successText: {
    marginTop: 10,
    color: 'green',
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    color: 'red',
    fontSize: 14,
  },
});

export default Screen1;
