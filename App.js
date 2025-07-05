import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
// DraxProvider removed for compatibility

// Import Auth Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Import Screens
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import MainAppScreen from './src/screens/MainAppScreen_GTD';
import CalendarScreen from './src/screens/CalendarScreen';

// Simple Navigator Component
const AppNavigator = () => {
  const { user, initializing } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('Welcome');

  // Mock navigation object for screens
  const navigation = {
    navigate: (screenName) => setCurrentScreen(screenName),
  };

  // Show loading screen while checking auth state
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Cargando MrPlan...</Text>
      </View>
    );
  }

  // If user is authenticated, show main app
  if (user) {
    return <MainAppScreen />;
  }

  // If not authenticated, show auth flow based on current screen
  switch (currentScreen) {
    case 'CalendarScreen':
      return <CalendarScreen navigation={navigation} />;
    case 'Login':
      return <LoginScreen navigation={navigation} />;
    case 'Register':
      return <RegisterScreen navigation={navigation} />;
    default:
      return <WelcomeScreen navigation={navigation} />;
  }
};

// Main App Component
const App = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});

export default App;