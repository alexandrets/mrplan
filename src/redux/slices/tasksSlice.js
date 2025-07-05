// src/redux/slices/tasksSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { GTD_SECTIONS } from '../../utils/constants';

// Async thunks para Firebase Firestore
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (userId, { rejectWithValue }) => {
    try {
      const tasksSnapshot = await firestore()
        .collection('tasks')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
      }));
      
      return tasks;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async ({ task, userId }, { rejectWithValue }) => {
    try {
      const taskData = {
        ...task,
        userId,
        completed: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        sortOrder: Date.now(), // Para ordenamiento
      };
      
      if (task.dueDate) {
        taskData.dueDate = firestore.Timestamp.fromDate(new Date(task.dueDate));
      }
      
      const docRef = await firestore().collection('tasks').add(taskData);
      
      return {
        id: docRef.id,
        ...task,
        userId,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        sortOrder: taskData.sortOrder,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, updates }, { rejectWithValue }) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      
      if (updates.dueDate) {
        updateData.dueDate = firestore.Timestamp.fromDate(new Date(updates.dueDate));
      }
      
      await firestore().collection('tasks').doc(taskId).update(updateData);
      
      return { taskId, updates: { ...updates, updatedAt: new Date() } };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      await firestore().collection('tasks').doc(taskId).delete();
      return taskId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const moveTaskToSection = createAsyncThunk(
  'tasks/moveTaskToSection',
  async ({ taskId, newSection }, { rejectWithValue }) => {
    try {
      await firestore().collection('tasks').doc(taskId).update({
        section: newSection,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      
      return { taskId, newSection };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleTaskComplete = createAsyncThunk(
  'tasks/toggleTaskComplete',
  async (taskId, { getState, rejectWithValue }) => {
    try {
      const { tasks } = getState();
      const task = tasks.items.find(t => t.id === taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      const newCompleted = !task.completed;
      
      await firestore().collection('tasks').doc(taskId).update({
        completed: newCompleted,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      
      return { taskId, completed: newCompleted };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    filter: {
      section: null,
      category: null,
      completed: null,
      searchQuery: '',
    },
    isLoading: false,
    error: null,
    lastSync: null,
    selectedTask: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilter: (state, action) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearFilter: (state) => {
      state.filter = {
        section: null,
        category: null,
        completed: null,
        searchQuery: '',
      };
    },
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
    // Optimistic updates para mejor UX
    optimisticToggleComplete: (state, action) => {
      const task = state.items.find(t => t.id === action.payload);
      if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date();
      }
    },
    optimisticMoveTask: (state, action) => {
      const { taskId, newSection } = action.payload;
      const task = state.items.find(t => t.id === taskId);
      if (task) {
        task.section = newSection;
        task.updatedAt = new Date();
      }
    },
    // Reorder tasks within a section
    reorderTasks: (state, action) => {
      const { section, taskIds } = action.payload;
      taskIds.forEach((taskId, index) => {
        const task = state.items.find(t => t.id === taskId);
        if (task && task.section === section) {
          task.sortOrder = Date.now() + index;
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.lastSync = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.unshift(action.payload); // Add to beginning
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const { taskId, updates } = action.payload;
        const index = state.items.findIndex(task => task.id === taskId);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updates };
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter(task => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Move task to section
      .addCase(moveTaskToSection.fulfilled, (state, action) => {
        const { taskId, newSection } = action.payload;
        const task = state.items.find(t => t.id === taskId);
        if (task) {
          task.section = newSection;
          task.updatedAt = new Date();
        }
      })
      .addCase(moveTaskToSection.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Toggle complete
      .addCase(toggleTaskComplete.fulfilled, (state, action) => {
        const { taskId, completed } = action.payload;
        const task = state.items.find(t => t.id === taskId);
        if (task) {
          task.completed = completed;
          task.updatedAt = new Date();
        }
      })
      .addCase(toggleTaskComplete.rejected, (state, action) => {
        state.error = action.payload;
        // Revert optimistic update
        const taskId = action.meta.arg;
        const task = state.items.find(t => t.id === taskId);
        if (task) {
          task.completed = !task.completed;
        }
      });
  },
});

// Selectors
export const selectTasksBySection = (state, section) =>
  state.tasks.items.filter(task => task.section === section);

export const selectTodayProgress = (state) => {
  const todayTasks = state.tasks.items.filter(task => task.section === GTD_SECTIONS.TODAY);
  if (todayTasks.length === 0) return 0;
  
  const completedTasks = todayTasks.filter(task => task.completed);
  return Math.round((completedTasks.length / todayTasks.length) * 100);
};

export const selectFilteredTasks = (state) => {
  const { items, filter } = state.tasks;
  let filtered = items;
  
  if (filter.section) {
    filtered = filtered.filter(task => task.section === filter.section);
  }
  
  if (filter.category) {
    filtered = filtered.filter(task => task.category === filter.category);
  }
  
  if (filter.completed !== null) {
    filtered = filtered.filter(task => task.completed === filter.completed);
  }
  
  if (filter.searchQuery) {
    const query = filter.searchQuery.toLowerCase();
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query))
    );
  }
  
  return filtered.sort((a, b) => {
    // Sort by sortOrder, then by creation date
    if (a.sortOrder !== b.sortOrder) {
      return b.sortOrder - a.sortOrder;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

export const {
  clearError,
  setFilter,
  clearFilter,
  setSelectedTask,
  clearSelectedTask,
  optimisticToggleComplete,
  optimisticMoveTask,
  reorderTasks,
} = tasksSlice.actions;

export default tasksSlice.reducer;