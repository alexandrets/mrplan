import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Modal,
  PanResponder,
  Animated,
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
import DashboardScreenOriginal from './DashboardScreenOriginal';
import ProjectsScreen from './ProjectsScreen';
import CalendarScreen from './CalendarScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.95;
import { useAuth } from '../context/AuthContext';
import { 
  subscribeToUserTasks,
  subscribeToUserProjects,
  updateTask 
} from '../services/firebaseService';

const MainAppScreen = () => {
  console.log('🎯 MAINAPPSCREEN SUPER SIMPLE CARGADO!');
  
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isDraggingAnyTask, setIsDraggingAnyTask] = useState(false);
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

  useEffect(() => {
    const todayTasks = tasks.filter(task => task.section === 'today');
    console.log('🗓️ Tareas de Today para Dashboard:', todayTasks.length);
    console.log('📝 Tareas completas:', todayTasks);
  }, [tasks]);

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
    console.log('🔄 moveTaskToSection:', { taskId, fromSection, toSection });
    Alert.alert('Moviendo tarea', `De ${fromSection} a ${toSection}`);
    updateTask(taskId, { section: toSection });
  };

  const handleMoveTask = (task, currentSection) => {
    console.log('📱 handleMoveTask llamado para:', task.title);
    
    const sections = [
      { key: 'inbox', name: 'Inbox' },
      { key: 'today', name: 'Today' },
      { key: 'next', name: 'Next' },
      { key: 'someday', name: 'Someday' }
    ];
    
    const options = sections
      .filter(s => s.key !== currentSection)
      .map(s => ({
        text: `Mover a ${s.name}`,
        onPress: () => moveTaskToSection(task.id, currentSection, s.key)
      }));
    
    options.push({
      text: 'Cancelar',
      style: 'cancel'
    });
    
    Alert.alert(
      'Mover Tarea',
      `¿Dónde quieres mover "${task.title}"?`,
      options
    );
  };

  const DraggableTaskItem = ({ task, section }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const [isDragging, setIsDragging] = useState(false);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => {
          console.log('🔍 onStartShouldSetPanResponder:', task.title);
          return true;
        },
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          const shouldMove = Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
          console.log('🔍 onMoveShouldSetPanResponder:', task.title, 'shouldMove:', shouldMove, 'dx:', gestureState.dx, 'dy:', gestureState.dy);
          return shouldMove;
        },
        onPanResponderTerminationRequest: () => {
          console.log('🔍 onPanResponderTerminationRequest:', task.title);
          return false;
        },
        onShouldBlockNativeResponder: () => {
          console.log('🔍 onShouldBlockNativeResponder:', task.title);
          return false;
        },
        onPanResponderGrant: () => {
          console.log('🎯 DRAG INICIADO:', task.title);
          setIsDragging(true);
          setIsDraggingAnyTask(true);
          pan.setOffset({
            x: pan.x._value,
            y: pan.y._value,
          });
        },
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: (evt, gestureState) => {
          console.log('🎯 DRAG TERMINADO:', task.title);
          setIsDragging(false);
          setIsDraggingAnyTask(false);
          pan.flattenOffset();

          const dropY = evt.nativeEvent.pageY;
          console.log('📍 Drop Y:', dropY);
          let targetSection = section;

          // Detectar en qué sección se soltó
          const sections = ['inbox', 'today', 'next', 'someday'];
          for (const sectionKey of sections) {
            const layout = sectionLayouts[sectionKey];
            if (layout) {
              const sectionTop = layout.y;
              const sectionBottom = layout.y + layout.height;
              console.log(`📦 ${sectionKey}: ${sectionTop}-${sectionBottom}`);
              
              if (dropY >= sectionTop && dropY <= sectionBottom) {
                targetSection = sectionKey;
                console.log('🎯 TARGET:', targetSection);
                break;
              }
            }
          }

          if (targetSection !== section) {
            console.log('✅ MOVIENDO DE', section, 'A', targetSection);
            moveTaskToSection(task.id, section, targetSection);
          }

          // Resetear posición
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        },
      })
    ).current;

    return (
      <Animated.View
        style={[
          styles.taskItem,
          {
            transform: pan.getTranslateTransform(),
            opacity: isDragging ? 0.7 : 1,
            zIndex: isDragging ? 1000 : 1,
            elevation: isDragging ? 10 : 1,
          },
          isDragging && styles.draggingTask,
        ]}
      >
        <View style={styles.taskRow}>
          <View style={styles.dragHandle} {...panResponder.panHandlers}>
            <Text style={styles.dragIcon}>⋮⋮</Text>
          </View>
          <View style={styles.taskTextContainer}>
            <Text style={styles.taskText}>{task.title}</Text>
            <Text style={styles.dragHint}>👆 Arrastra desde el icono ⋮⋮</Text>
          </View>
          <TouchableOpacity 
            style={styles.moveButton}
            onPress={() => handleMoveTask(task, section)}
            activeOpacity={0.7}
            disabled={isDragging}
          >
            <Text style={styles.moveButtonText}>MENU</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const SectionView = ({ title, sectionKey }) => {
    const sectionTasks = tasks.filter(task => task.section === sectionKey && !task.completed);
    
    const onLayout = (event) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setSectionLayouts(prev => ({
        ...prev,
        [sectionKey]: { x, y, width, height }
      }));
      console.log(`📍 Layout ${sectionKey}:`, { y, height });
    };
    
    return (
      <View style={styles.section} onLayout={onLayout}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[
          styles.tasksContainer,
          isDraggingAnyTask && styles.dropZoneActive
        ]}>
          {sectionTasks.length === 0 ? (
            <Text style={styles.emptyText}>
              {isDraggingAnyTask ? '🎯 Suelta aquí para mover' : 'No hay tareas'}
            </Text>
          ) : (
            sectionTasks.map(task => (
              <DraggableTaskItem key={task.id} task={task} section={sectionKey} />
            ))
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
            
            <View style={{backgroundColor: 'lightgreen', padding: 10, margin: 15, borderRadius: 8}}>
              <Text style={{textAlign: 'center', fontWeight: 'bold'}}>✅ NAVEGACIÓN COMPLETA + MOVER TAREAS</Text>
            </View>
            
            <ScrollView 
              style={styles.gtdContent} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gtdScrollContent}
              scrollEnabled={!isDraggingAnyTask}
            >
              <SectionView title="Inbox" sectionKey="inbox" />
              <SectionView title="Today" sectionKey="today" />
              <SectionView title="Next" sectionKey="next" />
              <SectionView title="Someday" sectionKey="someday" />
            </ScrollView>
            
            <TouchableOpacity style={styles.gtdAddButton}>
              <Text style={styles.gtdAddButtonText}>AÑADIR TAREA</Text>
            </TouchableOpacity>
          </SafeAreaView>

          <Reanimated.View 
            style={[styles.dashboardContainer, dashboardAnimatedStyle]}
          >
            <DashboardScreenOriginal 
              onNavigateToGTD={navigateToGTD}
              onNavigateToCalendar={handleNavigateToCalendar}
              tasks={tasks}
              onToggleTask={(taskId) => {
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                  updateTask(taskId, { completed: !task.completed });
                }
              }}
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
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 10,
  },
  tasksContainer: {
    minHeight: 50,
  },
  emptyText: {
    color: '#adb5bd',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  taskItem: {
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
  },
  moveButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 10,
  },
  moveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskTextContainer: {
    flex: 1,
  },
  dragHandle: {
    width: 30,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  dragIcon: {
    fontSize: 18,
    color: '#495057',
    lineHeight: 18,
    fontWeight: 'bold',
  },
  dragHint: {
    fontSize: 10,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 2,
  },
  draggingTask: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 8,
  },
  dropZoneActive: {
    backgroundColor: '#f8fff9',
    borderWidth: 2,
    borderColor: '#28a745',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
});

export default MainAppScreen;