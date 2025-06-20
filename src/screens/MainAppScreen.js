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
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { DraxProvider, DraxView } from 'react-native-drax';
import { useAuth } from '../context/AuthContext';
import DashboardScreenOriginal from './DashboardScreenOriginal';
import ProjectsScreen from './ProjectsScreen';
import EditTaskModal from '../components/EditTaskModal'; 
import { 
  createTask, 
  updateTask, 
  deleteTask, 
  subscribeToUserTasks,
  subscribeToUserProjects 
} from '../services/firebaseService';
import Icon from 'react-native-vector-icons/Feather';

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
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSection, setNewTaskSection] = useState('today');
  const [newTaskTime, setNewTaskTime] = useState(null);
  const [newTaskProjectId, setNewTaskProjectId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

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

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      context.value.x = translateX.value;
    })
    .onUpdate((event) => {
      const newTranslateX = context.value.x + event.translationX;
      translateX.value = Math.max(-DRAWER_WIDTH, Math.min(0, newTranslateX));
    })
    .onEnd(() => {
      if (translateX.value < -DRAWER_WIDTH / 2) {
        translateX.value = withSpring(-DRAWER_WIDTH, { damping: 18 });
      } else {
        translateX.value = withSpring(0, { damping: 18 });
      }
    });

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
  
  const handleAddTask = () => {
    if (newTaskTitle.trim() && user) {
      createTask({ 
        title: newTaskTitle.trim(), section: newTaskSection, userId: user.uid,
        estimatedTime: newTaskTime, projectId: newTaskProjectId, completed: false,
      });
      closeAddTaskModal();
    }
  };

  const closeAddTaskModal = () => {
    setShowAddTask(false);
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
    Alert.alert("Borrar Tarea", `¿Estás seguro de que quieres borrar "${selectedTask.title}"?`, [
      { text: "Cancelar", style: "cancel", onPress: closeMenu },
      { text: "Borrar", style: "destructive", onPress: () => { deleteTask(selectedTask.id); closeMenu(); }}
    ]);
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
    if (fromSection !== toSection) updateTask(taskId, { section: toSection });
  };
  
  const getTasks = (section) => {
    if (section === 'today') {
      return tasks.filter(task => task.section === section);
    }
    return tasks.filter(task => task.section === section && !task.completed);
  };

  const handleAddTaskFromDashboard = () => {
    setNewTaskSection('today');
    setShowAddTask(true);
  };
  
  const handleAddTaskFromGTD = () => {
    setNewTaskSection('inbox');
    setShowAddTask(true);
  };
  
  const DraggableTask = ({ task, section }) => {
    const completeTap = Gesture.Tap().onEnd(() => {
      runOnJS(completeTask)(task.id, task.completed);
    });

    const menuTap = Gesture.Tap().onEnd(() => {
      runOnJS(openMenu)(task);
    });

    return (
      <DraxView
        style={styles.taskItem}
        dragPayload={{ taskId: task.id, fromSection: section }}
        longPressDelay={200}
      >
        <View style={[styles.taskContent, task.completed && styles.taskContentCompleted]}>
          <GestureDetector gesture={completeTap}>
            <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxCompleted]}>
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </GestureDetector>
          <View style={styles.taskTextContainer}>
            <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>{task.title}</Text>
          </View>
          {task.estimatedTime > 0 && <Text style={[styles.taskTimeText, task.completed && styles.taskTextCompleted]}>{formatTimeLabel(task.estimatedTime)}</Text>}
          <GestureDetector gesture={menuTap}>
            <View style={styles.optionsButton}>
              <View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} />
            </View>
          </GestureDetector>
        </View>
      </DraxView>
    );
  };

  const TaskSection = ({ title, sectionKey, tasks: sectionTasks }) => {
    const [isReceiving, setIsReceiving] = useState(false);
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>{sectionEmojis[sectionKey]}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        </View>
        <DraxView style={[styles.dropZone, isReceiving && styles.dropZoneActive, sectionTasks.length === 0 && styles.dropZoneEmpty]} onReceiveDragEnter={() => setIsReceiving(true)} onReceiveDragExit={() => setIsReceiving(false)} onReceiveDragDrop={({ dragged: { payload } }) => { setIsReceiving(false); moveTaskToSection(payload.taskId, payload.fromSection, sectionKey);}}>
          {sectionTasks.length === 0 ? <Text style={styles.emptyMessage}>No hay tareas en {title.toLowerCase()}</Text> : <View style={styles.tasksList}>{sectionTasks.map(task => <DraggableTask key={task.id} task={task} section={sectionKey} />)}</View>}
        </DraxView>
      </View>
    );
  };
  
  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={{ flex: 1 }}>
        <ProjectsScreen />
        <GestureDetector gesture={panGesture}>
          <Reanimated.View style={[styles.mainContainer, mainContainerAnimatedStyle]}>
            <SafeAreaView style={styles.gtdContainer}>
              <TouchableOpacity style={styles.gtdNavigationHandle} onPress={navigateToDashboard} activeOpacity={0.7}>
                <View style={styles.gtdHandleBar} />
              </TouchableOpacity>
              <DraxProvider>
                <ScrollView 
                  style={styles.gtdContent} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.gtdScrollContent}
                >
                  {['inbox', 'today', 'next', 'someday'].map((sectionKey) => (<TaskSection key={sectionKey} title={sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)} sectionKey={sectionKey} tasks={getTasks(sectionKey)} />))}
                </ScrollView>
              </DraxProvider>
              <TouchableOpacity style={styles.gtdAddButton} onPress={handleAddTaskFromGTD}>
                <Text style={styles.gtdAddButtonText}>Add Task</Text>
              </TouchableOpacity>
            </SafeAreaView>

            <Reanimated.View 
              style={[styles.dashboardContainer, dashboardAnimatedStyle]}
              pointerEvents={translateY.value === 0 ? 'auto' : 'none'}
            >
              <DashboardScreenOriginal 
                tasks={tasks}
                onToggleTask={completeTask} 
                onNavigateToGTD={navigateToGTD}
                onAddTask={handleAddTaskFromDashboard}
              />
            </Reanimated.View>
          </Reanimated.View>
        </GestureDetector>
      </View>
      
      {/* Modales */}
      <Modal visible={showAddTask} transparent={true} animationType="fade" onRequestClose={closeAddTaskModal}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeAddTaskModal}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.addTaskModalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <TextInput style={styles.taskInput} placeholder="Enter task title..." value={newTaskTitle} onChangeText={setNewTaskTitle} autoFocus={true} />
              <View style={styles.formGroup}><Text style={styles.selectorLabel}>Add to:</Text><View style={styles.selectorButtons}>{['inbox', 'today', 'next', 'someday'].map(section => (<TouchableOpacity key={section} style={[styles.selectorButton, newTaskSection === section && styles.selectorButtonActive]} onPress={() => setNewTaskSection(section)}><Text style={[styles.selectorButtonText, newTaskSection === section && styles.selectorButtonTextActive]}>{section.charAt(0).toUpperCase() + section.slice(1)}</Text></TouchableOpacity>))}</View></View>
              <View style={styles.formGroup}><Text style={styles.selectorLabel}>Project (Optional):</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.projectSelector}><TouchableOpacity style={[ styles.projectButton, !newTaskProjectId && styles.projectButtonActive ]} onPress={() => setNewTaskProjectId(null)}><Text style={[ styles.projectButtonText, !newTaskProjectId && styles.projectButtonTextActive ]}>None</Text></TouchableOpacity>{projects.map(proj => (<TouchableOpacity key={proj.id} style={[ styles.projectButton, newTaskProjectId === proj.id && styles.projectButtonActive ]} onPress={() => setNewTaskProjectId(proj.id)}><Text style={[ styles.projectButtonText, newTaskProjectId === proj.id && styles.projectButtonTextActive ]} numberOfLines={1}>{proj.name}</Text></TouchableOpacity>))}</View></ScrollView></View>
              <View style={styles.formGroup}><Text style={styles.selectorLabel}>Estimated Time:</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.timeSelector}>{timeOptions.map(time => (<TouchableOpacity key={time} style={[styles.timeButton, newTaskTime === time && styles.timeButtonActive]} onPress={() => setNewTaskTime(newTaskTime === time ? null : time)}><Text style={[styles.timeButtonText, newTaskTime === time && styles.timeButtonTextActive]}>{formatTimeLabel(time)}</Text></TouchableOpacity>))}</View></ScrollView></View>
              <View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={closeAddTaskModal}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.addTaskButton} onPress={handleAddTask}><Text style={styles.addTaskButtonText}>Add</Text></TouchableOpacity></View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={closeMenu}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuOption} onPress={handleEdit}><Text style={styles.menuIcon}>✏️</Text><Text style={styles.menuOptionText}>Editar</Text></TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuOption} onPress={handleDeleteWithConfirmation}><Text style={styles.menuIcon}>🗑️</Text><Text style={[styles.menuOptionText, {color: '#E74C3C'}]}>Borrar</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.menuContainer, styles.cancelMenu]} onPress={closeMenu}><Text style={[styles.menuOptionText, {fontWeight: '600', textAlign: 'center'}]}>Cancelar</Text></TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <EditTaskModal visible={isEditModalVisible} task={selectedTask} projects={projects} onClose={() => { setIsEditModalVisible(false); setSelectedTask(null); }} onSave={handleUpdateTask}/>
    </GestureHandlerRootView>
  );
};


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  mainContainer: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 20,
    overflow: 'hidden'
  },
  gtdContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  dashboardContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white' },
  gtdNavigationHandle: { alignItems: 'center', paddingVertical: 10 },
  gtdHandleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#dee2e6' },
  gtdContent: { flex: 1, paddingHorizontal: 20 },
  gtdScrollContent: { paddingBottom: 100 },
  gtdAddButton: { backgroundColor: '#4A90E2', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 20, marginBottom: 20 },
  gtdAddButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  section: { marginVertical: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: { marginRight: 10, fontSize: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#495057' },
  dropZone: { backgroundColor: '#ffffff', borderRadius: 12, padding: 15, minHeight: 80, borderWidth: 2, borderColor: '#e9ecef', borderStyle: 'dashed' },
  dropZoneActive: { borderColor: '#4A90E2', backgroundColor: '#f0f8ff' },
  dropZoneEmpty: { justifyContent: 'center', alignItems: 'center' },
  tasksList: { gap: 8 },
  taskItem: { marginBottom: 8 },
  taskContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#e9ecef' },
  taskContentCompleted: { opacity: 0.5 },
  taskCheckbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#dee2e6', marginRight: 15, alignItems: 'center', justifyContent: 'center' },
  taskCheckboxCompleted: { backgroundColor: '#50C878', borderColor: '#50C878' },
  checkmark: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  taskText: { flex: 1, fontSize: 16, color: '#495057' },
  taskTextCompleted: { textDecorationLine: 'line-through' },
  emptyMessage: { color: '#adb5bd', fontStyle: 'italic' },
  optionsButton: { padding: 10, },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#adb5bd', marginBottom: 2 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  menuContainer: { backgroundColor: Platform.OS === 'ios' ? 'rgba(249, 249, 249, 0.94)' : 'white', marginHorizontal: 10, borderRadius: 14, overflow: 'hidden' },
  cancelMenu: { marginTop: 8, marginBottom: Platform.OS === 'ios' ? 30 : 10 },
  menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  menuIcon: { fontSize: 20, width: 24, textAlign: 'center' },
  menuOptionText: { fontSize: 18, marginLeft: 15 },
  menuDivider: { height: 1, backgroundColor: '#e9ecef', marginLeft: 55 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  addTaskModalContent: { backgroundColor: 'white', borderRadius: 14, padding: 20, width: '90%', maxWidth: 400, alignSelf: 'center', marginVertical: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#495057', marginBottom: 15, textAlign: 'center' },
  taskInput: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 15 },
  formGroup: { marginBottom: 20 },
  selectorLabel: { fontSize: 14, color: '#6c757d', marginBottom: 10, fontWeight: '500' },
  selectorButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#dee2e6', backgroundColor: '#f8f9fa' },
  selectorButtonActive: { backgroundColor: '#4A90E2', borderColor: '#4A90E2' },
  selectorButtonText: { fontSize: 14, color: '#495057' },
  selectorButtonTextActive: { color: '#ffffff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#f8f9fa' },
  cancelButtonText: { color: '#6c757d', fontSize: 16, fontWeight: '500' },
  addTaskButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#4A90E2' },
  addTaskButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  taskTextContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  taskTimeText: { fontSize: 14, fontWeight: '500', color: '#4A90E2', marginLeft: 8 },
  timeSelector: { flexDirection: 'row', gap: 10 },
  timeButton: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: '#4A90E2', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  timeButtonActive: { backgroundColor: '#4A90E2' },
  timeButtonText: { color: '#4A90E2', fontWeight: '600' },
  timeButtonTextActive: { color: '#ffffff' },
  projectSelector: { flexDirection: 'row', gap: 10 },
  projectButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', height: 40, justifyContent: 'center', alignItems: 'center' },
  projectButtonActive: { backgroundColor: '#50C878', borderColor: '#50C878' },
  projectButtonText: { color: '#495057', fontWeight: '500' },
  projectButtonTextActive: { color: '#ffffff' },
});

export default MainAppScreen;