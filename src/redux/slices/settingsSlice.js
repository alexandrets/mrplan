// src/redux/slices/settingsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    theme: 'light', // 'light' | 'dark'
    notifications: true,
    language: 'en', // 'en' | 'es'
    defaultTaskSection: 'inbox', // 'inbox' | 'today' | 'next' | 'someday'
    
    // Notification preferences
    notificationPreferences: {
      taskReminders: true,
      dailyReview: true,
      dueDateAlerts: true,
      taskCompletion: false,
    },
    
    // Task preferences
    taskPreferences: {
      autoMoveCompleted: false, // Auto-move completed tasks out of Today
      showCompletedTasks: true,
      defaultPriority: 3, // Medium priority
      defaultEstimatedTime: 30, // 30 minutes
    },
    
    // UI preferences
    uiPreferences: {
      showProgressCircle: true,
      enableHapticFeedback: true,
      enableSoundEffects: false,
      compactMode: false,
    },
    
    // Privacy and sync
    privacy: {
      analyticsEnabled: true,
      crashReportingEnabled: true,
      autoSync: true,
    },
  },
  reducers: {
    updateSettings: (state, action) => {
      return { ...state, ...action.payload };
    },
    
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    
    setDefaultTaskSection: (state, action) => {
      state.defaultTaskSection = action.payload;
    },
    
    updateNotificationPreferences: (state, action) => {
      state.notificationPreferences = {
        ...state.notificationPreferences,
        ...action.payload,
      };
    },
    
    updateTaskPreferences: (state, action) => {
      state.taskPreferences = {
        ...state.taskPreferences,
        ...action.payload,
      };
    },
    
    updateUIPreferences: (state, action) => {
      state.uiPreferences = {
        ...state.uiPreferences,
        ...action.payload,
      };
    },
    
    updatePrivacySettings: (state, action) => {
      state.privacy = {
        ...state.privacy,
        ...action.payload,
      };
    },
    
    toggleNotifications: (state) => {
      state.notifications = !state.notifications;
    },
    
    resetSettings: (state) => {
      return {
        theme: 'light',
        notifications: true,
        language: 'en',
        defaultTaskSection: 'inbox',
        notificationPreferences: {
          taskReminders: true,
          dailyReview: true,
          dueDateAlerts: true,
          taskCompletion: false,
        },
        taskPreferences: {
          autoMoveCompleted: false,
          showCompletedTasks: true,
          defaultPriority: 3,
          defaultEstimatedTime: 30,
        },
        uiPreferences: {
          showProgressCircle: true,
          enableHapticFeedback: true,
          enableSoundEffects: false,
          compactMode: false,
        },
        privacy: {
          analyticsEnabled: true,
          crashReportingEnabled: true,
          autoSync: true,
        },
      };
    },
  },
});

// Selectors
export const selectTheme = (state) => state.settings.theme;
export const selectLanguage = (state) => state.settings.language;
export const selectNotificationPreferences = (state) => state.settings.notificationPreferences;
export const selectTaskPreferences = (state) => state.settings.taskPreferences;
export const selectUIPreferences = (state) => state.settings.uiPreferences;
export const selectPrivacySettings = (state) => state.settings.privacy;

export const {
  updateSettings,
  setTheme,
  setLanguage,
  setDefaultTaskSection,
  updateNotificationPreferences,
  updateTaskPreferences,
  updateUIPreferences,
  updatePrivacySettings,
  toggleNotifications,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;