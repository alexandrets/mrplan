// src/screens/CalendarScreen.js

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {Calendar, LocaleConfig} from 'react-native-calendars';
import {Images} from '../assets/images';
import EventModal from '../components/Modals/EventModal';

const CalendarScreen = ({navigation}) => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '304281994978-20cr9pcv0367vvaak1f82u5cqvbq1am7.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
  }, []);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);

  // Uncomment this block if you want to check if the user is already signed in on load
  // useEffect(() => {
  //   const checkCurrentUser = async () => {
  //     try {
  //       const currentUser = await GoogleSignin.getCurrentUser();
  //       setUserInfo(currentUser);
  //     } catch (error) {
  //       console.log('Error checking current user:', error);
  //     }
  //   };
  //   checkCurrentUser();
  // }, []);

  // 308308
  // 304842

  const signIn = async () => {
    setIsSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      setUserInfo({...user, accessToken: tokens.accessToken});

      Alert.alert('Signed In!', `Connected as ${user?.data?.user?.email}`);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled sign-in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign-in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Error',
          'Google Play Services are not available or up-to-date.',
        );
      } else {
        console.error('Sign-in error:', error);
        Alert.alert('Error', 'An error occurred during sign-in.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInfo(null);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    if (!userInfo?.accessToken) {
      Alert.alert('Error', 'No access token found.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${userInfo?.accessToken}`,
          },
        },
      );

      const data = await response.json();

      if (data.error) {
        console.error('Google Calendar API error:', data.error);
        Alert.alert('Error', data.error.message);
        setLoading(false);
      } else {
        // console.log('Fetched events:', data.items);
        setEvents(data.items);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      Alert.alert('Error', 'Failed to fetch calendar events.');
    }
  };

  const getMarkedDates = events => {
    const markedDates = {};

    events.forEach(event => {
      const dateKey = event.start.dateTime.split('T')[0]; // e.g. "2025-06-26"

      markedDates[dateKey] = {
        marked: true,
        dotColor: '#4A90E2',
        activeOpacity: 0,
      };
    });

    return markedDates;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
            hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
            <Image source={Images.back} style={{height: 16, width: 16}} />
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={styles.title}>Calendar</Text>

          <Text style={styles.subtitle}>
            Connect your Google account to view your events and classes
            alongside your Mr. Plan tasks.
          </Text>

          {isSigningIn ? (
            <ActivityIndicator size="large" color="#4A90E2" />
          ) : !userInfo ? (
            <TouchableOpacity style={styles.button} onPress={signIn}>
              {loading ? (
                <ActivityIndicator size={'large'} />
              ) : (
                <Text style={styles.buttonText}>
                  Connect with Google Calendar
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.userInfoContainer}>
              <Text style={styles.connectedText}>Connected as:</Text>
              <Text style={styles.emailText}>
                {userInfo?.data?.user?.email}
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.signOutButton]}
                onPress={signOut}>
                <Text style={styles.buttonText}>Disconnect</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, {marginTop: 20}]}
                onPress={fetchCalendarEvents}>
                {loading ? (
                  <ActivityIndicator size={'large'} color={'white'} />
                ) : (
                  <Text style={styles.buttonText}>Fetch Calendar Events</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* {events.length > 0 && (
            <View style={{marginTop: 20, width: '100%'}}>
              <Text style={{fontWeight: 'bold', marginBottom: 10}}>
                Upcoming Events:
              </Text>
              {events.map(event => {
                const startTime = new Date(
                  event.start.dateTime,
                ).toLocaleString();
                const endTime = new Date(event.end.dateTime).toLocaleString();
                return (
                  <View key={event.id} style={styles.eventItem}>
                    <Text style={styles.eventTitle}>
                      {event.summary || 'No Title'}
                    </Text>
                    <Text style={styles.eventTime}>
                      {startTime} - {endTime}
                    </Text>
                  </View>
                );
              })}
            </View>
          )} */}
        </View>

        {userInfo?.data?.user && (
          <View style={styles.calenderComponent}>
            <Calendar
              markedDates={getMarkedDates(events)}
              onDayPress={day => {
                const selectedDate = day.dateString;
                const eventsForDate = events.filter(event =>
                  event.start.dateTime.startsWith(selectedDate),
                );

                if (eventsForDate.length === 0) {
                  Alert.alert('No Events', 'No events on this date.');
                } else {
                  setSelectedEvents(eventsForDate);
                  setModalVisible(true);
                }
              }}
              theme={{
                selectedDayBackgroundColor: '#4A90E2',
                todayTextColor: '#4A90E2',
                arrowColor: '#4A90E2',
                dotColor: '#4A90E2',
              }}
            />
          </View>
        )}
      </ScrollView>

      <EventModal
        isVisible={modalVisible}
        content={selectedEvents}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 35 : 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    padding: 12,
    borderRadius: 20,
  },
  content: {
    marginTop: 40,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  connectedText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#2C3E50',
  },
  signOutButton: {
    backgroundColor: '#E74C3C',
    marginTop: 20,
  },

  eventItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  calenderComponent: {
    paddingHorizontal: 12,
    marginBottom: 20,
  },
});

export default CalendarScreen;
