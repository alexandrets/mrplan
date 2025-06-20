// src/screens/DashboardScreenOriginal.js

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
  Pressable,
  Vibration,
  Animated, // <-- LA IMPORTACIÓN QUE FALTABA
} from 'react-native';
import Reanimated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';
import Sound from 'react-native-sound';

import DynamicCalendarIcon from '../components/common/DynamicCalendarIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.65;
const RADIUS = (CIRCLE_SIZE - 40) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

const WORK_TIME = 60; 
const BREAK_TIME = 10;

Sound.setCategory('Playback');

const DashboardScreenOriginal = ({ tasks = [], onNavigateToGTD, onAddTask, onToggleTask, onNavigateToCalendar }) => {
  const { logout } = useAuth();
  
  const todayTasks = tasks.filter(task => task.section === 'today');
  const completedTodayTasks = todayTasks.filter(task => task.completed && task.section === 'today');
  const progress = todayTasks.length > 0 ? completedTodayTasks.length / todayTasks.length : 0;
  
  const percentageText = `${Math.round(progress * 100)}%`;

  const [isPomodoroMode, setIsPomodoroMode] = useState(false);
  const [timerMode, setTimerMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const intervalRef = useRef(null);
  
  const [motivationalText, setMotivationalText] = useState('');
  const motivationalTextOpacity = useSharedValue(0);
  const progressAnimation = useSharedValue(0);

  const getMotivationalMessage = () => {
    const totalCount = todayTasks.length;
    const completedCount = completedTodayTasks.length;
    if (totalCount === 0) return "¡Añade tu primera tarea del día!";
    if (completedCount === 0) return "¡Un gran día empieza con un pequeño paso!";
    if (completedCount > 0 && completedCount === totalCount) return "¡Has completado todo por hoy! 🎉";
    if (completedCount >= 3) return "¡Impresionante! Estás en racha. 🔥";
    if (completedCount > 0) return "¡Sigue así, vas por buen camino! 👍";
    return "¡Tú puedes con esto!";
  };

  useEffect(() => {
    progressAnimation.value = withTiming(progress, { duration: 800, easing: Easing.out(Easing.exp) });
  }, [progress]);
  
  useEffect(() => {
    const newMessage = getMotivationalMessage();
    const updateTextOnJSThread = () => setMotivationalText(newMessage);
    if (newMessage !== motivationalText) {
      motivationalTextOpacity.value = withTiming(0, { duration: 200 }, (isFinished) => {
        if (isFinished) runOnJS(updateTextOnJSThread)();
      });
    }
  }, [completedTodayTasks.length, todayTasks.length]);

  useEffect(() => {
    if (motivationalText) {
      motivationalTextOpacity.value = withTiming(1, { duration: 350, delay: 50 });
    }
  }, [motivationalText]);
  
  const playSound = () => { /* Implement sound logic if needed */ };
  
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(intervalRef.current);
      Vibration.vibrate(1000);
      playSound();
      const nextMode = timerMode === 'work' ? 'break' : 'work';
      const nextTime = nextMode === 'work' ? WORK_TIME : BREAK_TIME;
      setTimerMode(nextMode);
      setTimeLeft(nextTime);
      setIsTimerActive(false);
      Alert.alert(
        nextMode === 'work' ? "¡A trabajar!" : "¡Tiempo de descanso!",
        nextMode === 'work' ? "Comienza un nuevo ciclo de enfoque." : "Tómate 5 minutos para recargar energías."
      );
    }
    return () => clearInterval(intervalRef.current);
  }, [isTimerActive, timeLeft, timerMode]);
  
  const togglePomodoroMode = () => {
    const newIsPomodoro = !isPomodoroMode;
    if (newIsPomodoro) {
        setIsTimerActive(false);
        setTimerMode('work');
        setTimeLeft(WORK_TIME);
    }
    setIsPomodoroMode(newIsPomodoro);
  };
  
  const toggleTimer = () => setIsTimerActive(!isTimerActive);
  const resetTimer = () => { setTimeLeft(timerMode === 'work' ? WORK_TIME : BREAK_TIME); setIsTimerActive(false); };
  const formatTime = (seconds) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; };
  const handleLogout = async () => { try { await logout(); } catch (e) { Alert.alert('Error', 'No se pudo cerrar sesión.'); } };
  const sortedTodayTasks = [...todayTasks].sort((a, b) => a.completed - b.completed);

  const animatedProgressProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progressAnimation.value),
  }));

  const totalTime = timerMode === 'work' ? WORK_TIME : BREAK_TIME;
  const pomodoroProgress = timeLeft / totalTime;
  const pomodoroStrokeDashoffset = CIRCUMFERENCE * (1 - pomodoroProgress);

  const motivationalTextStyle = useAnimatedStyle(() => ({
    opacity: motivationalTextOpacity.value,
  }));

  return (
    <LinearGradient colors={['#5B9FE3', '#85C3FF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={{ flex: 1 }} /> 
            <TouchableOpacity onPress={handleLogout} style={styles.menuButton}>
              <Text style={styles.menuDots}>•••</Text>
            </TouchableOpacity>
          </View>

          <Pressable onLongPress={togglePomodoroMode} delayLongPress={800}>
            <View style={styles.progressContainer}>
              <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{transform: [{ rotate: '-90deg' }]}}>
                <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth={20} />
                {!isPomodoroMode ? (
                  <AnimatedCircle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} fill="none" stroke="#FFFFFF" strokeWidth={20} strokeDasharray={CIRCUMFERENCE} strokeLinecap="round" animatedProps={animatedProgressProps} />
                ) : (
                  <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} fill="none" stroke="#FFFFFF" strokeWidth={20} strokeDasharray={CIRCUMFERENCE} strokeLinecap="round" strokeDashoffset={pomodoroStrokeDashoffset} transform={`translate(0, ${CIRCLE_SIZE}) scale(1, -1)`} />
                )}
              </Svg>
              <View style={styles.progressTextContainer}>
                  {!isPomodoroMode ? (
                    <>
                      <Text style={styles.progressPercentage}>{percentageText}</Text>
                      <Text style={styles.progressLabel}>Complete</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                      <Text style={styles.timerLabel}>{timerMode === 'work' ? 'Enfoque' : 'Descanso'}</Text>
                    </>
                  )}
              </View>
            </View>
          </Pressable>

          {isPomodoroMode ? (
            <View style={styles.pomodoroControls}>
              <TouchableOpacity style={styles.controlButton} onPress={toggleTimer}><Icon name={isTimerActive ? 'pause' : 'play'} size={24} color="#FFF" /></TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={resetTimer}><Icon name="rotate-cw" size={24} color="#FFF" /></TouchableOpacity>
            </View>
          ) : (
             <Reanimated.View style={motivationalTextStyle}>
                <Text style={styles.motivationalText}>{motivationalText}</Text>
             </Reanimated.View>
          )}

          <View style={styles.todaySection}>
             <View style={styles.todaySectionHeader}>
              <DynamicCalendarIcon onPress={onNavigateToCalendar} />
              <Text style={styles.todayLabel}>Today</Text>
            </View>
            <View style={styles.tasksList}>
              {sortedTodayTasks.length > 0 ? (
                sortedTodayTasks.map(task => (
                  <TouchableOpacity key={task.id} style={styles.taskItem} onPress={() => onToggleTask(task.id, task.completed)} activeOpacity={0.7}>
                    <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxCompleted]}>
                      {task.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>{task.title}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noTasksText}>No hay tareas para hoy.</Text>
              )}
            </View>
          </View>
        </ScrollView>
        <View style={styles.fixedFooter}>
          <TouchableOpacity style={styles.navigationBar} onPress={onNavigateToGTD} activeOpacity={0.7}>
            <View style={styles.navigationBarHandle} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addTaskButton} onPress={onAddTask} activeOpacity={0.8}>
            <Text style={styles.addTaskButtonText}>+ Add Quick Task</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 30, paddingTop: 5, paddingBottom: 150 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 0, height: 40 },
  menuButton: { padding: 10 },
  menuDots: { fontSize: 24, color: '#FFFFFF', fontWeight: 'bold', letterSpacing: 2 },
  progressContainer: { alignItems: 'center', marginBottom: 10 },
  progressTextContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  progressPercentage: { fontSize: 60, fontWeight: '300', color: '#FFFFFF', textAlign: 'center' },
  progressLabel: { fontSize: 20, color: 'rgba(255, 255, 255, 0.8)', marginTop: 5 },
  timerText: { fontSize: 60, fontWeight: '300', color: '#FFFFFF', textAlign: 'center' },
  timerLabel: { fontSize: 20, color: 'rgba(255, 255, 255, 0.8)', marginTop: 5, textTransform: 'uppercase', letterSpacing: 2 },
  pomodoroControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40, marginVertical: 10, minHeight: 60, },
  controlButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  motivationalText: { fontSize: 17, fontWeight: '500', color: '#FFFFFF', textAlign: 'center', marginBottom: 15, minHeight: 60, paddingHorizontal: 10, },
  todaySection: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 20, padding: 20, marginBottom: 10 },
  todaySectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  todayLabel: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginLeft: 15 },
  tasksList: { gap: 15 },
  taskItem: { flexDirection: 'row', alignItems: 'center' },
  taskCheckbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#FFFFFF', marginRight: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  taskCheckboxCompleted: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  checkmark: { color: '#5B9FE3', fontSize: 16, fontWeight: 'bold' },
  taskText: { fontSize: 18, color: '#FFFFFF', flex: 1 },
  taskTextCompleted: { textDecorationLine: 'line-through', opacity: 0.6 },
  noTasksText: { color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontStyle: 'italic', paddingVertical: 20 },
  fixedFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 30, paddingBottom: 20, backgroundColor: 'transparent' },
  navigationBar: { alignItems: 'center', paddingVertical: 10, marginBottom: 5 },
  navigationBarHandle: { width: 50, height: 5, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  addTaskButton: { backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
  addTaskButtonText: { color: '#5B9FE3', fontSize: 18, fontWeight: '600' },
});

export default DashboardScreenOriginal;