import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  Animated,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  Easing
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import DashboardScreenOriginal from './DashboardScreenOriginal';
import ProjectsScreen from './ProjectsScreen';
import CalendarScreen from './CalendarScreen';
import { 
  subscribeToUserTasks,
  subscribeToUserProjects,
  updateTask 
} from '../services/firebaseService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.95;

const sectionEmojis = {
  inbox: '📥',
  today: '🗓️',
  next: '➡️',
  someday: '📦'
};

const MainAppScreen = () => {
  console.log('🎯 MAINAPPSCREEN COMPLETO CARGADO!');
  
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isDraggingAnyTask, setIsDraggingAnyTask] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [sectionLayouts, setSectionLayouts] = useState({});

  const translateX = useSharedValue(0); 
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (user) {
      const unsubTasks = subscribeToUserTasks(user.uid, setTasks);
      const unsubProjects = subscribeToUserProjects(user.uid, setProjects);
      return () => {
        unsubTasks();
        unsubProjects();
      };
    }
  }, [user]);

  const openDrawer = () => {
    translateX.value = withSpring(-DRAWER_WIDTH, { damping: 18 });
  };
  
  const closeDrawer = () => {
    translateX.value = withSpring(0, { damping: 18 });
  };

  const mainContainerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    borderRadius: interpolate(translateX.value, [-DRAWER_WIDTH, 0], [20, 0], Extrapolate.CLAMP),
  }));

  const dashboardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  
  const navigateToGTD = () => {
    translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 350, easing: Easing.out(Easing.ease) });
  };
  
  const navigateToDashboard = () => {
    translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) });
  };
  
  const handleNavigateToCalendar = () => {
    setShowCalendar(true);
  };
  
  const handleCloseCalendar = () => {
    setShowCalendar(false);
  };

  const moveTaskToSection = (taskId, fromSection, toSection) => {
    console.log('🔄 moveTaskToSection llamado:', { taskId, fromSection, toSection });
    if (fromSection !== toSection) {
      console.log('💾 Actualizando tarea en Firebase...');
      updateTask(taskId, { section: toSection });
    }
  };

  const getTasks = (section) => {
    return tasks.filter(task => task.section === section && !task.completed);
  };

  const TaskWithMoveButtons = ({ task, section }) => {
    const [showMoveButtons, setShowMoveButtons] = useState(false);

    const handleMovePress = () => {
      console.log('🔴 MOVE BUTTON presionado para:', task.title);
      console.log('📱 Estado actual showMoveButtons:', showMoveButtons);
      Alert.alert('Botón presionado', `Moviendo tarea: ${task.title}`);
      setShowMoveButtons(!showMoveButtons);
    };

    const handleMoveTo = (targetSection) => {
      console.log('📤 Moviendo de', section, 'a', targetSection);
      moveTaskToSection(task.id, section, targetSection);
      setShowMoveButtons(false);
    };

    const sections = [
      { key: 'inbox', name: 'Inbox', emoji: '📥' },
      { key: 'today', name: 'Today', emoji: '🗓️' },
      { key: 'next', name: 'Next', emoji: '➡️' },
      { key: 'someday', name: 'Someday', emoji: '📦' }
    ];

    return (
      <View style={styles.taskItem}>
        <View style={styles.taskContent}>
          <View style={styles.taskTextContainer}>
            <Text style={styles.taskText}>{task.title}</Text>
          </View>
          <TouchableOpacity 
            style={styles.moveButton}
            onPress={handleMovePress}
            activeOpacity={0.6}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <Text style={styles.moveButtonText}>MOVER</Text>
          </TouchableOpacity>
        </View>
        
        {showMoveButtons && (
          <View style={styles.moveOptionsContainer}>
            <Text style={styles.moveOptionsTitle}>Mover a:</Text>
            <View style={styles.moveOptionsButtons}>
              {sections
                .filter(s => s.key !== section)
                .map(s => (
                  <TouchableOpacity 
                    key={s.key}
                    style={styles.moveOptionButton}
                    onPress={() => handleMoveTo(s.key)}
                  >
                    <Text style={styles.moveOptionText}>{s.emoji} {s.name}</Text>
                  </TouchableOpacity>
                ))
              }
            </View>
            <TouchableOpacity 
              style={styles.cancelMoveButton}
              onPress={() => setShowMoveButtons(false)}
            >
              <Text style={styles.cancelMoveText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const TaskSection = ({ title, sectionKey, tasks: sectionTasks }) => {
    const onLayout = (event) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setSectionLayouts(prev => ({
        ...prev,
        [sectionKey]: { x, y, width, height }
      }));
    };
    
    return (
      <View style={styles.section} onLayout={onLayout}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>{sectionEmojis[sectionKey]}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        </View>
        <View style={[
          styles.dropZone, 
          sectionTasks.length === 0 && styles.dropZoneEmpty,
          isDraggingAnyTask && styles.dropZoneHighlighted
        ]}>
          {sectionTasks.length === 0 ? (
            <Text style={styles.emptyMessage}>
              Arrastra tareas aquí para {title.toLowerCase()}
            </Text>
          ) : (
            <View style={styles.tasksList}>
              {sectionTasks.map(task => (
                <View key={task.id} style={styles.taskWrapper}>
                  <TaskWithMoveButtons task={task} section={sectionKey} />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.root}>
      <View style={{ flex: 1 }}>
        <ProjectsScreen />
        
        <TouchableOpacity 
          style={styles.drawerOverlay} 
          onPress={closeDrawer}
          activeOpacity={1}
        />
        
        <Reanimated.View style={[styles.mainContainer, mainContainerAnimatedStyle]}>
          <SafeAreaView style={styles.gtdContainer}>
            <View style={styles.gtdHeader}>
              <TouchableOpacity style={styles.drawerButton} onPress={openDrawer}>
                <Text style={styles.drawerButtonText}>☰</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gtdNavigationHandle} onPress={navigateToDashboard} activeOpacity={0.7}>
                <View style={styles.gtdHandleBar} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.gtdContent} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gtdScrollContent}
              nestedScrollEnabled={true}
              scrollEnabled={true}
              keyboardShouldPersistTaps="always"
              delayContentTouches={false}
              contentInsetAdjustmentBehavior="never"
            >
              {['inbox', 'today', 'next', 'someday'].map((sectionKey) => {
                let title = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
                if (sectionKey === 'today') title = 'Today';
                return (
                  <TaskSection 
                    key={sectionKey} 
                    title={title} 
                    sectionKey={sectionKey} 
                    tasks={getTasks(sectionKey)}
                  />
                );
              })}
            </ScrollView>
            
            <TouchableOpacity style={styles.gtdAddButton}>
              <Text style={styles.gtdAddButtonText}>AÑADIR TAREA - CAMBIO APLICADO</Text>
            </TouchableOpacity>
          </SafeAreaView>

          <Reanimated.View 
            style={[styles.dashboardContainer, dashboardAnimatedStyle]}
          >
            <DashboardScreenOriginal 
              onNavigateToGTD={navigateToGTD}
              onNavigateToCalendar={handleNavigateToCalendar}
            />
          </Reanimated.View>
        </Reanimated.View>
      </View>

      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseCalendar}
      >
        <CalendarScreen onGoBack={handleCloseCalendar} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  mainContainer: {
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0,
    backgroundColor: 'white', 
    shadowColor: '#000', 
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.15, 
    shadowRadius: 10, 
    elevation: 20,
    overflow: 'hidden'
  },
  gtdContainer: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  gtdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  drawerButton: {
    padding: 10,
    backgroundColor: '#6200EE',
    borderRadius: 8,
    marginRight: 15,
  },
  drawerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dashboardContainer: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'white' 
  },
  gtdNavigationHandle: { 
    alignItems: 'center', 
    paddingVertical: 10 
  },
  gtdHandleBar: { 
    width: 40, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: '#dee2e6' 
  },
  gtdContent: { 
    flex: 1, 
    paddingHorizontal: 20 
  },
  gtdScrollContent: { 
    paddingBottom: 100 
  },
  gtdAddButton: { 
    backgroundColor: '#4A90E2', 
    paddingVertical: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginHorizontal: 20, 
    marginBottom: 20 
  },
  gtdAddButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  section: { 
    marginVertical: 10 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  sectionTitleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  sectionIcon: { 
    marginRight: 10, 
    fontSize: 20 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#495057' 
  },
  dropZone: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 15, 
    minHeight: 80, 
    borderWidth: 2, 
    borderColor: '#e9ecef', 
    borderStyle: 'dashed' 
  },
  dropZoneEmpty: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  tasksList: { 
    gap: 8 
  },
  taskItem: { 
    marginBottom: 8 
  },
  taskContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 15, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e9ecef' 
  },
  taskText: { 
    flex: 1, 
    fontSize: 16, 
    color: '#495057' 
  },
  taskTextContainer: {
    flex: 1,
  },
  moveButton: {
    padding: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    marginLeft: 10,
  },
  moveButtonText: {
    fontSize: 16,
  },
  moveOptionsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  moveOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  moveOptionsButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moveOptionButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  moveOptionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  cancelMoveButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  cancelMoveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  taskWrapper: {
    marginBottom: 8,
  },
  emptyMessage: { 
    color: '#adb5bd', 
    fontStyle: 'italic' 
  },
  draggingTask: {
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    transform: [{ scale: 1.05 }],
  },
  dropZoneHighlighted: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9',
    borderWidth: 3,
  },
});

export default MainAppScreen;