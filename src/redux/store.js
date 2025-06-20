// src/utils/constants.js

// GTD Sections
export const GTD_SECTIONS = {
  INBOX: 'inbox',
  TODAY: 'today',
  NEXT: 'next',
  SOMEDAY: 'someday',
};

export const GTD_SECTION_LABELS = {
  [GTD_SECTIONS.INBOX]: 'Inbox',
  [GTD_SECTIONS.TODAY]: 'Today',
  [GTD_SECTIONS.NEXT]: 'Next',
  [GTD_SECTIONS.SOMEDAY]: 'Someday',
};

// Task Priorities
export const TASK_PRIORITIES = {
  LOWEST: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  HIGHEST: 5,
};

export const PRIORITY_LABELS = {
  [TASK_PRIORITIES.LOWEST]: 'Lowest',
  [TASK_PRIORITIES.LOW]: 'Low',
  [TASK_PRIORITIES.MEDIUM]: 'Medium',
  [TASK_PRIORITIES.HIGH]: 'High',
  [TASK_PRIORITIES.HIGHEST]: 'Highest',
};

// Spacing System
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

// Animation Durations
export const animationDuration = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Screen Dimensions
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

export const screen = {
  width,
  height,
  isSmall: width < 375,
  isMedium: width >= 375 && width < 414,
  isLarge: width >= 414,
};

// Task Quick Templates for Students
export const QUICK_TASK_TEMPLATES = [
  {
    id: 'assignment',
    title: 'Assignment Due - [Course]',
    category: 'cat_theory',
    section: GTD_SECTIONS.TODAY,
  },
  {
    id: 'exam_study',
    title: 'Study for Exam - [Subject]',
    category: 'cat_theory',
    section: GTD_SECTIONS.TODAY,
  },
  {
    id: 'group_meeting',
    title: 'Group Meeting - [Project]',
    category: 'cat_group',
    section: GTD_SECTIONS.NEXT,
  },
  {
    id: 'read_chapter',
    title: 'Read Chapter [X] - [Course]',
    category: 'cat_theory',
    section: GTD_SECTIONS.NEXT,
  },
  {
    id: 'animation_practice',
    title: 'Animation Practice - [Technique]',
    category: 'cat_animation',
    section: GTD_SECTIONS.SOMEDAY,
  },
  {
    id: 'coding_project',
    title: 'Code Project - [Feature]',
    category: 'cat_programming',
    section: GTD_SECTIONS.NEXT,
  },
];

export default {
  GTD_SECTIONS,
  GTD_SECTION_LABELS,
  TASK_PRIORITIES,
  PRIORITY_LABELS,
  spacing,
  borderRadius,
  animationDuration,
  screen,
  QUICK_TASK_TEMPLATES,
};