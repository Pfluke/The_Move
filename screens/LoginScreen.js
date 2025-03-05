import React, { useState, useEffect } from 'react';
import { Button, View, TextInput,TouchableOpacity, Text, StyleSheet } from 'react-native';
import { io } from "socket.io-client";


const socket = io('http://localhost:3000');

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [groups] = useState('');
  const [errorMessage, setErrorMessage] = useState('');  // State for error notification
  const [loginMessage, setLoginMessage] = useState('');  // State for login success message

  // Listen for loginSuccess and loginFailure to handle navigation
  useEffect(() => {
    socket.on('loginSuccess', (message, groups) => {
      setLoginMessage(message); // Set login success message
      navigation.navigate('GroupScreen', { username, userGroups: groups });  // Pass username to Screen2
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
      setErrorMessage('PLEASE ENTER BOTH A USERNAME AND PASSWORD'); // Set error message if creation fails
    }
  };

  const handleCreate = () => {
    if (username && password) {
      socket.emit('create', username, password);
    } else {
      setErrorMessage('PLEASE ENTER BOTH A USERNAME AND PASSWORD'); // Set error message if creation fails
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleTransformContainer}>
        <Text style={styles.title}>THE  MOVE</Text>
      </View>
      <View style={styles.titleUnderline}></View>
      <Text style={styles.header}>...okay, but what is it??</Text>
      <View style={styles.loginTransformContainer}>
        <Text style={styles.login}>LOG IN</Text>
      </View>
      <View style={styles.loginUnderline}></View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="ENTER YOUR USERNAME"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="ENTER YOUR PASSWORD"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}>
        <Text style={styles.buttonText}>LOGIN</Text>
      </TouchableOpacity>

      <View style={styles.buttonSpacer}/>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreate}>
        <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
      </TouchableOpacity>
      {/* <Button title="Login" onPress={handleLogin} />
      <View style={styles.spacer} />
      <Button title="Create Account" onPress={handleCreate} /> */}

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
  login: {
    fontSize: 24,
    marginBottom: 13,
    paddingTop: 130,
    paddingBottom: 40,
    fontWeight: 'bold',
    color: 'black',
  },
  title: {
    fontSize: 45,
    fontWeight: 'bold',
    //color: '#4B0082',
    color: 'black',
    textAlign: 'center',
    width: '100%',
    paddingBottom: 15
  },
  header: {
    fontSize: 18,
    marginLeft: 170,
    marginTop: 10,
  },
  titleTransformContainer: {
    transform: [
      { scaleX: 0.9 },
      { scaleY: 2.8 }
    ],
    alignSelf: 'center',
  },
  loginTransformContainer: {
    transform: [
      { scaleX: 1.5 },
      { scaleY: 2.1 }
    ],
    alignSelf: 'center',
  },
  titleUnderline: {
    height: 5,
    width: '55%',
    backgroundColor: 'black',
  },
  loginUnderline: {
    height: 3,
    width: '30%',
    backgroundColor: 'black',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    borderWidth: 2,
    //borderColor: '#4B0082',
    borderColor: 'black',
    borderRadius: 5,
  },
  button: {
    //backgroundColor: '#4B0082',
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    paddingBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonSpacer: {
    height: 10,
  },
  successText: {
    marginTop: 10,
    color: 'green',
    fontSize: 16,
  },
  errorText: {
    marginTop: 0,
    marginBottom: 10,
    color: 'red',
    fontSize: 14,
  },
});

export default LoginScreen;
