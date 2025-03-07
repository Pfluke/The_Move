import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}> What's...</Text>
      </View>
      <View style={styles.textBubbleBig}>
        <Text style={{ fontSize: 10 }}>       </Text>
      </View>
      <View style={styles.textBubbleSmall}>
        <Text style={{ fontSize: 8 }}>    </Text>
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
          onPress={() => navigation.navigate('LoginScreen')}
        >
          <Text style={styles.buttonText}>Let's Find Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 50,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: 'black',
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
    paddingHorizontal: 17,
    borderRadius: 20,
    alignSelf: 'flex-start',
    backgroundColor: "#007AFF",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 10,
    marginLeft: 20,
  },
  textBubbleBig: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginLeft: 17,
    marginTop: 3,
  },
  textBubbleSmall: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    marginLeft: 10,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  headerText: {
    fontSize: 30,
    color: "white",
  },
  title: {
    fontSize: 75,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    width: '100%',
    paddingBottom: 30,
  },
  titleTransformContainer: {
    transform: [{ scaleX: 0.9 }, { scaleY: 2.8 }],
    alignSelf: 'center',
  },
  underline: {
    height: 5,
    width: '85%',
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default WelcomeScreen;
