// src/screens/ProjectsScreen.js

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  LayoutAnimation,
  UIManager,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { 
  createProject, 
  subscribeToUserProjects, 
  subscribeToUserTasks,
  updateTask,
  deleteTask,
  createTask,
} from '../services/firebaseService';
import EditTaskModal from '../components/EditTaskModal'; 

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const timeOptions = [15, 30, 60, 120, 180, 240, 300];

const formatTimeLabel = (minutes) => {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}'`;
  return `${minutes / 60}h`;
};


// --- Componente para una Tarea Individual (Interactiva) ---
const ProjectTaskItem = ({ task, onToggleComplete, onOpenMenu }) => {
  const estimatedTimeLabel = task.estimatedTime ? formatTimeLabel(task.estimatedTime) : '';

  return (
    // La modificación de estilo se aplica aquí
    <View style={[styles.projectTaskItem, task.section === 'today' && styles.todayTaskBackground]}>
      <TouchableOpacity 
        style={[styles.taskCheckbox, task.completed && styles.taskCheckboxCompleted]} 
        onPress={() => onToggleComplete(task.id, !task.completed)}
      >
        {task.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <Text style={[styles.projectTaskName, task.completed && styles.projectTaskNameCompleted]}>
        {task.title}
      </Text>
      {task.estimatedTime > 0 && <Text style={styles.taskTime}>{estimatedTimeLabel}</Text>}
      <TouchableOpacity style={styles.optionsButton} onPress={() => onOpenMenu(task)}>
        <View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} />
      </TouchableOpacity>
    </View>
  );
};


// --- Componente para un Proyecto Individual ---
const ProjectItem = ({ project, tasks, isExpanded, onPress, onToggleComplete, onOpenMenu, onAddTaskPress }) => {
  
  const progressData = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { completedHours: 0, totalHours: 0, percentage: 0 };
    }
    const totalMinutes = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
    const completedMinutes = tasks.reduce((sum, task) => 
      task.completed ? sum + (task.estimatedTime || 0) : sum
    , 0);

    const totalHours = totalMinutes / 60;
    const completedHours = completedMinutes / 60;
    const percentage = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;

    return { completedHours, totalHours, percentage };
  }, [tasks]);

  return (
    <View style={styles.projectItemContainer}>
      <TouchableOpacity style={styles.projectItem} onPress={onPress} activeOpacity={0.8}>
        <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
          <Text style={styles.projectIcon}>📁</Text>
          <Text style={styles.projectName}>{project.name}</Text>
        </View>
        <Text style={styles.arrowIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      <View style={styles.progressInfoContainer}>
        <Text style={styles.progressText}>
          {`${progressData.completedHours.toFixed(1)}h de ${progressData.totalHours.toFixed(1)}h completadas`}
        </Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressData.percentage}%` }]} />
        </View>
      </View>

      {isExpanded && (
        <View style={styles.tasksContainer}>
          {tasks.length > 0 && tasks.map(task => 
              <ProjectTaskItem key={task.id} task={task} onToggleComplete={onToggleComplete} onOpenMenu={onOpenMenu} />
          )}
          <TouchableOpacity style={styles.addTaskInsideProjectButton} onPress={onAddTaskPress}>
            <Text style={styles.addTaskIcon}>+</Text>
            <Text style={styles.addTaskText}>Añadir Tarea</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


// --- Pantalla de Proyectos Principal ---
const ProjectsScreen = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Estados para manejo de TAREAS
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddTaskModalVisible, setIsAddTaskModalVisible] = useState(false);
  
  // Estados para el formulario de Nueva Tarea
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSection, setNewTaskSection] = useState('inbox');
  const [newTaskTime, setNewTaskTime] = useState(null);
  const [newTaskProjectId, setNewTaskProjectId] = useState(null);

  useEffect(() => {
    if (user) {
      const unsubProjects = subscribeToUserProjects(user.uid, setProjects);
      const unsubTasks = subscribeToUserTasks(user.uid, setAllTasks);
      return () => {
        unsubProjects();
        unsubTasks();
      };
    }
  }, [user]);

  // Handlers para TAREAS
  const handleToggleComplete = (taskId, newStatus) => updateTask(taskId, { completed: newStatus });
  const handleOpenMenu = (task) => { setSelectedTask(task); setIsMenuVisible(true); };
  const handleCloseMenu = () => { setIsMenuVisible(false); setSelectedTask(null); };
  const handleEdit = () => { if (!selectedTask) return; setIsMenuVisible(false); setTimeout(() => setIsEditModalVisible(true), 150); };
  const handleDelete = () => { if (!selectedTask) return; Alert.alert("Borrar Tarea", `¿Seguro que quieres borrar "${selectedTask.title}"?`, [{ text: "Cancelar", style: "cancel", onPress: handleCloseMenu },{ text: "Borrar", style: "destructive", onPress: () => { deleteTask(selectedTask.id); handleCloseMenu(); }}]);};
  const handleUpdateTask = (taskId, updates) => { updateTask(taskId, updates); setIsEditModalVisible(false); setSelectedTask(null);};

  // Handlers para AÑADIR Tarea
  const handleOpenAddTaskModal = (projectId) => {
    setNewTaskProjectId(projectId);
    setIsAddTaskModalVisible(true);
  };
  const handleCloseAddTaskModal = () => {
    setIsAddTaskModalVisible(false);
    setNewTaskTitle('');
    setNewTaskSection('inbox');
    setNewTaskTime(null);
    setNewTaskProjectId(null);
  };
  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) { Alert.alert("El título no puede estar vacío."); return; }
    createTask({ title: newTaskTitle.trim(), section: newTaskSection, userId: user.uid, estimatedTime: newTaskTime, projectId: newTaskProjectId, completed: false });
    handleCloseAddTaskModal();
  };

  // Handlers para PROYECTOS
  const handleCreateProject = () => { if (newProjectName.trim() && user) { createProject({ name: newProjectName.trim(), userId: user.uid }); setNewProjectName(''); setIsProjectModalVisible(false); } };
  const handleProjectPress = (projectId) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpandedProjectId(expandedProjectId === projectId ? null : projectId); };

  const renderProject = ({ item }) => {
    const projectTasks = allTasks.filter(task => task.projectId === item.id);
    return (
      <ProjectItem
        project={item}
        tasks={projectTasks}
        isExpanded={expandedProjectId === item.id}
        onPress={() => handleProjectPress(item.id)}
        onToggleComplete={handleToggleComplete}
        onOpenMenu={handleOpenMenu}
        onAddTaskPress={() => handleOpenAddTaskModal(item.id)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Proyectos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsProjectModalVisible(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={projects} renderItem={renderProject} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.emptyProjectText}>Aún no tienes proyectos. ¡Crea el primero!</Text>} />

      <Modal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={handleCloseMenu}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={handleCloseMenu}>
          <View style={styles.menuContainer}><TouchableOpacity style={styles.menuOption} onPress={handleEdit}><Text style={styles.menuIcon}>✏️</Text><Text style={styles.menuOptionText}>Editar</Text></TouchableOpacity><View style={styles.menuDivider} /><TouchableOpacity style={styles.menuOption} onPress={handleDelete}><Text style={styles.menuIcon}>🗑️</Text><Text style={[styles.menuOptionText, {color: '#E74C3C'}]}>Borrar</Text></TouchableOpacity></View>
          <TouchableOpacity style={[styles.menuContainer, styles.cancelMenu]} onPress={handleCloseMenu}><Text style={[styles.menuOptionText, {fontWeight: '600', textAlign: 'center'}]}>Cancelar</Text></TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <EditTaskModal visible={isEditModalVisible} task={selectedTask} projects={projects} onClose={() => { setIsEditModalVisible(false); setSelectedTask(null); }} onSave={handleUpdateTask} />
      
      <Modal visible={isAddTaskModalVisible} transparent={true} animationType="fade" onRequestClose={handleCloseAddTaskModal}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={handleCloseAddTaskModal}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Nueva Tarea</Text>
              <TextInput style={styles.input} placeholder="Título de la tarea..." value={newTaskTitle} onChangeText={setNewTaskTitle} autoFocus={true} />
              
              <Text style={styles.label}>Sección:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScrollView}>
                  {['inbox', 'today', 'next', 'someday'].map(section => (
                      <TouchableOpacity key={section} style={[styles.selectorButton, newTaskSection === section && styles.selectorButtonActive]} onPress={() => setNewTaskSection(section)}>
                          <Text style={[styles.selectorButtonText, newTaskSection === section && styles.selectorButtonTextActive]}>{section.charAt(0).toUpperCase() + section.slice(1)}</Text>
                      </TouchableOpacity>
                  ))}
              </ScrollView>
              
              <Text style={styles.label}>Proyecto:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScrollView}>
                  <TouchableOpacity style={[styles.projectSelectorButton, !newTaskProjectId && styles.projectSelectorButtonActive]} onPress={() => setNewTaskProjectId(null)}><Text style={[styles.projectSelectorButtonText, !newTaskProjectId && styles.projectSelectorButtonTextActive]}>Ninguno</Text></TouchableOpacity>
                  {projects.map(proj => (
                      <TouchableOpacity key={proj.id} style={[styles.projectSelectorButton, newTaskProjectId === proj.id && styles.projectSelectorButtonActive]} onPress={() => setNewTaskProjectId(proj.id)}><Text style={[styles.projectSelectorButtonText, newTaskProjectId === proj.id && styles.projectSelectorButtonTextActive]}>{proj.name}</Text></TouchableOpacity>
                  ))}
              </ScrollView>
              
              <Text style={styles.label}>Tiempo Estimado:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScrollView}>
                  {timeOptions.map(time => (
                      <TouchableOpacity key={time} style={[styles.timeButton, newTaskTime === time && styles.timeButtonActive]} onPress={() => setNewTaskTime(newTaskTime === time ? null : time)}><Text style={[styles.timeButtonText, newTaskTime === time && styles.timeButtonTextActive]}>{formatTimeLabel(time)}</Text></TouchableOpacity>
                  ))}
              </ScrollView>

              <View style={styles.modalActions}>
                  <TouchableOpacity onPress={handleCloseAddTaskModal}><Text style={styles.cancelButton}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.createButton} onPress={handleCreateTask}><Text style={styles.createButtonText}>Crear Tarea</Text></TouchableOpacity>
              </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      <Modal visible={isProjectModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsProjectModalVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Nuevo Proyecto</Text><TextInput style={styles.input} placeholder="Nombre del proyecto" value={newProjectName} onChangeText={setNewProjectName} autoFocus /><View style={styles.modalActions}><TouchableOpacity onPress={() => setIsProjectModalVisible(false)}><Text style={styles.cancelButton}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.createButton} onPress={handleCreateProject}><Text style={styles.createButtonText}>Crear</Text></TouchableOpacity></View></View></View>
      </Modal>
    </SafeAreaView>
  );
};


// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50' },
  addButton: { backgroundColor: '#4A90E2', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyProjectText: { textAlign: 'center', marginTop: 50, color: '#95A5A6', fontSize: 16 },
  projectItemContainer: { backgroundColor: 'white', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
  projectItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  projectIcon: { fontSize: 20, marginRight: 15 },
  projectName: { fontSize: 16, color: '#2C3E50', fontWeight: '600' },
  arrowIcon: { fontSize: 16, color: '#adb5bd' },
  progressInfoContainer: { paddingHorizontal: 20, paddingBottom: 20, marginTop: -10 },
  progressText: { fontSize: 13, color: '#6c757d', marginBottom: 8, fontWeight: '500' },
  progressBarBackground: { height: 8, backgroundColor: '#e9ecef', borderRadius: 4, },
  progressBarFill: { height: '100%', backgroundColor: '#50C878', borderRadius: 4, },
  tasksContainer: { paddingTop: 10, paddingBottom: 5, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#f1f3f5' },
  projectTaskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, marginHorizontal: -10, },
  taskCheckbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#dee2e6', marginRight: 15, alignItems: 'center', justifyContent: 'center' },
  taskCheckboxCompleted: { backgroundColor: '#50C878', borderColor: '#50C878' },
  checkmark: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  projectTaskName: { flex: 1, fontSize: 15, color: '#495057' },
  projectTaskNameCompleted: { textDecorationLine: 'line-through', color: '#adb5bd' },
  taskTime: { fontSize: 14, fontWeight: '500', color: '#adb5bd', marginLeft: 8 },
  optionsButton: { padding: 8, marginLeft: 8 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#adb5bd', marginBottom: 2 },
  addTaskInsideProjectButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginTop: 5, borderTopWidth: 1, borderTopColor: '#f1f3f5', },
  addTaskIcon: { fontSize: 20, color: '#adb5bd', marginRight: 15, },
  addTaskText: { fontSize: 15, color: '#adb5bd', fontStyle: 'italic', },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#dee2e6', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  cancelButton: { fontSize: 16, color: '#6c757d', paddingVertical: 10, paddingHorizontal: 10 },
  createButton: { backgroundColor: '#4A90E2', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end', },
  menuContainer: { backgroundColor: Platform.OS === 'ios' ? 'rgba(249, 249, 249, 0.94)' : 'white', marginHorizontal: 10, borderRadius: 14, overflow: 'hidden' },
  cancelMenu: { marginTop: 8, marginBottom: Platform.OS === 'ios' ? 30 : 10 },
  menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  menuIcon: { fontSize: 20, width: 24, textAlign: 'center' },
  menuOptionText: { fontSize: 18, marginLeft: 15 },
  menuDivider: { height: 1, backgroundColor: '#e9ecef', marginLeft: 55 },
  label: { fontSize: 14, color: '#6c757d', marginBottom: 8, fontWeight: '500' },
  selectorScrollView: { marginBottom: 15, paddingBottom: 5 },
  selectorButton: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: '#dee2e6', backgroundColor: '#f8f9fa', marginRight: 10 },
  selectorButtonActive: { backgroundColor: '#4A90E2', borderColor: '#4A90E2' },
  selectorButtonText: { fontSize: 14, color: '#495057' },
  selectorButtonTextActive: { color: '#ffffff' },
  projectSelectorButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', marginRight: 10 },
  projectSelectorButtonActive: { backgroundColor: '#50C878', borderColor: '#50C878' },
  projectSelectorButtonText: { color: '#495057', fontWeight: '500' },
  projectSelectorButtonTextActive: { color: '#ffffff' },
  timeButton: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: '#4A90E2', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', marginRight: 10 },
  timeButtonActive: { backgroundColor: '#4A90E2' },
  timeButtonText: { color: '#4A90E2', fontWeight: '600' },
  timeButtonTextActive: { color: '#ffffff' },
  
  // --- Estilo para resaltar la tarea ---
  todayTaskBackground: {
    backgroundColor: '#FFFACD', // Lemon Chiffon
    borderRadius: 8,
  },
});

export default ProjectsScreen;