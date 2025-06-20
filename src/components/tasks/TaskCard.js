// src/components/tasks/TaskCard.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../../styles/colors';
import { spacing, borderRadius, TASK_PRIORITIES } from '../../utils/constants';
import { typography } from '../../styles/typography';

const CardContainer = styled(Animated.View)`
  background-color: ${colors.surface};
  border-radius: ${borderRadius.md}px;
  padding: ${spacing.md}px;
  margin-bottom: ${spacing.sm}px;
  shadow-color: ${colors.shadow};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 2;
  border-left-width: 4px;
  border-left-color: ${props => props.categoryColor || colors.primary};
`;

const TaskHeader = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.xs}px;
`;

const TaskTitle = styled(Text)`
  font-size: ${typography.h3.fontSize}px;
  font-weight: ${typography.h3.fontWeight};
  color: ${props => props.completed ? colors.gray500 : colors.text};
  text-decoration-line: ${props => props.completed ? 'line-through' : 'none'};
  flex: 1;
  margin-right: ${spacing.sm}px;
`;

const TaskDescription = styled(Text)`
  font-size: ${typography.caption.fontSize}px;
  color: ${colors.gray600};
  margin-bottom: ${spacing.xs}px;
  line-height: ${typography.caption.lineHeight}px;
`;

const TaskFooter = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: ${spacing.xs}px;
`;

const CategoryTag = styled(View)`
  background-color: ${props => props.color || colors.gray200};
  border-radius: ${borderRadius.sm}px;
  padding: ${spacing.xs}px ${spacing.sm}px;
`;

const CategoryText = styled(Text)`
  font-size: 12px;
  color: ${colors.surface};
  font-weight: ${typography.weights.medium};
`;

const PriorityIndicator = styled(View)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${props => {
    switch (props.priority) {
      case TASK_PRIORITIES.HIGHEST: return colors.today;
      case TASK_PRIORITIES.HIGH: return colors.next;
      case TASK_PRIORITIES.MEDIUM: return colors.someday;
      default: return colors.gray400;
    }
  }};
`;

const CheckboxContainer = styled(TouchableOpacity)`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: 2px solid ${props => props.completed ? colors.secondary : colors.gray400};
  background-color: ${props => props.completed ? colors.secondary : 'transparent'};
  align-items: center;
  justify-content: center;
`;

const CheckboxIcon = styled(Text)`
  color: ${colors.surface};
  font-size: 14px;
  font-weight: bold;
`;

const DueDateText = styled(Text)`
  font-size: 12px;
  color: ${props => {
    if (!props.dueDate) return colors.gray500;
    const today = new Date();
    const due = new Date(props.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return colors.today; // Overdue
    if (diffDays === 0) return colors.next; // Due today
    if (diffDays <= 3) return colors.someday; // Due soon
    return colors.gray500; // Due later
  }};
  font-weight: ${typography.weights.medium};
`;

const TaskCard = ({
  task,
  onPress,
  onToggleComplete,
  onSwipeLeft,
  onSwipeRight,
  categoryName,
  categoryColor,
  isDragging = false,
}) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    
    return due.toLocaleDateString();
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(isDragging ? 1.05 : 1.02);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: (event) => {
      const shouldTriggerAction = Math.abs(event.translationX) > 100;
      
      if (shouldTriggerAction) {
        if (event.translationX > 0 && onSwipeRight) {
          runOnJS(onSwipeRight)(task);
        } else if (event.translationX < 0 && onSwipeLeft) {
          runOnJS(onSwipeLeft)(task);
        }
      }
      
      // Reset position
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <CardContainer 
        style={animatedStyle}
        categoryColor={categoryColor}
      >
        <TouchableOpacity onPress={() => onPress?.(task)} activeOpacity={0.7}>
          <TaskHeader>
            <TaskTitle completed={task.completed} numberOfLines={2}>
              {task.title}
            </TaskTitle>
            <CheckboxContainer
              completed={task.completed}
              onPress={() => onToggleComplete?.(task.id)}
            >
              {task.completed && <CheckboxIcon>✓</CheckboxIcon>}
            </CheckboxContainer>
          </TaskHeader>

          {task.description && (
            <TaskDescription numberOfLines={2}>
              {task.description}
            </TaskDescription>
          )}

          <TaskFooter>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {categoryName && (
                <CategoryTag color={categoryColor}>
                  <CategoryText>{categoryName}</CategoryText>
                </CategoryTag>
              )}
              
              {task.priority && task.priority > TASK_PRIORITIES.LOW && (
                <View style={{ marginLeft: spacing.sm, alignItems: 'center' }}>
                  <PriorityIndicator priority={task.priority} />
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {task.estimatedTime && (
                <Text style={{ 
                  fontSize: 12, 
                  color: colors.gray500, 
                  marginRight: spacing.sm 
                }}>
                  {task.estimatedTime}min
                </Text>
              )}
              
              {task.dueDate && (
                <DueDateText dueDate={task.dueDate}>
                  {formatDueDate(task.dueDate)}
                </DueDateText>
              )}
            </View>
          </TaskFooter>
        </TouchableOpacity>
      </CardContainer>
    </PanGestureHandler>
  );
};

export default TaskCard;