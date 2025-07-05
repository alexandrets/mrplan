import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainAppScreen from '../screens/MainAppScreen';
import CalendarScreen from '../screens/CalendarScreen';


const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="MainApp" component={MainAppScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
    </Stack.Navigator>
  );
};

export default MainStack;
