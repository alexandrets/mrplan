// src/redux/slices/categoriesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { defaultCategories } from '../../styles/colors';

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (userId, { rejectWithValue }) => {
    try {
      const categoriesSnapshot = await firestore()
        .collection('categories')
        .where('userId', '==', userId)
        .orderBy('name', 'asc')
        .get();
      
      const userCategories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Si no hay categorías, crear las por defecto
      if (userCategories.length === 0) {
        const batch = firestore().batch();
        const categoriesToCreate = defaultCategories.map(category => ({
          ...category,
          userId,
          isDefault: true,
          createdAt: firestore.FieldValue.serverTimestamp(),
        }));
        
        const createdCategories = [];
        for (const category of categoriesToCreate) {
          const docRef = firestore().collection('categories').doc();
          batch.set(docRef, category);
          createdCategories.push({
            id: docRef.id,
            ...category,
            createdAt: new Date(),
          });
        }
        
        await batch.commit();
        return createdCategories;
      }
      
      return userCategories;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async ({ category, userId }, { rejectWithValue }) => {
    try {
      const categoryData = {
        ...category,
        userId,
        isDefault: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };
      
      const docRef = await firestore().collection('categories').add(categoryData);
      
      return {
        id: docRef.id,
        ...category,
        userId,
        isDefault: false,
        createdAt: new Date(),
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ categoryId, updates }, { rejectWithValue }) => {
    try {
      await firestore().collection('categories').doc(categoryId).update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      
      return { categoryId, updates };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      await firestore().collection('categories').doc(categoryId).delete();
      return categoryId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
    selectedCategory: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    clearSelectedCategory: (state) => {
      state.selectedCategory = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create category
      .addCase(createCategory.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.items.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Update category
      .addCase(updateCategory.fulfilled, (state, action) => {
        const { categoryId, updates } = action.payload;
        const index = state.items.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updates };
          // Re-sort if name was updated
          if (updates.name) {
            state.items.sort((a, b) => a.name.localeCompare(b.name));
          }
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Delete category
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter(cat => cat.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectCategoryById = (state, categoryId) =>
  state.categories.items.find(cat => cat.id === categoryId);

export const selectDefaultCategories = (state) =>
  state.categories.items.filter(cat => cat.isDefault);

export const selectCustomCategories = (state) =>
  state.categories.items.filter(cat => !cat.isDefault);

export const {
  clearError,
  setSelectedCategory,
  clearSelectedCategory,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;