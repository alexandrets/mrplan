// src/components/sections/GTDSection.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '../../styles/colors';
import { spacing, borderRadius, GTD_SECTIONS } from '../../utils/constants';
import { typography } from '../../styles/typography';
import TaskCard from '../tasks/TaskCard';

const SectionContainer = styled(View)`
  background-color: ${colors.surface};
  border-radius: ${borderRadius.lg}px;
  margin: ${spacing.sm}px ${spacing.md}px;
  padding: ${spacing.md}px;
  shadow-color: ${colors.shadow};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 2;
  min-height: 200px;
`;

const SectionHeader = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.md}px;
  padding-bottom: ${spacing.sm}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.gray200};
`;

const SectionTitle = styled(Text)`
  font-size: ${typography.h2.fontSize}px;
  font-weight: ${typography.h2.fontWeight};
  color: ${props => props.sectionColor || colors.text};
`;

const TaskCount = styled(View)`
  background-color: ${props => props.sectionColor || colors.gray300};
  border-radius: ${borderRadius.round}px;
  padding: ${spacing.xs}px ${spacing.sm}px;
  min-width: 24px;
  align-items: center;
  justify-content: center;
`;

const TaskCountText = styled(Text)`
  font-size: 12px;
  font-weight: ${typography.weights.bold};
  color: ${colors.surface};
`;

const EmptyState = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${spacing.xl}px;
`;

const EmptyStateText = styled(Text)`
  font-size: ${typography.body.fontSize}px;
  color: ${colors.gray500};
  text-align: center;
  line-height: 24px;
`;

const EmptyStateSubtext = styled(Text)`
  font-size: ${typography.caption.fontSize}px;
  color: ${colors.gray400};
  text-align: center;
  margin-top: ${spacing.xs}px;
`;

const AddTaskButton = styled(TouchableOpacity)`
  background-color: ${props => props.sectionColor || colors.primary};
  border-radius: ${borderRadius.md}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  align-items: center;
  justify-content: center;
  margin-top: ${spacing.md}px;
`;

const AddTaskText = styled(Text)`
  color: ${colors.surface};
  font-size: ${typography.body.fontSize}px;
  font-weight: ${typography.weights.semibold};
`;

const DropZone = styled(View)`
  min-height: 60px;
  border: 2px dashed ${props => props.isActive ? props.sectionColor : colors.gray300};
  border-radius: ${borderRadius.md}px;
  align-items: center;
  justify-content: center;
  margin: ${spacing.sm}px 0;
  background-color: ${props => props.isActive ? `${props.sectionColor}20` : 'transparent'};
`;

const DropZoneText = styled(Text)`
  color: ${props => props.isActive ? props.sectionColor : colors.gray400};
  font-size: ${typography.caption.fontSize}px;
  font-weight: ${typography.weights.medium};
`;

const getSectionColor = (sectionKey) => {
  switch (sectionKey) {
    case GTD_SECTIONS.TODAY:
      return colors.today;
    case GTD_SECTIONS.NEXT:
      return colors.next;
    case GTD_SECTIONS.SOMEDAY:
      return colors.someday;
    case GTD_SECTIONS.INBOX:
      return colors.inbox;
    default:
      return colors.primary;
  }
};

const getEmptyStateMessage = (sectionKey) => {
  switch (sectionKey) {
    case GTD_SECTIONS.TODAY:
      return {
        title: "No tasks for today",
        subtitle: "Great! You're all caught up. Add tasks from other sections or create new ones."
      };
    case GTD_SECTIONS.NEXT:
      return {
        title: "No upcoming tasks",
        subtitle: "Plan your next actions here. What should you focus on after today?"
      };
    case GTD_SECTIONS.SOMEDAY:
      return {
        title: "No tasks for someday",
        subtitle: "This is where you store ideas and tasks for the future."
      };
    case GTD_SECTIONS.INBOX:
      return {
        title: "No tasks in inbox",
        subtitle: "Your inbox is empty! Quickly capture new ideas and tasks here."
      };
    default:
      return {
        title: "No tasks",
        subtitle: "Start by adding some tasks to get organized."
      };
  }
};

const GTDSection = ({
  title,
  sectionKey,
  tasks = [],
  categories = [],
  onTaskPress,
  onTaskToggle,
  onTaskSwipeLeft,
  onTaskSwipeRight,
  onAddTask,
  onTaskDrop,
  isDropTarget = false,
  showAddButton = true,
  style,
}) => {
  const sectionColor = getSectionColor(sectionKey);
  const emptyState = getEmptyStateMessage(sectionKey);
  const incompleteTasks = tasks.filter(task => !task.completed);
  const taskCount = incompleteTasks.length;

  const getCategoryInfo = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? { name: category.name, color: category.color } : null;
  };

  const renderTask = ({ item }) => {
    const categoryInfo = getCategoryInfo(item.category);
    
    return (
      <TaskCard
        task={item}
        onPress={onTaskPress}
        onToggleComplete={onTaskToggle}
        onSwipeLeft={onTaskSwipeLeft}
        onSwipeRight={onTaskSwipeRight}
        categoryName={categoryInfo?.name}
        categoryColor={categoryInfo?.color}
      />
    );
  };

  const renderEmptyState = () => (
    <EmptyState>
      <EmptyStateText>{emptyState.title}</EmptyStateText>
      <EmptyStateSubtext>{emptyState.subtitle}</EmptyStateSubtext>
      
      {isDropTarget && (
        <DropZone isActive={isDropTarget} sectionColor={sectionColor}>
          <DropZoneText isActive={isDropTarget} sectionColor={sectionColor}>
            Drop tasks here to move to {title}
          </DropZoneText>
        </DropZone>
      )}
      
      {showAddButton && (
        <AddTaskButton 
          sectionColor={sectionColor}
          onPress={() => onAddTask?.(sectionKey)}
        >
          <AddTaskText>+ Add Task</AddTaskText>
        </AddTaskButton>
      )}
    </EmptyState>
  );

  return (
    <SectionContainer style={style}>
      <SectionHeader>
        <SectionTitle sectionColor={sectionColor}>
          {title}
        </SectionTitle>
        {taskCount > 0 && (
          <TaskCount sectionColor={sectionColor}>
            <TaskCountText>{taskCount}</TaskCountText>
          </TaskCount>
        )}
      </SectionHeader>

      {incompleteTasks.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={incompleteTasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            showAddButton ? (
              <AddTaskButton 
                sectionColor={sectionColor}
                onPress={() => onAddTask?.(sectionKey)}
              >
                <AddTaskText>+ Add Task</AddTaskText>
              </AddTaskButton>
            ) : null
          }
        />
      )}
    </SectionContainer>
  );
};

export default GTDSection;