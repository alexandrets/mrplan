// src/styles/colors.js
export const colors = {
  // Primary Colors
  primary: '#4A90E2',      // Blue
  secondary: '#50C878',    // Green
  background: '#F8F9FA',   // Light Gray
  surface: '#FFFFFF',      // White
  text: '#2C3E50',         // Dark Gray

  // GTD Section Colors
  today: '#E74C3C',        // Red
  next: '#F39C12',         // Orange
  someday: '#3498DB',      // Blue
  inbox: '#95A5A6',        // Gray

  // Status Colors
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',

  // Gray Scale
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',

  // Transparency
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// Default categories for students
export const defaultCategories = [
  { 
    name: 'Animation', 
    color: '#E74C3C', 
    icon: 'movie',
    id: 'cat_animation' 
  },
  { 
    name: 'Programming', 
    color: '#2ECC71', 
    icon: 'code',
    id: 'cat_programming' 
  },
  { 
    name: 'Theory', 
    color: '#3498DB', 
    icon: 'book',
    id: 'cat_theory' 
  },
  { 
    name: 'Group Project', 
    color: '#9B59B6', 
    icon: 'users',
    id: 'cat_group' 
  },
  { 
    name: 'Personal', 
    color: '#F39C12', 
    icon: 'user',
    id: 'cat_personal' 
  }
];

export default colors;