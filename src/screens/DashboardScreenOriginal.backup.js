import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.65;
const RADIUS = (CIRCLE_SIZE - 40) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DashboardScreenOriginal = ({ tasks = [], setTasks, onNavigateToGTD, onAddTask }) => {
  const { logout, user } = useAuth();
  
  // Obtener hora actual para el saludo
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calcular progreso de tareas de hoy
  const todayTasks = tasks.filter(task => task.section === 'today');
  const completedTasks = todayTasks.filter(task => task.completed);
  const progress = todayTasks.length > 0 ? completedTasks.length / todayTasks.length : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Toggle task completion
  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (!result.success) {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#5B9FE3', '#85C3FF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.subtitle}>Ready to tackle your day?</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.menuButton}>
              <Text style={styles.menuDots}>•••</Text>
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
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={20}
              />
              {/* Progress Circle */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={20}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
              />
            </Svg>
            
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressPercentage}>{Math.round(progress * 100)}%</Text>
              <Text style={styles.progressLabel}>Complete</Text>
            </View>
          </View>

          {/* Motivational Text */}
          <Text style={styles.motivationalText}>Keep it up! 💪</Text>

          {/* Today Section */}
          <View style={styles.todaySection}>
            <View style={styles.todaySectionHeader}>
              <Text style={styles.todayCount}>{todayTasks.length}</Text>
              <Text style={styles.todayLabel}>Today</Text>
            </View>

            {/* Task List */}
            <View style={styles.tasksList}>
              {todayTasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => toggleTask(task.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxCompleted]}>
                    {task.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
                    {task.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Navigation Bar to GTD */}
          <TouchableOpacity 
            style={styles.navigationBar}
            onPress={onNavigateToGTD}
            activeOpacity={0.7}
          >
            <View style={styles.navigationBarHandle} />
          </TouchableOpacity>

          {/* Add Quick Task Button */}
          <TouchableOpacity 
            style={styles.addTaskButton}
            onPress={onAddTask}
            activeOpacity={0.8}
          >
            <Text style={styles.addTaskButtonText}>+ Add Quick Task</Text>
          </TouchableOpacity>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 40,
  },
  greeting: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  menuButton: {
    padding: 10,
  },
  menuDots: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 60,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  motivationalText: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  todaySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  todaySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  todayCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 15,
  },
  todayLabel: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  tasksList: {
    gap: 15,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  taskCheckboxCompleted: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  checkmark: {
    color: '#5B9FE3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskText: {
    fontSize: 18,
    color: '#FFFFFF',
    flex: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  navigationBar: {
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  navigationBarHandle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  addTaskButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  addTaskButtonText: {
    color: '#5B9FE3',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default DashboardScreenOriginal;