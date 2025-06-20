import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { DraxView, DraxList } from 'react-native-drax';
import { useAuth } from '../context/AuthContext';
import DashboardScreenCircle from './DashboardScreenCircle';

//import DashboardScreen from './DashboardScreen';

// Componente temporal mientras no tenemos el real
const DashboardScreen = ({ tasks, onNavigateToGTD }) => {
  return (
    <View style={{ flex: 1, backgroundColor: '#4A90E2', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>Dashboard</Text>
      <TouchableOpacity 
        onPress={onNavigateToGTD}
        style={{ marginTop: 20, padding: 10, backgroundColor: 'white', borderRadius: 5 }}
      >
        <Text>Go to GTD</Text>
      </TouchableOpacity>
    </View>
  );
};


const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MainAppScreen = () => {
  const { logout, user } = useAuth();
  const [tasks, setTasks] = useState([
    // Mock data para empezar
    { id: '1', title: 'Call Alex', section: 'today', completed: false, dateCreated: Date.now() },
    { id: '2', title: 'Write report', section: 'today', completed: false, dateCreated: Date.now() },
    { id: '3', title: 'Revisar emails', section: 'today', completed: true, dateCreated: Date.now() },
    { id: '4', title: 'Preparar presentación', section: 'next', completed: false, dateCreated: Date.now() },
    { id: '5', title: 'Organizar escritorio', section: 'next', completed: false, dateCreated: Date.now() },
    { id: '6', title: 'Comprar leche', section: 'inbox', completed: false, dateCreated: Date.now() },
    { id: '7', title: 'Leer libro sobre productividad', section: 'someday', completed: false, dateCreated: Date.now() },
  ]);

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSection, setNewTaskSection] = useState('inbox');
  const [isDragging, setIsDragging] = useState(false);

  // Animation for slide up/down
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Filtrar tareas por sección - OCULTAR COMPLETADAS
  const getTasks = (section) => {
    return tasks.filter(task => task.section === section && !task.completed);
  };

  // Navegación hacia GTD (slide up)
  const navigateToGTD = () => {
    Animated.timing(slideAnim, {
      toValue: -SCREEN_HEIGHT,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // Navegación hacia Dashboard (slide down)
  const navigateToDashboard = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // Agregar nueva tarea
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        section: newTaskSection,
        completed: false,
        dateCreated: Date.now(),
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setShowAddTask(false);
    }
  };

  // Completar tarea
  const completeTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Eliminar tarea
  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Mover tarea a nueva sección
  const moveTaskToSection = (taskId, fromSection, toSection) => {
    if (fromSection === toSection) return;
    
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, section: toSection } : task
      )
    );
  };

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      Alert.alert('Error', result.error);
    }
  };

  // 🎯 Componente de Tarea con Drax
  const DraggableTask = ({ task, section }) => {
    return (
      <DraxView
        style={[styles.taskItem]}
        draggingStyle={styles.dragging}
        dragReleasedStyle={styles.released}
        hoverDraggingStyle={styles.hoverDragging}
        dragPayload={{ taskId: task.id, fromSection: section }}
        longPressDelay={150}
        onDragStart={() => {
          setIsDragging(true);
          console.log('Started dragging:', task.title);
        }}
        onDragEnd={() => {
          setIsDragging(false);
          console.log('Ended dragging:', task.title);
        }}
        renderContent={({ viewState }) => {
          const opacity = viewState?.dragging ? 0.5 : 1;
          return (
            <View style={[styles.taskContent, { opacity }]}>
              <TouchableOpacity 
                style={[styles.taskCheckbox, task.completed && styles.taskCompleted]}
                onPress={() => completeTask(task.id)}
              >
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              
              <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
                {task.title}
              </Text>
              
              <TouchableOpacity onPress={() => deleteTask(task.id)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>×</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    );
  };

  // 🎯 Sección con Drop Zone
  const TaskSection = ({ title, sectionKey, tasks: sectionTasks }) => {
    const [isReceiving, setIsReceiving] = useState(false);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {sectionTasks.length > 0 && (
            <Text style={styles.taskCount}>{sectionTasks.length}</Text>
          )}
        </View>

        <DraxView
          style={[
            styles.dropZone,
            isReceiving && styles.dropZoneActive,
            sectionTasks.length === 0 && styles.dropZoneEmpty
          ]}
          receivingStyle={styles.receiving}
          onReceiveDragEnter={() => {
            setIsReceiving(true);
          }}
          onReceiveDragExit={() => {
            setIsReceiving(false);
          }}
          onReceiveDragDrop={({ dragged: { payload } }) => {
            setIsReceiving(false);
            moveTaskToSection(payload.taskId, payload.fromSection, sectionKey);
          }}
        >
          {sectionTasks.length === 0 ? (
            <Text style={styles.emptyMessage}>
              {isDragging ? 'Drop task here' : `No tasks in ${title.toLowerCase()}`}
            </Text>
          ) : (
            <View style={styles.tasksList}>
              {sectionTasks.map(task => (
                <DraggableTask
                  key={task.id}
                  task={task}
                  section={sectionKey}
                />
              ))}
            </View>
          )}
        </DraxView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* GTD Screen (Background - always rendered) */}
      <SafeAreaView style={styles.gtdContainer}>
        {/* GTD Header */}
        <View style={styles.gtdHeader}>
          <Text style={styles.gtdAppTitle}>GTD</Text>
        </View>

        {/* Barrita para regresar al Dashboard */}
        <TouchableOpacity 
          style={styles.gtdNavigationHandle}
          onPress={navigateToDashboard}
          activeOpacity={0.7}
        >
          <View style={styles.gtdHandleBar} />
        </TouchableOpacity>

        <ScrollView 
          style={styles.gtdContent} 
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isDragging}
          contentContainerStyle={styles.gtdScrollContent}
        >
          {/* Lista vertical de secciones */}
          <TaskSection
            title="Inbox"
            sectionKey="inbox"
            tasks={getTasks('inbox')}
          />

          <TaskSection
            title="Today"
            sectionKey="today"
            tasks={getTasks('today')}
          />

          <TaskSection
            title="Next"
            sectionKey="next"
            tasks={getTasks('next')}
          />

          <TaskSection
            title="Someday"
            sectionKey="someday"
            tasks={getTasks('someday')}
          />
        </ScrollView>

        {/* Add Task Button */}
        <TouchableOpacity 
          style={styles.gtdAddButton}
          onPress={() => setShowAddTask(true)}
        >
          <Text style={styles.gtdAddButtonText}>Add Task</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Dashboard Screen (Overlay - slides up/down) */}
      <Animated.View 
        style={[
          styles.dashboardContainer,
          {
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
    <DashboardScreenCircle 
  tasks={tasks}
  setTasks={setTasks}
  onNavigateToGTD={navigateToGTD}
/>
      </Animated.View>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTask}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            
            <TextInput
              style={styles.taskInput}
              placeholder="Enter task title..."
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus={true}
            />

            <View style={styles.sectionSelector}>
              <Text style={styles.selectorLabel}>Add to:</Text>
              <View style={styles.selectorButtons}>
                {['inbox', 'today', 'next', 'someday'].map(section => (
                  <TouchableOpacity
                    key={section}
                    style={[
                      styles.selectorButton,
                      newTaskSection === section && styles.selectorButtonActive
                    ]}
                    onPress={() => setNewTaskSection(section)}
                  >
                    <Text style={[
                      styles.selectorButtonText,
                      newTaskSection === section && styles.selectorButtonTextActive
                    ]}>
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddTask(false);
                  setNewTaskTitle('');
                  setNewTaskSection('inbox');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.addTaskButton}
                onPress={handleAddTask}
              >
                <Text style={styles.addTaskButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // GTD Screen Styles
  gtdContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gtdHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  gtdAppTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  gtdNavigationHandle: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  gtdHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dee2e6',
  },
  gtdContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gtdScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  gtdAddButton: {
    backgroundColor: '#007bff',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  gtdAddButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Dashboard Screen Styles (Overlay)
  dashboardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4A90E2',
  },
  
  // Secciones
  section: {
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
  },
  taskCount: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Drop Zone
  dropZone: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    minHeight: 80,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  dropZoneActive: {
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
  },
  dropZoneEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiving: {
    borderColor: '#28a745',
    backgroundColor: '#e8f5e9',
    borderStyle: 'solid',
  },
  
  // Tareas
  tasksList: {
    gap: 8,
  },
  taskItem: {
    marginBottom: 8,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dragging: {
    opacity: 0.5,
  },
  released: {
    opacity: 1,
  },
  hoverDragging: {
    borderColor: '#007bff',
    borderWidth: 2,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#dee2e6',
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCompleted: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#adb5bd',
  },
  deleteButton: {
    padding: 5,
  },
  deleteText: {
    color: '#dc3545',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyMessage: {
    color: '#adb5bd',
    fontStyle: 'italic',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 15,
    textAlign: 'center',
  },
  taskInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  sectionSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  selectorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#f8f9fa',
  },
  selectorButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  selectorButtonText: {
    fontSize: 14,
    color: '#495057',
  },
  selectorButtonTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  addTaskButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007bff',
    alignItems: 'center',
  },
  addTaskButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainAppScreen;