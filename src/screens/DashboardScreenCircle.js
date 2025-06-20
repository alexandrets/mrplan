import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.7;
const RADIUS = (CIRCLE_SIZE - 30) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DashboardScreenCircle = ({ tasks = [], onNavigateToGTD }) => {
  const { logout, user } = useAuth();
  
  // Calcular progreso de tareas de hoy
  const todayTasks = tasks.filter(task => task.section === 'today');
  const completedTasks = todayTasks.filter(task => task.completed);
  const progress = todayTasks.length > 0 ? completedTasks.length / todayTasks.length : 0;

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      Alert.alert('Error', result.error);
    }
  };

  // Contar tareas no completadas por sección
  const countTasks = (section) => {
    return tasks.filter(t => t.section === section && !t.completed).length;
  };

  return (
    <LinearGradient
      colors={['#4A90E2', '#7B68EE']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.title}>{user?.displayName || user?.email?.split('@')[0] || 'Student'}!</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Circle */}
        <View style={styles.progressContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Background Circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={20}
            />
            {/* Progress Circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="#FFD700"
              strokeWidth={20}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
          </Svg>
          
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressPercentage}>{Math.round(progress * 100)}%</Text>
            <Text style={styles.progressLabel}>Today's Progress</Text>
            <Text style={styles.taskCount}>
              {completedTasks.length} of {todayTasks.length} tasks
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: 'rgba(255, 99, 71, 0.2)' }]}>
            <Text style={styles.statNumber}>{countTasks('today')}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(255, 165, 0, 0.2)' }]}>
            <Text style={styles.statNumber}>{countTasks('next')}</Text>
            <Text style={styles.statLabel}>Next</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(144, 238, 144, 0.2)' }]}>
            <Text style={styles.statNumber}>{countTasks('inbox')}</Text>
            <Text style={styles.statLabel}>Inbox</Text>
          </View>
        </View>

        {/* Navigate to GTD Button */}
        <TouchableOpacity 
          style={styles.gtdButton}
          onPress={onNavigateToGTD}
          activeOpacity={0.8}
        >
          <Text style={styles.gtdButtonText}>📝 Open GTD View</Text>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <Text style={styles.quickStatText}>
            Total pending: {tasks.filter(t => !t.completed).length} tasks
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    marginTop: 10,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
  },
  taskCount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 20,
    minWidth: 100,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
    fontWeight: '600',
  },
  gtdButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  gtdButtonText: {
    color: '#4A90E2',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickStats: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  quickStatText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});

export default DashboardScreenCircle;