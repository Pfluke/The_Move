import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screen components
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import GroupScreen from './screens/GroupScreen';
import EventScreen from './screens/EventScreen';
import AddSliceScreen from './screens/AddSliceScreen';
import DayCalendar from './screens/DayCalendar';
import Event from './screens/Event';
import WheelOfFortune from './screens/WheelOfFortune';
import EventsOfWeek from './screens/EventsOfWeek';

// Stack navigator setup
const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} options={{headerShown: false}}/>
        <Stack.Screen name="LoginScreen" component={LoginScreen}  
        options={{
          headerShown: false,
          //Used to remove navigation back to welcome page. It is unnecessary.
          //headerLeft: () => null
        }} />
        <Stack.Screen name="GroupScreen" component={GroupScreen}
        options={{
          headerShown: false, 
        }} />
        <Stack.Screen name="EventScreen" component={EventScreen} />
        <Stack.Screen name="EventsOfWeek" component={EventsOfWeek} />
        <Stack.Screen name="AddSliceScreen" component={AddSliceScreen} />
        <Stack.Screen name="DayCalendar" component={DayCalendar} />
        <Stack.Screen name="Event" component={Event} />
        <Stack.Screen name="WheelOfFortune" component={WheelOfFortune} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
