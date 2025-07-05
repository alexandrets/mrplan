import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
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
  runOnJS,
  Easing
} from 'react-native-reanimated';
// Gesture handler removed for compatibility
// DraxProvider removed for compatibility
import { useAuth } from '../context/AuthContext';
import DashboardScreenOriginal from './DashboardScreenOriginal';
import ProjectsScreen from './ProjectsScreen';
import CalendarScreen from './CalendarScreen';
import EditTaskModal from '../components/EditTaskModal'; 
import { 
  createTask, 
  updateTask, 
  deleteTask, 
  subscribeToUserTasks,
  subscribeToUserProjects 
} from '../services/firebaseService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.95;

const sectionEmojis = {
  inbox: '📥',
  today: '🗓️',
  next: '➡️',
  someday: '📦'
};

const timeOptions = [15, 30, 60, 120, 180, 240, 300];

const formatTimeLabel = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}'`;
    return `${minutes / 60}h`;
};

const MainAppScreen = () => {
  console.log('🚀 MAINAPPSCREEN CARGADO - CAMBIOS APLICADOS!');
  console.log('📱 Estilos root:', styles.root);
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddTaskScreen, setShowAddTaskScreen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSection, setNewTaskSection] = useState('today');
  const [sectionRefs, setSectionRefs] = useState({});
  const [sectionLayouts, setSectionLayouts] = useState({});
  const [isDraggingAnyTask, setIsDraggingAnyTask] = useState(false);
  const [newTaskTime, setNewTaskTime] = useState(null);
  const [newTaskProjectId, setNewTaskProjectId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const translateX = useSharedValue(0); 
  const translateY = useSharedValue(0); 
  const context = useSharedValue({ x: 0 });

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

  // Debug para verificar cambios en showCalendar
  useEffect(() => {
    console.log('📅 showCalendar cambió a:', showCalendar);
  }, [showCalendar]);

  // Gesture handler removed for compatibility
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
    console.log('🚀 Navegando al calendario...');
    setShowCalendar(true);
  };
  
  const handleCloseCalendar = () => {
    console.log('🔙 Cerrando calendario...');
    setShowCalendar(false);
  };
  
  const handleAddTask = () => {
    if (newTaskTitle.trim() && user) {
      createTask({ 
        title: newTaskTitle.trim(), 
        section: newTaskSection, 
        userId: user.uid,
        estimatedTime: newTaskTime, 
        projectId: newTaskProjectId, 
        completed: false,
      });
      closeAddTaskModal();
    }
  };

  const closeAddTaskModal = () => {
    setShowAddTask(false);
    setShowAddTaskScreen(false);
    setNewTaskTitle('');
    setNewTaskSection('today');
    setNewTaskTime(null);
    setNewTaskProjectId(null);
  };
  
  const completeTask = (taskId, currentStatus) => {
    updateTask(taskId, { completed: !currentStatus });
  };

  const handleUpdateTask = (taskId, updates) => { 
    updateTask(taskId, updates); 
    setIsEditModalVisible(false); 
    setSelectedTask(null); 
  };
  
  const handleDeleteWithConfirmation = () => {
    if (!selectedTask) return;
    Alert.alert(
      "Borrar Tarea", 
      `¿Estás seguro de que quieres borrar "${selectedTask.title}"?`, 
      [
        { text: "Cancelar", style: "cancel", onPress: closeMenu },
        { text: "Borrar", style: "destructive", onPress: () => { deleteTask(selectedTask.id); closeMenu(); }}
      ]
    );
  };

  const handleEdit = () => {
    if (!selectedTask) return;
    setIsMenuVisible(false);
    setTimeout(() => setIsEditModalVisible(true), 150);
  };
  
  const openMenu = (task) => {
    setSelectedTask(task);
    setIsMenuVisible(true);
  };
  
  const closeMenu = () => {
    setIsMenuVisible(false);
    setSelectedTask(null);
  };

  const moveTaskToSection = (taskId, fromSection, toSection) => {
    if (fromSection !== toSection) {
      updateTask(taskId, { section: toSection });
    }
  };
  
  const getTasks = (section) => {
    if (section === 'today') {
      return tasks.filter(task => task.section === section);
    }
    return tasks.filter(task => task.section === section && !task.completed);
  };

  const handleAddTaskFromDashboard = () => {
    setNewTaskSection('today');
    setShowAddTaskScreen(true);
  };
  
  const handleAddTaskFromGTD = () => {
    setNewTaskSection('inbox');
    setShowAddTaskScreen(true);
  };
  
  const DraggableTask = ({ task, section }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const [isDragging, setIsDragging] = useState(false);
    const [dragStarted, setDragStarted] = useState(false);

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // Activate drag only if moved significantly
          return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
        },
        onPanResponderGrant: () => {
          setDragStarted(true);
          setIsDragging(true);
          setIsDraggingAnyTask(true);
          pan.setOffset({
            x: pan.x._value,
            y: pan.y._value,
          });
          // Provide haptic feedback
          if (Platform.OS === 'ios') {
            // Add haptic feedback for iOS if available
          }
        },
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: (evt, gestureState) => {
          setIsDragging(false);
          setDragStarted(false);
          setIsDraggingAnyTask(false);
          pan.flattenOffset();

          // Check if dropped on a valid drop zone
          const dropY = evt.nativeEvent.pageY;
          let targetSection = section;

          // Dynamic drop zone detection using stored layouts
          const sections = ['inbox', 'today', 'next', 'someday'];
          
          for (const sectionKey of sections) {
            const layout = sectionLayouts[sectionKey];
            if (layout) {
              const sectionTop = layout.y;
              const sectionBottom = layout.y + layout.height;
              
              if (dropY >= sectionTop && dropY <= sectionBottom) {
                targetSection = sectionKey;
                break;
              }
            }
          }

          if (targetSection !== section) {
            moveTaskToSection(task.id, section, targetSection);
            // Show success feedback
            if (Platform.OS === 'ios') {
              // Add success haptic feedback for iOS if available
            }
          }

          // Reset position
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
            opacity: isDragging ? 0.8 : 1,
            zIndex: isDragging ? 1000 : 1,
          },
          isDragging && styles.draggingTask,
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.taskContent, task.completed && styles.taskContentCompleted]}>
          <TouchableOpacity onPress={() => completeTask(task.id, task.completed)}>
            <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxCompleted]}>
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
          <View style={styles.taskTextContainer}>
            <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
              {task.title}
            </Text>
          </View>
          {task.estimatedTime > 0 && (
            <Text style={[styles.taskTimeText, task.completed && styles.taskTextCompleted]}>
              {formatTimeLabel(task.estimatedTime)}
            </Text>
          )}
          <TouchableOpacity onPress={() => openMenu(task)}>
            <View style={styles.optionsButton}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const TaskSection = ({ title, sectionKey, tasks: sectionTasks, isDraggingAnyTask }) => {
    const [isReceiving, setIsReceiving] = useState(false);
    const sectionRef = useRef(null);
    
    const onLayout = (event) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setSectionLayouts(prev => ({
        ...prev,
        [sectionKey]: { x, y, width, height }
      }));
    };
    
    return (
      <View ref={sectionRef} style={styles.section} onLayout={onLayout}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>{sectionEmojis[sectionKey]}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        </View>
        <View 
          style={[
            styles.dropZone, 
            isReceiving && styles.dropZoneActive,
            sectionTasks.length === 0 && styles.dropZoneEmpty,
            isDraggingAnyTask && styles.dropZoneHighlighted
          ]} 
        >
          {sectionTasks.length === 0 ? (
            <Text style={styles.emptyMessage}>
              Arrastra tareas aquí para {title.toLowerCase()}
            </Text>
          ) : (
            <View style={styles.tasksList}>
              {sectionTasks.map(task => (
                <DraggableTask key={task.id} task={task} section={sectionKey} />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };
  
  console.log('🎯 LLEGANDO AL RETURN!');
  return (
    <View style={{flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 50, color: 'white'}}>CAMBIO APLICADO!!!</Text>
    </View>
  );
};

// Código original comentado para debug
/*
function MainAppScreenOriginal() {
  return (
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
              keyboardShouldPersistTaps="handled"
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
                    isDraggingAnyTask={isDraggingAnyTask}
                  />
                );
              })}
            </ScrollView>
            
            <TouchableOpacity style={styles.gtdAddButton} onPress={handleAddTaskFromGTD}>
              <Text style={styles.gtdAddButtonText}>AÑADIR TAREA - CAMBIO APLICADO</Text>
            </TouchableOpacity>
          </SafeAreaView>

          <Reanimated.View 
            style={[styles.dashboardContainer, dashboardAnimatedStyle]}
            pointerEvents={translateY.value === 0 ? 'auto' : 'box-none'}
          >
            <DashboardScreenOriginal 
              tasks={tasks}
              onToggleTask={completeTask} 
              onNavigateToGTD={navigateToGTD}
              onAddTask={handleAddTaskFromDashboard}
              onNavigateToCalendar={handleNavigateToCalendar}
            />
          </Reanimated.View>
        </Reanimated.View>
      </View>
      
      {/* Screen completa para añadir tarea - SIN MODAL */}
      {showAddTaskScreen && (
        <View style={styles.addTaskScreen}>
          <SafeAreaView style={styles.addTaskScreenContent}>
            {/* Header */}
            <View style={styles.addTaskHeader}>
              <TouchableOpacity onPress={closeAddTaskModal} style={styles.backButton}>
                <Text style={styles.backButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.addTaskTitle}>Add New Task</Text>
              <TouchableOpacity onPress={handleAddTask} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
            
            {/* Content */}
            <ScrollView 
              style={styles.addTaskForm}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputContainer}>
                <TouchableOpacity 
                  style={styles.fakeInput}
                  onPress={() => {
                    Alert.prompt(
                      'Add Task',
                      'Enter task title:',
                      [
                        {text: 'Cancel', style: 'cancel'},
                        {text: 'Add', onPress: (text) => {
                          if (text && text.trim()) {
                            setNewTaskTitle(text.trim());
                            handleAddTask();
                          }
                        }}
                      ],
                      'plain-text'
                    );
                  }}
                >
                  <Text style={styles.fakeInputText}>
                    {newTaskTitle || 'Tap to add task...'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.formGroupScreen}>
                <Text style={styles.selectorLabelScreen}>Add to:</Text>
                <View style={styles.selectorButtonsScreen}>
                  {['inbox', 'today', 'next', 'someday'].map(section => (
                    <TouchableOpacity 
                      key={section} 
                      style={[
                        styles.selectorButtonScreen, 
                        newTaskSection === section && styles.selectorButtonActiveScreen
                      ]} 
                      onPress={() => setNewTaskSection(section)}
                    >
                      <Text style={[
                        styles.selectorButtonTextScreen, 
                        newTaskSection === section && styles.selectorButtonTextActiveScreen
                      ]}>
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroupScreen}>
                <Text style={styles.selectorLabelScreen}>Project (Optional):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.projectSelectorScreen}>
                    <TouchableOpacity 
                      style={[
                        styles.projectButtonScreen, 
                        !newTaskProjectId && styles.projectButtonActiveScreen
                      ]} 
                      onPress={() => setNewTaskProjectId(null)}
                    >
                      <Text style={[
                        styles.projectButtonTextScreen, 
                        !newTaskProjectId && styles.projectButtonTextActiveScreen
                      ]}>
                        None
                      </Text>
                    </TouchableOpacity>
                    {projects.map(proj => (
                      <TouchableOpacity 
                        key={proj.id} 
                        style={[
                          styles.projectButtonScreen, 
                          newTaskProjectId === proj.id && styles.projectButtonActiveScreen
                        ]} 
                        onPress={() => setNewTaskProjectId(proj.id)}
                      >
                        <Text 
                          style={[
                            styles.projectButtonTextScreen, 
                            newTaskProjectId === proj.id && styles.projectButtonTextActiveScreen
                          ]} 
                          numberOfLines={1}
                        >
                          {proj.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              <View style={styles.formGroupScreen}>
                <Text style={styles.selectorLabelScreen}>Estimated Time:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.timeSelectorScreen}>
                    {timeOptions.map(time => (
                      <TouchableOpacity 
                        key={time} 
                        style={[
                          styles.timeButtonScreen, 
                          newTaskTime === time && styles.timeButtonActiveScreen
                        ]} 
                        onPress={() => setNewTaskTime(newTaskTime === time ? null : time)}
                      >
                        <Text style={[
                          styles.timeButtonTextScreen, 
                          newTaskTime === time && styles.timeButtonTextActiveScreen
                        ]}>
                          {formatTimeLabel(time)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* Modal para menú de opciones de tarea */}
      <Modal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={closeMenu}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuOption} onPress={handleEdit}>
              <Text style={styles.menuIcon}>✏️</Text>
              <Text style={styles.menuOptionText}>Editar</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuOption} onPress={handleDeleteWithConfirmation}>
              <Text style={styles.menuIcon}>🗑️</Text>
              <Text style={[styles.menuOptionText, {color: '#E74C3C'}]}>Borrar</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.menuContainer, styles.cancelMenu]} onPress={closeMenu}>
            <Text style={[styles.menuOptionText, {fontWeight: '600', textAlign: 'center'}]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal para editar tarea */}
      <EditTaskModal 
        visible={isEditModalVisible} 
        task={selectedTask} 
        projects={projects}  
        onClose={() => { 
          setIsEditModalVisible(false); 
          setSelectedTask(null); 
        }} 
        onSave={handleUpdateTask}
      />
      
      {/* Modal para pantalla de calendario */}
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
  dropZoneActive: { 
    borderColor: '#4A90E2', 
    backgroundColor: '#f0f8ff' 
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
  taskContentCompleted: { 
    opacity: 0.5 
  },
  taskCheckbox: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: '#dee2e6', 
    marginRight: 15, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  taskCheckboxCompleted: { 
    backgroundColor: '#50C878', 
    borderColor: '#50C878' 
  },
  checkmark: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  taskText: { 
    flex: 1, 
    fontSize: 16, 
    color: '#495057' 
  },
  taskTextCompleted: { 
    textDecorationLine: 'line-through' 
  },
  emptyMessage: { 
    color: '#adb5bd', 
    fontStyle: 'italic' 
  },
  optionsButton: { 
    padding: 10 
  },
  dot: { 
    width: 4, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: '#adb5bd', 
    marginBottom: 2 
  },
  menuOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    justifyContent: 'flex-end' 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: { 
    backgroundColor: Platform.OS === 'ios' ? 'rgba(249, 249, 249, 0.94)' : 'white', 
    marginHorizontal: 10, 
    borderRadius: 14, 
    overflow: 'hidden' 
  },
  cancelMenu: { 
    marginTop: 8, 
    marginBottom: Platform.OS === 'ios' ? 30 : 10 
  },
  menuOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 20 
  },
  menuIcon: { 
    fontSize: 20, 
    width: 24, 
    textAlign: 'center' 
  },
  menuOptionText: { 
    fontSize: 18, 
    marginLeft: 15 
  },
  menuDivider: { 
    height: 1, 
    backgroundColor: '#e9ecef', 
    marginLeft: 55 
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center' 
  },
  addTaskModalContent: { 
    backgroundColor: 'white', 
    borderRadius: 14, 
    padding: 20, 
    width: '100%', 
    maxWidth: 400, 
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#495057', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  taskInput: { 
    borderWidth: 1, 
    borderColor: '#dee2e6', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: 16, 
    marginBottom: 15 
  },
  formGroup: { 
    marginBottom: 20 
  },
  selectorLabel: { 
    fontSize: 14, 
    color: '#6c757d', 
    marginBottom: 10, 
    fontWeight: '500' 
  },
  selectorButtons: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  selectorButton: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#dee2e6', 
    backgroundColor: '#f8f9fa' 
  },
  selectorButtonActive: { 
    backgroundColor: '#4A90E2', 
    borderColor: '#4A90E2' 
  },
  selectorButtonText: { 
    fontSize: 14, 
    color: '#495057' 
  },
  selectorButtonTextActive: { 
    color: '#ffffff' 
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 10, 
    marginTop: 10 
  },
  cancelButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    backgroundColor: '#f8f9fa' 
  },
  cancelButtonText: { 
    color: '#6c757d', 
    fontSize: 16, 
    fontWeight: '500' 
  },
  addTaskButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    backgroundColor: '#4A90E2' 
  },
  addTaskButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  taskTextContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  taskTimeText: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#4A90E2', 
    marginLeft: 8 
  },
  timeSelector: { 
    flexDirection: 'row', 
    gap: 10 
  },
  timeButton: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    borderWidth: 1.5, 
    borderColor: '#4A90E2', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#ffffff' 
  },
  timeButtonActive: { 
    backgroundColor: '#4A90E2' 
  },
  timeButtonText: { 
    color: '#4A90E2', 
    fontWeight: '600' 
  },
  timeButtonTextActive: { 
    color: '#ffffff' 
  },
  projectSelector: { 
    flexDirection: 'row', 
    gap: 10 
  },
  projectButton: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#f8f9fa', 
    borderWidth: 1, 
    borderColor: '#dee2e6', 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  projectButtonActive: { 
    backgroundColor: '#50C878', 
    borderColor: '#50C878' 
  },
  projectButtonText: { 
    color: '#495057', 
    fontWeight: '500' 
  },
  projectButtonTextActive: { 
    color: '#ffffff' 
  },
  // Estilos para la screen completa (sin modal)
  addTaskScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8f9fa',
    zIndex: 1000,
  },
  addTaskScreenContent: {
    flex: 1,
  },
  addTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 5,
    minWidth: 44,
  },
  backButtonText: {
    fontSize: 24,
    color: '#666',
  },
  addTaskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
  },
  saveButton: {
    padding: 5,
    minWidth: 44,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  addTaskForm: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  fakeInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    minHeight: 50,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  fakeInputText: {
    fontSize: 16,
    color: '#495057',
  },
  formGroupScreen: {
    marginBottom: 25,
  },
  selectorLabelScreen: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 15,
  },
  selectorButtonsScreen: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectorButtonScreen: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectorButtonActiveScreen: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  selectorButtonTextScreen: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  selectorButtonTextActiveScreen: {
    color: 'white',
  },
  projectSelectorScreen: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  projectButtonScreen: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 80,
    alignItems: 'center',
  },
  projectButtonActiveScreen: {
    backgroundColor: '#50C878',
    borderColor: '#50C878',
  },
  projectButtonTextScreen: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  projectButtonTextActiveScreen: {
    color: 'white',
  },
  timeSelectorScreen: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  timeButtonScreen: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeButtonActiveScreen: {
    backgroundColor: '#4A90E2',
  },
  timeButtonTextScreen: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
  },
  timeButtonTextActiveScreen: {
    color: 'white',
  },
  taskTimeText: {
    fontSize: 12,
    color: '#6c757d',
    marginRight: 15,
    fontWeight: '500',
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