import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AuthStack from './AuthStack';
import MainStack from './MainStack';
import CalendarScreen from '../screens/CalendarScreen';

const Stack = createNativeStackNavigator();

const RootNavigation = () => {
  return (
    <Stack.Navigator
     >
        <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
      {/* <Stack.Screen name="MainStack" component={MainStack} />`
      <Stack.Screen name="AuthStack" component={AuthStack} /> */}
    </Stack.Navigator>
  );
};

export default RootNavigation;
