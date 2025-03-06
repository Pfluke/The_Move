import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../firebaseConfig'; // Adjust the import path as needed

const db = getFirestore(app);

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  // Handle login using Firestore
  const handleLogin = async () => {
    if (username && password) {
      try {
        const userDocRef = doc(db, "users", username.toLowerCase());
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.password === password) {
            setLoginMessage("Login successful!");

            // fetch groups where the user is a member
            const groupsQuery = query(
              collection(db, "groups"),
              where("members", "array-contains", username.toLowerCase())
            );
            const groupsSnapshot = await getDocs(groupsQuery);
            const userGroups = [];
            groupsSnapshot.forEach((docSnap) => {
              userGroups.push(docSnap.id);
            });

            navigation.navigate('GroupScreen', { username, userGroups });
          } else {
            setErrorMessage("Incorrect password");
          }
        } else {
          setErrorMessage("User does not exist");
        }
      } catch (error) {
        console.error("Error during login", error);
        setErrorMessage(error.message);
      }
    } else {
      setErrorMessage("PLEASE ENTER BOTH A USERNAME AND PASSWORD");
    }
  };

  // Handle account creation using Firestore
  const handleCreate = async () => {
    if (username && password) {
      try {
        const userDocRef = doc(db, "users", username.toLowerCase());
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setErrorMessage(`User '${username}' already exists.`);
        } else {
          await setDoc(userDocRef, { username: username.toLowerCase(), password });
          setLoginMessage("Account created successfully!");
          navigation.navigate('GroupScreen', { username, userGroups: [] });
        }
      } catch (error) {
        console.error("Error creating account", error);
        setErrorMessage(error.message);
      }
    } else {
      setErrorMessage("PLEASE ENTER BOTH A USERNAME AND PASSWORD");
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
        <View style={styles.headerContainer}>
          <Text style={styles.header}>...okay, but what is it??</Text>
        </View>
        <View style={styles.textBubbleBig}>
          <Text style={{ fontSize: 12 }}>       </Text>
        </View>
        <View style={styles.textBubbleSmall}>
          <Text style={{ fontSize: 10 }}>    </Text>
        </View>
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
    color: 'white',
  },
  headerContainer: {
    backgroundColor: "#007AFF",
    marginLeft: 150,
    marginBottom: 4,
    marginTop: 15,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 20,
  },
  textBubbleBig: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    marginLeft: 330,
  },
  textBubbleSmall: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    marginTop: 0,
    marginLeft: 360,
    marginBottom: 10,
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
