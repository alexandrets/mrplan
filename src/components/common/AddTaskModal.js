// src/components/common/AddTaskModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components/native';
import { colors } from '../../styles/colors';
import { spacing, borderRadius, GTD_SECTIONS, GTD_SECTION_LABELS, TASK_PRIORITIES } from '../../utils/constants';
import { typography } from '../../styles/typography';
import Button from './Button';
import { createTask } from '../../redux/slices/tasksSlice';

const ModalContainer = styled(View)`
  flex: 1;
  justify-content: flex-end;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled(View)`
  background-color: ${colors.surface};
  border-top-left-radius: ${borderRadius.xl}px;
  border-top-right-radius: ${borderRadius.xl}px;
  padding: ${spacing.lg}px;
  min-height: 400px;
  max-height: 80%;
`;

const ModalHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacing.lg}px;
  padding-bottom: ${spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.gray200};
`;

const ModalTitle = styled(Text)`
  font-size: ${typography.h2.fontSize}px;
  font-weight: ${typography.h2.fontWeight};
  color: ${colors.text};
`;

const CloseButton = styled(TouchableOpacity)`
  padding: ${spacing.sm}px;
`;

const CloseButtonText = styled(Text)`
  font-size: ${typography.body.fontSize}px;
  color: ${colors.primary};
  font-weight: ${typography.weights.semibold};
`;

const FormGroup = styled(View)`
  margin-bottom: ${spacing.lg}px;
`;

const Label = styled(Text)`
  font-size: ${typography.body.fontSize}px;
  font-weight: ${typography.weights.semibold};
  color: ${colors.text};
  margin-bottom: ${spacing.sm}px;
`;

const Input = styled(TextInput)`
  background-color: ${colors.gray100};
  border-radius: ${borderRadius.md}px;
  padding: ${spacing.md}px;
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text};
  border: 1px solid ${colors.gray200};
`;

const DescriptionInput = styled(Input)`
  height: 100px;
  text-align-vertical: top;
`;

const OptionsContainer = styled(ScrollView)`
  flex-direction: row;
  margin-top: ${spacing.sm}px;
`;

const OptionButton = styled(TouchableOpacity)`
  background-color: ${props => props.selected ? props.color : colors.gray200};
  border-radius: ${borderRadius.md}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  margin-right: ${spacing.sm}px;
  align-items: center;
  justify-content: center;
  min-width: 80px;
`;

const OptionText = styled(Text)`
  color: ${props => props.selected ? colors.surface : colors.gray600};
  font-size: ${typography.caption.fontSize}px;
  font-weight: ${typography.weights.semibold};
`;

const CategoryOption = styled(TouchableOpacity)`
  background-color: ${props => props.selected ? props.color : colors.gray200};
  border-radius: ${borderRadius.md}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  margin-right: ${spacing.sm}px;
  margin-bottom: ${spacing.sm}px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const CategoryContainer = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: ${spacing.sm}px;
`;

const ButtonContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${spacing.lg}px;
  padding-top: ${spacing.md}px;
  border-top-width: 1px;
  border-top-color: ${colors.gray200};
`;

const AddTaskModal = ({ 
  visible, 
  onClose, 
  defaultSection = GTD_SECTIONS.INBOX,
  onTaskCreated 
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { items: categories } = useSelector(state => state.categories);
  const { isLoading } = useSelector(state => state.tasks);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    section: defaultSection,
    category: null,
    priority: TASK_PRIORITIES.MEDIUM,
    estimatedTime: 30,
  });

  useEffect(() => {
    if (visible) {
      setFormData(prev => ({
        ...prev,
        section: defaultSection,
      }));
    }
  }, [visible, defaultSection]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      section: defaultSection,
      category: null,
      priority: TASK_PRIORITIES.MEDIUM,
      estimatedTime: 30,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      section: formData.section,
      category: formData.category,
      priority: formData.priority,
      estimatedTime: formData.estimatedTime,
    };

    try {
      await dispatch(createTask({ task: taskData, userId: user.uid })).unwrap();
      onTaskCreated?.();
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getSectionColor = (section) => {
    switch (section) {
      case GTD_SECTIONS.TODAY: return colors.today;
      case GTD_SECTIONS.NEXT: return colors.next;
      case GTD_SECTIONS.SOMEDAY: return colors.someday;
      case GTD_SECTIONS.INBOX: return colors.inbox;
      default: return colors.primary;
    }
  };

  const priorityOptions = [
    { value: TASK_PRIORITIES.LOWEST, label: 'Low', color: colors.gray400 },
    { value: TASK_PRIORITIES.LOW, label: 'Low+', color: colors.gray500 },
    { value: TASK_PRIORITIES.MEDIUM, label: 'Medium', color: colors.someday },
    { value: TASK_PRIORITIES.HIGH, label: 'High', color: colors.next },
    { value: TASK_PRIORITIES.HIGHEST, label: 'High!', color: colors.today },
  ];

  const timeOptions = [15, 30, 45, 60, 90, 120];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ModalContainer>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Add New Task</ModalTitle>
              <CloseButton onPress={handleClose}>
                <CloseButtonText>Cancel</CloseButtonText>
              </CloseButton>
            </ModalHeader>

            <ScrollView showsVerticalScrollIndicator={false}>
              <FormGroup>
                <Label>Task Title *</Label>
                <Input
                  value={formData.title}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                  placeholder="What needs to be done?"
                  returnKeyType="next"
                  maxLength={100}
                />
              </FormGroup>

              <FormGroup>
                <Label>Description (Optional)</Label>
                <DescriptionInput
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Add more details..."
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </FormGroup>

              <FormGroup>
                <Label>Section</Label>
                <OptionsContainer horizontal showsHorizontalScrollIndicator={false}>
                  {Object.values(GTD_SECTIONS).map((section) => (
                    <OptionButton
                      key={section}
                      selected={formData.section === section}
                      color={getSectionColor(section)}
                      onPress={() => setFormData(prev => ({ ...prev, section }))}
                    >
                      <OptionText selected={formData.section === section}>
                        {GTD_SECTION_LABELS[section]}
                      </OptionText>
                    </OptionButton>
                  ))}
                </OptionsContainer>
              </FormGroup>

              <FormGroup>
                <Label>Category (Optional)</Label>
                <CategoryContainer>
                  {categories.map((category) => (
                    <CategoryOption
                      key={category.id}
                      selected={formData.category === category.id}
                      color={category.color}
                      onPress={() => setFormData(prev => ({ 
                        ...prev, 
                        category: prev.category === category.id ? null : category.id 
                      }))}
                    >
                      <OptionText selected={formData.category === category.id}>
                        {category.name}
                      </OptionText>
                    </CategoryOption>
                  ))}
                </CategoryContainer>
              </FormGroup>

              <FormGroup>
                <Label>Priority</Label>
                <OptionsContainer horizontal showsHorizontalScrollIndicator={false}>
                  {priorityOptions.map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={formData.priority === option.value}
                      color={option.color}
                      onPress={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                    >
                      <OptionText selected={formData.priority === option.value}>
                        {option.label}
                      </OptionText>
                    </OptionButton>
                  ))}
                </OptionsContainer>
              </FormGroup>

              <FormGroup>
                <Label>Estimated Time (minutes)</Label>
                <OptionsContainer horizontal showsHorizontalScrollIndicator={false}>
                  {timeOptions.map((time) => (
                    <OptionButton
                      key={time}
                      selected={formData.estimatedTime === time}
                      color={colors.primary}
                      onPress={() => setFormData(prev => ({ ...prev, estimatedTime: time }))}
                    >
                      <OptionText selected={formData.estimatedTime === time}>
                        {time}min
                      </OptionText>
                    </OptionButton>
                  ))}
                </OptionsContainer>
              </FormGroup>
            </ScrollView>

            <ButtonContainer>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={handleClose}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Create Task"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!formData.title.trim()}
                style={{ flex: 2, marginLeft: spacing.sm }}
              />
            </ButtonContainer>
          </ModalContent>
        </ModalContainer>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddTaskModal;