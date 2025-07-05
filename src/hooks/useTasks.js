// src/hooks/useTasks.js
import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Alert } from 'react-native';
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  moveTaskToSection,
  fetchTasks,
  optimisticToggleComplete,
  optimisticMoveTask,
  selectTasksBySection,
  selectTodayProgress,
  selectFilteredTasks,
} from '../redux/slices/tasksSlice';
import { GTD_SECTIONS } from '../utils/constants';

export const useTasks = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const { items: tasks, isLoading, error, filter } = useSelector(state => state.tasks);
  const { user } = useSelector(state => state.auth);
  const { items: categories } = useSelector(state => state.categories);
  
  // Derived data
  const todayProgress = useSelector(selectTodayProgress);
  const filteredTasks = useSelector(selectFilteredTasks);
  
  const todayTasks = useSelector(state => selectTasksBySection(state, GTD_SECTIONS.TODAY));
  const nextTasks = useSelector(state => selectTasksBySection(state, GTD_SECTIONS.NEXT));
  const somedayTasks = useSelector(state => selectTasksBySection(state, GTD_SECTIONS.SOMEDAY));
  const inboxTasks = useSelector(state => selectTasksBySection(state, GTD_SECTIONS.INBOX));

  // Actions
  const refreshTasks = useCallback(async () => {
    if (user?.uid) {
      try {
        await dispatch(fetchTasks(user.uid)).unwrap();
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    }
  }, [dispatch, user?.uid]);

  const addTask = useCallback(async (taskData) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await dispatch(createTask({ 
        task: taskData, 
        userId: user.uid 
      })).unwrap();
      return result;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }, [dispatch, user?.uid]);

  const updateTaskData = useCallback(async (taskId, updates) => {
    try {
      await dispatch(updateTask({ taskId, updates })).unwrap();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [dispatch]);

  const removeTask = useCallback(async (taskId) => {
    try {
      await dispatch(deleteTask(taskId)).unwrap();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }, [dispatch]);

  const toggleComplete = useCallback(async (taskId) => {
    // Optimistic update for better UX
    dispatch(optimisticToggleComplete(taskId));
    
    try {
      await dispatch(toggleTaskComplete(taskId)).unwrap();
    } catch (error) {
      // The slice will revert the optimistic update on error
      console.error('Error toggling task completion:', error);
    }
  }, [dispatch]);

  const moveTask = useCallback(async (taskId, newSection) => {
    // Optimistic update
    dispatch(optimisticMoveTask({ taskId, newSection }));
    
    try {
      await dispatch(moveTaskToSection({ taskId, newSection })).unwrap();
    } catch (error) {
      // Refresh to revert optimistic update
      await refreshTasks();
      console.error('Error moving task:', error);
    }
  }, [dispatch, refreshTasks]);

  const moveTaskWithConfirmation = useCallback((task, newSection) => {
    const sectionNames = {
      [GTD_SECTIONS.TODAY]: 'Today',
      [GTD_SECTIONS.NEXT]: 'Next',
      [GTD_SECTIONS.SOMEDAY]: 'Someday',
      [GTD_SECTIONS.INBOX]: 'Inbox',
    };

    Alert.alert(
      'Move Task',
      `Move "${task.title}" to ${sectionNames[newSection]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Move', 
          onPress: () => moveTask(task.id, newSection),
          style: 'default'
        },
      ]
    );
  }, [moveTask]);

  const deleteTaskWithConfirmation = useCallback((task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => removeTask(task.id),
          style: 'destructive'
        },
      ]
    );
  }, [removeTask]);

  // Helper functions
  const getTaskById = useCallback((taskId) => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  const getTasksByCategory = useCallback((categoryId) => {
    return tasks.filter(task => task.category === categoryId);
  }, [tasks]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      return new Date(task.dueDate) < now;
    });
  }, [tasks]);

  const getDueTodayTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  }, [tasks]);

  const getUpcomingTasks = useCallback((days = 7) => {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);

    return tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= future;
    });
  }, [tasks]);

  const getTaskStats = useCallback(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const overdue = getOverdueTasks().length;
    const dueToday = getDueTodayTasks().length;
    
    return {
      total,
      completed,
      pending: total - completed,
      overdue,
      dueToday,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks, getOverdueTasks, getDueTodayTasks]);

  const getCategoryInfo = useCallback((categoryId) => {
    return categories.find(cat => cat.id === categoryId);
  }, [categories]);

  // Quick actions
  const quickAddToToday = useCallback((title) => {
    return addTask({
      title,
      section: GTD_SECTIONS.TODAY,
      priority: 3,
    });
  }, [addTask]);

  const quickAddToInbox = useCallback((title) => {
    return addTask({
      title,
      section: GTD_SECTIONS.INBOX,
      priority: 3,
    });
  }, [addTask]);

  const moveAllInboxToToday = useCallback(async () => {
    const inboxTasksToMove = inboxTasks.filter(task => !task.completed);
    
    if (inboxTasksToMove.length === 0) return;

    Alert.alert(
      'Move All Inbox Tasks',
      `Move ${inboxTasksToMove.length} tasks from Inbox to Today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move All',
          onPress: async () => {
            try {
              await Promise.all(
                inboxTasksToMove.map(task => 
                  moveTask(task.id, GTD_SECTIONS.TODAY)
                )
              );
            } catch (error) {
              console.error('Error moving tasks:', error);
            }
          }
        }
      ]
    );
  }, [inboxTasks, moveTask]);

  return {
    // Data
    tasks,
    todayTasks,
    nextTasks,
    somedayTasks,
    inboxTasks,
    filteredTasks,
    categories,
    
    // State
    isLoading,
    error,
    filter,
    
    // Computed values
    todayProgress,
    
    // Actions
    refreshTasks,
    addTask,
    updateTaskData,
    removeTask,
    toggleComplete,
    moveTask,
    moveTaskWithConfirmation,
    deleteTaskWithConfirmation,
    
    // Helper functions
    getTaskById,
    getTasksByCategory,
    getOverdueTasks,
    getDueTodayTasks,
    getUpcomingTasks,
    getTaskStats,
    getCategoryInfo,
    
    // Quick actions
    quickAddToToday,
    quickAddToInbox,
    moveAllInboxToToday,
  };
};

export default useTasks;