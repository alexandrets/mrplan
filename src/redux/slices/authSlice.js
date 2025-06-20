// src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Async thunks para Firebase Auth
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Obtener datos adicionales del usuario desde Firestore
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || userData.displayName || '',
        university: userData.university || '',
        course: userData.course || '',
        preferences: userData.preferences || {
          theme: 'light',
          notifications: true,
          language: 'en',
          defaultTaskSection: 'inbox'
        }
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password, displayName, university, course }, { rejectWithValue }) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Actualizar perfil
      await user.updateProfile({ displayName });
      
      // Crear documento de usuario en Firestore
      const userData = {
        email: user.email,
        displayName,
        university: university || '',
        course: course || '',
        createdAt: firestore.FieldValue.serverTimestamp(),
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en',
          defaultTaskSection: 'inbox'
        }
      };
      
      await firestore().collection('users').doc(user.uid).set(userData);
      
      return {
        uid: user.uid,
        email: user.email,
        displayName,
        university: university || '',
        course: course || '',
        preferences: userData.preferences
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await auth().signOut();
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (updates, { getState, rejectWithValue }) => {
    try {
      const { auth: { user } } = getState();
      
      if (!user) {
        throw new Error('No user logged in');
      }
      
      // Actualizar en Firestore
      await firestore().collection('users').doc(user.uid).update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      
      return updates;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isInitialized: false, // Para saber si ya verificamos el estado de auth
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAuthInitialized: (state) => {
      state.isInitialized = true;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
    },
    updateUserPreferences: (state, action) => {
      if (state.user) {
        state.user.preferences = {
          ...state.user.preferences,
          ...action.payload
        };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update profile cases
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  setAuthInitialized, 
  setUser, 
  updateUserPreferences 
} = authSlice.actions;

export default authSlice.reducer;