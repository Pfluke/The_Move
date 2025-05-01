import React, { useState, useRef } from 'react';
import {
  View, TextInput, Text, StyleSheet, TouchableOpacity,
  Alert, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, SafeAreaView, StatusBar
} from 'react-native';
import {
  getFirestore, doc, getDoc, setDoc,
  collection, query, where, getDocs
} from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

const CreateAccountScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const passwordInputRef = useRef(null);

  const showError = msg => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 2000);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      return showError('PLEASE ENTER BOTH A USERNAME AND PASSWORD');
    }
    try {
      const userRef = doc(db, 'users', username.toLowerCase());
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return showError('User does not exist');
      }
      const data = userSnap.data();
      if (data.password !== password) {
        return showError('Incorrect password');
      }

      setLoginMessage('Login successful!');
      // fetch groups
      const groupsQuery = query(
        collection(db, 'groups'),
        where('members', 'array-contains', username.toLowerCase())
      );
      const groupsSnap = await getDocs(groupsQuery);
      const userGroups = [];
      groupsSnap.forEach(d => userGroups.push(d.id));

      navigation.navigate('GroupScreen', { username, userGroups });
    } catch (err) {
      console.error(err);
      showError(err.message);
    }
  };

  const handleCreate = async () => {
    if (!username || !password) {
      return showError('PLEASE ENTER BOTH A USERNAME AND PASSWORD');
    }
    try {
      const userRef = doc(db, 'users', username.toLowerCase());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return showError(`User '${username}' already exists.`);
      }
      // create with empty busyTimes
      await setDoc(userRef, {
        username: username.toLowerCase(),
        password,
        busyTimes: {}
      });
      setLoginMessage('Account created successfully!');
      navigation.navigate('InputSchedule', { username });
    } catch (err) {
      console.error(err);
      showError(err.message);
    }
  };

  const handleKeyPress = e => {
    if (e.nativeEvent.key === 'Enter') {
      Keyboard.dismiss();
      handleLogin();
    } else if (e.nativeEvent.key === 'Tab') {
      e.preventDefault();
      passwordInputRef.current.focus();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor:"black" }}>
        <StatusBar barStyle="black-content" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >

          <View style={styles.loginContainer}>
            <Text style={styles.login}>CREATE ACCOUNT</Text>
            <View style={styles.loginUnderline}/>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              returnKeyType="next"
              onKeyPress={handleKeyPress}
            />
            <TextInput
              style={styles.input}
              placeholder="password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              ref={passwordInputRef}
              onKeyPress={handleKeyPress}
            />

            <TouchableOpacity style={styles.button} onPress={handleCreate}>
              <Text style={styles.buttonText}>CREATE</Text>
            </TouchableOpacity>
            <View style={styles.buttonSpacer}/>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LoginScreen')}>
                <Text style={styles.buttonText}>BACK</Text>
            </TouchableOpacity>
            <View style={styles.buttonSpacer}/>
            {loginMessage ? <Text style={styles.successText}>{loginMessage}</Text> : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1, // Ensure the content grows to fill the available space
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    backgroundColor: 'black',
    flexDirection: 'column',
    width: '100%',
  },
  titleTransformContainer: {
    transform: [
      { scaleX: 0.9 },
      { scaleY: 2.8 },
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
    color: 'white',
  },
  headerContainer: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    marginBottom: 2,
    marginTop: 15,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 20,
    marginRight: 14,
  },
  textBubbleBig: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginRight: 10,
    marginTop: 2,
    width: 14,
  },
  textBubbleSmall: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    marginRight: 5,
    marginBottom: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
    width: 8,
  },
  titleUnderline: {
    height: 5,
    width: '50%',
    backgroundColor: 'white',
    marginTop: 75,
    alignSelf: 'center',
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
    color: '#018749',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    marginBottom: 10,
    color: '#FF0000',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CreateAccountScreen;