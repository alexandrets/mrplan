// src/screens/CalendarScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Icon from 'react-native-vector-icons/Feather';

const CalendarScreen = ({ onGoBack }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Comprobar si el usuario ya ha iniciado sesión al cargar la pantalla
  useEffect(() => {
    const checkCurrentUser = async () => {
      const currentUser = await GoogleSignin.getCurrentUser();
      setUserInfo(currentUser);
    };
    checkCurrentUser();
  }, []);


  const signIn = async () => {
    setIsSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();
      setUserInfo(user);
      Alert.alert("¡Sesión Iniciada!", `Conectado como ${user.user.email}`);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('El usuario canceló el inicio de sesión');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('El inicio de sesión ya está en progreso');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Los servicios de Google Play no están disponibles o actualizados.');
      } else {
        console.error(error);
        Alert.alert('Error', 'Ocurrió un error al iniciar sesión.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInfo(null); // Limpiamos la información del usuario
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Icon name="arrow-left" size={24} color="#2C3E50" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Icon name="calendar" size={60} color="#4A90E2" style={styles.calendarIcon} />
        <Text style={styles.title}>Calendario</Text>
        <Text style={styles.subtitle}>Conecta tu cuenta de Google para ver tus eventos y clases junto a tus tareas de Mr. Plan.</Text>

        {isSigningIn ? (
          <ActivityIndicator size="large" color="#4A90E2" />
        ) : !userInfo ? (
          <TouchableOpacity style={styles.button} onPress={signIn}>
            <Text style={styles.buttonText}>Conectar con Google Calendar</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.userInfoContainer}>
            <Text style={styles.connectedText}>Conectado como:</Text>
            <Text style={styles.emailText}>{userInfo.user.email}</Text>
            <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={signOut}>
              <Text style={styles.buttonText}>Desconectar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 50,
    left: 20,
    zIndex: 1,
  },
  backButton: {
    padding: 10,
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  calendarIcon: {
    marginBottom: 20,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#2C3E50', 
    marginBottom: 10 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#6c757d', 
    textAlign: 'center', 
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: { 
    backgroundColor: '#4A90E2', 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  userInfoContainer: { 
    alignItems: 'center' 
  },
  connectedText: {
    fontSize: 14,
    color: '#6c757d',
  },
  emailText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginVertical: 10,
    color: '#2C3E50'
  },
  signOutButton: { 
    backgroundColor: '#E74C3C', 
    marginTop: 20 
  },
});

export default CalendarScreen;