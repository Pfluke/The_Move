// App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screen components
import WelcomeScreen   from './screens/WelcomeScreen';
import LoginScreen     from './screens/LoginScreen';
import InputSchedule   from './screens/InputSchedule';   // added
import GroupScreen     from './screens/GroupScreen';
import EventScreen     from './screens/EventScreen';
import EventsOfWeek    from './screens/EventsOfWeek';
import EventCard       from './screens/EventCard';
import DayCalendar     from './screens/DayCalendar';
import Event           from './screens/Event';
import WheelOfFortune  from './screens/WheelOfFortune';
import CreateAccountScreen  from './screens/CreateAccountScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">
        {/* Welcome / Auth flow */}
        <Stack.Screen 
          name="WelcomeScreen" 
          component={WelcomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="LoginScreen" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
      

        {/* Busy‑time entry / editing */}
        <Stack.Screen 
          name="InputSchedule" 
          component={InputSchedule} 
          options={{ headerShown: false }} 
        />

        {/* Main app */}
        <Stack.Screen 
          name="GroupScreen" 
          component={GroupScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="EventScreen" 
          component={EventScreen} 
        />
        <Stack.Screen 
          name="EventsOfWeek" 
          component={EventsOfWeek} 
          options={{ headerShown: false }} 
        />
          <Stack.Screen 
          name="CreateAccountScreen" 
          component={CreateAccountScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="EventCard" 
          component={EventCard} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="DayCalendar" 
          component={DayCalendar} 
        />
        <Stack.Screen 
          name="Event" 
          component={Event} 
        />
        <Stack.Screen 
          name="WheelOfFortune" 
          component={WheelOfFortune} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
