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
      handleCreate();
    } else if (e.nativeEvent.key === 'Tab') {
      e.preventDefault();
      passwordInputRef.current.focus();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>THE MOVE</Text>
            <View style={styles.headerUnderline} />
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>CREATE ACCOUNT</Text>
            <View style={styles.sectionUnderline}/>
            
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {loginMessage ? <Text style={styles.successText}>{loginMessage}</Text> : null}

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

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleCreate}
            >
              <Text style={styles.buttonText}>CREATE</Text>
            </TouchableOpacity>
            
            <View style={styles.buttonSpacer}/>
            
            <TouchableOpacity 
              style={styles.button} 
              // onPress={() => navigation.navigate('LoginScreen')}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>BACK</Text>
            </TouchableOpacity>
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 20,
    paddingTop: 15,
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 50,
    fontWeight: '800',
    color: '#000000',
    textTransform: 'uppercase',
  },
  headerUnderline: {
    height: 4,
    width: '40%',
    backgroundColor: 'black',
    marginTop: 8,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  sectionUnderline: {
    height: 3,
    width: '75%',
    backgroundColor: '#000000',
    marginBottom: 20,
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
    marginBottom: 10,
    color: '#018749',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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