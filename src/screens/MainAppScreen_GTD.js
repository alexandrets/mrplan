import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
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
  
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddTaskScreen, setShowAddTaskScreen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSection, setNewTaskSection] = useState('today');
  const [sectionLayouts, setSectionLayouts] = useState({});
  const [isDraggingAnyTask, setIsDraggingAnyTask] = useState(false);
  const [newTaskTime, setNewTaskTime] = useState(null);
  const [newTaskProjectId, setNewTaskProjectId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isGTDVisible, setIsGTDVisible] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

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
    setIsGTDVisible(true);
    translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 350, easing: Easing.out(Easing.ease) });
  };
  
  const navigateToDashboard = () => {
    setIsGTDVisible(false);
    translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) });
  };
  
  const handleCloseCalendar = () => {
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
    setShowAddTaskModal(false);
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
    return tasks.filter(task => task.section === section && !task.completed);
  };

  const handleAddTaskFromGTD = () => {
    setNewTaskSection('inbox');
    setShowAddTaskModal(true);
  };

  const WorkingTaskMover = () => {
    const [showOptions, setShowOptions] = useState(false);

    const moveTask = (task, targetSection) => {
      moveTaskToSection(task.id, task.section, targetSection);
      setShowOptions(false);
    };

    const renderSection = (sectionKey, title) => {
      const sectionTasks = getTasks(sectionKey);
      const emoji = sectionKey === 'inbox' ? '📥' : sectionKey === 'today' ? '🗓️' : sectionKey === 'next' ? '➡️' : '📦';

      return (
        <View key={sectionKey} style={{marginBottom: 20}}>
          <Text style={{fontSize: 18, fontWeight: '600', color: '#495057', marginBottom: 10}}>
            {emoji} {title}
          </Text>
          
          {sectionTasks.length === 0 ? (
            <Text style={{color: '#adb5bd', fontStyle: 'italic', textAlign: 'center', padding: 15}}>
              No hay tareas
            </Text>
          ) : (
            sectionTasks.map(task => (
              <View key={task.id} style={{marginBottom: 10}}>
                <TouchableOpacity
                  onPress={() => {
                    setShowOptions(showOptions === task.id ? false : task.id);
                  }}
                  style={{
                    backgroundColor: 'white',
                    padding: 15,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#dee2e6',
                    marginBottom: 5
                  }}
                >
                  <Text style={{fontSize: 16, color: '#495057'}}>
                    {task.title}
                  </Text>
                  <Text style={{fontSize: 12, color: '#6c757d', marginTop: 5}}>
                    👆 Toca para mover
                  </Text>
                </TouchableOpacity>
                
                {showOptions === task.id && (
                  <View style={{backgroundColor: '#e8f4f8', padding: 10, borderRadius: 8}}>
                    <Text style={{fontWeight: 'bold', marginBottom: 10}}>Mover a:</Text>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                      {['inbox', 'today', 'next', 'someday']
                        .filter(section => section !== task.section)
                        .map(section => (
                          <TouchableOpacity
                            key={section}
                            onPress={() => moveTask(task, section)}
                            style={{
                              backgroundColor: '#007bff',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 6,
                              flexDirection: 'row',
                              alignItems: 'center'
                            }}
                          >
                            <Text style={{color: 'white', fontWeight: 'bold'}}>
                              {section === 'inbox' ? '📥 Inbox' : 
                               section === 'today' ? '🗓️ Today' : 
                               section === 'next' ? '➡️ Next' : '📦 Someday'}
                            </Text>
                          </TouchableOpacity>
                        ))
                      }
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      );
    };

    return (
      <View style={{backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10}}>
        {renderSection('inbox', 'Inbox')}
        {renderSection('today', 'Today')}
        {renderSection('next', 'Next')}
        {renderSection('someday', 'Someday')}
      </View>
    );
  };
  
  const SimpleTask = ({ task, section }) => {
    const [showMoveOptions, setShowMoveOptions] = useState(false);

    const handleMoveTask = () => {
      console.log('🔵 BOTÓN MOVER presionado para:', task.title);
      setShowMoveOptions(!showMoveOptions);
      console.log('🔵 showMoveOptions ahora es:', !showMoveOptions);
    };

    const moveToSection = (targetSection) => {
      console.log('🚀 Moviendo tarea:', task.title, 'de', section, 'a', targetSection);
      moveTaskToSection(task.id, section, targetSection);
      setShowMoveOptions(false);
    };

    const sections = [
      { key: 'inbox', name: 'Inbox', emoji: '📥' },
      { key: 'today', name: 'Today', emoji: '🗓️' },
      { key: 'next', name: 'Next', emoji: '➡️' },
      { key: 'someday', name: 'Someday', emoji: '📦' }
    ];

    return (
      <View style={styles.taskItem}>
        <TouchableOpacity 
          onPress={() => {
            console.log('🔥 TODA LA TAREA presionada!');
            handleMoveTask();
          }} 
          style={[styles.taskContent, task.completed && styles.taskContentCompleted]}
          activeOpacity={0.7}
        >
          <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxCompleted]}>
            {task.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.taskTextContainer}>
            <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
              {task.title}
            </Text>
            <Text style={styles.moveHint}>👆 Toca para mover</Text>
          </View>
          {task.estimatedTime > 0 && (
            <Text style={[styles.taskTimeText, task.completed && styles.taskTextCompleted]}>
              {formatTimeLabel(task.estimatedTime)}
            </Text>
          )}
        </TouchableOpacity>
        
        {showMoveOptions && (
          <View style={styles.moveOptionsContainer}>
            <Text style={styles.moveOptionsTitle}>Mover a:</Text>
            <View style={styles.moveOptionsGrid}>
              {sections
                .filter(s => s.key !== section)
                .map(s => (
                  <TouchableOpacity 
                    key={s.key}
                    style={styles.moveOptionButton}
                    onPress={() => moveToSection(s.key)}
                  >
                    <Text style={styles.moveOptionEmoji}>{s.emoji}</Text>
                    <Text style={styles.moveOptionText}>{s.name}</Text>
                  </TouchableOpacity>
                ))
              }
            </View>
            <TouchableOpacity 
              style={styles.cancelMoveButton}
              onPress={() => setShowMoveOptions(false)}
            >
              <Text style={styles.cancelMoveText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const TaskSection = ({ title, sectionKey, tasks: sectionTasks, isDraggingAnyTask }) => {
    
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
        <View 
          style={[
            styles.dropZone,
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
                <SimpleTask key={task.id} task={task} section={sectionKey} />
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
              keyboardShouldPersistTaps="always"
              delayContentTouches={false}
              canCancelContentTouches={false}
            >
              <WorkingTaskMover />
            </ScrollView>
            
            <TouchableOpacity style={styles.gtdAddButton} onPress={handleAddTaskFromGTD}>
              <Text style={styles.gtdAddButtonText}>+ AÑADIR TAREA</Text>
            </TouchableOpacity>
          </SafeAreaView>

          <Reanimated.View 
            style={[
              styles.dashboardContainer, 
              dashboardAnimatedStyle,
              { pointerEvents: isGTDVisible ? 'none' : 'auto' }
            ]}
          >
            <DashboardScreenOriginal 
              onNavigateToGTD={navigateToGTD}
              onNavigateToCalendar={() => setShowCalendar(true)}
              tasks={tasks}
              onToggleTask={(taskId) => {
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                  updateTask(taskId, { completed: !task.completed });
                }
              }}
              onAddTask={() => {
                setNewTaskSection('today');
                setShowAddTaskModal(true);
              }}
            />
          </Reanimated.View>
        </Reanimated.View>
      </View>

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

      {/* Modal Añadir Tarea */}
      <Modal visible={showAddTaskModal} transparent={true} animationType="slide" onRequestClose={closeAddTaskModal}>
        <View style={[styles.menuOverlay, {justifyContent: 'center', alignItems: 'center'}]}>
          <View style={styles.addTaskModalContent}>
            <Text style={styles.addTaskModalTitle}>Añadir Nueva Tarea</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Título</Text>
              <TouchableOpacity 
                style={styles.fakeInput}
                onPress={() => {
                  Alert.prompt(
                    'Título de la Tarea',
                    'Escribe el título:',
                    [
                      {text: 'Cancelar', style: 'cancel'},
                      {text: 'OK', onPress: (text) => {
                        if (text && text.trim()) {
                          setNewTaskTitle(text.trim());
                        }
                      }}
                    ],
                    'plain-text',
                    newTaskTitle
                  );
                }}
              >
                <Text style={styles.fakeInputText}>
                  {newTaskTitle || 'Toca para escribir el título...'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Sección</Text>
              <View style={styles.selectorButtons}>
                {['inbox', 'today', 'next', 'someday'].map(section => (
                  <TouchableOpacity 
                    key={section} 
                    style={[styles.selectorButton, newTaskSection === section && styles.selectorButtonActive]} 
                    onPress={() => setNewTaskSection(section)}
                  >
                    <Text style={[styles.selectorButtonText, newTaskSection === section && styles.selectorButtonTextActive]}>
                      {section === 'today' ? 'Today' : section.charAt(0).toUpperCase() + section.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Proyecto (Opcional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.projectSelector}>
                  <TouchableOpacity 
                    style={[styles.projectButton, !newTaskProjectId && styles.projectButtonActive]} 
                    onPress={() => setNewTaskProjectId(null)}
                  >
                    <Text style={[styles.projectButtonText, !newTaskProjectId && styles.projectButtonTextActive]}>Ninguno</Text>
                  </TouchableOpacity>
                  {projects.map(proj => (
                    <TouchableOpacity 
                      key={proj.id} 
                      style={[styles.projectButton, newTaskProjectId === proj.id && styles.projectButtonActive]} 
                      onPress={() => setNewTaskProjectId(proj.id)}
                    >
                      <Text style={[styles.projectButtonText, newTaskProjectId === proj.id && styles.projectButtonTextActive]} numberOfLines={1}>
                        {proj.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tiempo Estimado</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeSelector}>
                  {timeOptions.map(time => (
                    <TouchableOpacity 
                      key={time} 
                      style={[styles.timeButton, newTaskTime === time && styles.timeButtonActive]} 
                      onPress={() => setNewTaskTime(newTaskTime === time ? null : time)}
                    >
                      <Text style={[styles.timeButtonText, newTaskTime === time && styles.timeButtonTextActive]}>
                        {formatTimeLabel(time)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeAddTaskModal}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, !newTaskTitle.trim() && styles.saveButtonDisabled]} 
                onPress={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                <Text style={[styles.saveButtonText, !newTaskTitle.trim() && styles.saveButtonTextDisabled]}>Crear Tarea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
  dropZoneHighlighted: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9',
    borderWidth: 3,
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
  taskTextContainer: {
    flex: 1,
  },
  taskTextCompleted: { 
    textDecorationLine: 'line-through' 
  },
  taskTimeText: {
    fontSize: 12,
    color: '#6c757d',
    marginRight: 15,
    fontWeight: '500',
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
  draggingTask: {
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    transform: [{ scale: 1.05 }],
  },
  menuOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    justifyContent: 'flex-end' 
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
  moveButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  moveButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  moveOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moveOptionButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  moveOptionEmoji: {
    fontSize: 16,
    marginRight: 6,
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
  // Estilos para AddTaskModal
  addTaskModalContent: { 
    width: '90%', 
    backgroundColor: 'white', 
    borderRadius: 14, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 4, 
    elevation: 5,
    maxHeight: '80%'
  },
  addTaskModalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center', 
    color: '#333' 
  },
  formGroup: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 14, 
    color: '#6c757d', 
    marginBottom: 10, 
    fontWeight: '500' 
  },
  fakeInput: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    paddingVertical: 15, 
    minHeight: 50, 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: '#dee2e6' 
  },
  fakeInputText: { 
    fontSize: 16, 
    color: '#495057' 
  },
  selectorButtons: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  selectorButton: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
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
    color: '#495057', 
    fontWeight: '500' 
  },
  selectorButtonTextActive: { 
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
    alignItems: 'center' 
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
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 10, 
    marginTop: 10 
  },
  saveButtonDisabled: { 
    backgroundColor: '#dee2e6' 
  },
  saveButtonTextDisabled: { 
    color: '#6c757d' 
  },
  cancelButton: { 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    backgroundColor: '#f8f9fa' 
  },
  cancelButtonText: { 
    color: '#6c757d', 
    fontSize: 16, 
    fontWeight: '500' 
  },
  saveButton: { 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    backgroundColor: '#4A90E2' 
  },
  saveButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  moveHint: {
    fontSize: 10,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default MainAppScreen;