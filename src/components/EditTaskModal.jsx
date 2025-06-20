// src/components/EditTaskModal.jsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';

const timeOptions = [15, 30, 60, 120, 180, 240, 300];
const daysOfWeek = [
  { key: 'mon', label: 'L' }, { key: 'tue', label: 'M' },
  { key: 'wed', label: 'X' }, { key: 'thu', label: 'J' },
  { key: 'fri', label: 'V' }, { key: 'sat', label: 'S' },
  { key: 'sun', label: 'D' },
];

const formatTimeLabel = (minutes) => {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}'`;
  return `${minutes / 60}h`;
};

const EditTaskModal = ({ visible, onClose, task, onSave, projects = [] }) => {
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSection, setEditedSection] = useState('');
  const [editedTime, setEditedTime] = useState(null);
  const [editedProjectId, setEditedProjectId] = useState(null);
  const [recurrence, setRecurrence] = useState(null);

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title || '');
      setEditedSection(task.section || 'inbox');
      setEditedTime(task.estimatedTime || null);
      setEditedProjectId(task.projectId || null);
      setRecurrence(task.recurrence || null);
    }
  }, [task]);

  const handleDayToggle = (dayKey) => {
    const currentRule = recurrence || { frequency: 'weekly', daysOfWeek: [] };
    const days = currentRule.daysOfWeek || [];
    
    const newDays = days.includes(dayKey)
      ? days.filter(d => d !== dayKey)
      : [...days, dayKey];

    if (newDays.length === 0) {
      setRecurrence(null);
    } else {
      setRecurrence({ ...currentRule, daysOfWeek: newDays.sort() });
    }
  };

  const handleSaveChanges = () => {
    if (!editedTitle.trim()) {
      alert("El título no puede estar vacío.");
      return;
    }
    onSave(task.id, { 
      title: editedTitle.trim(), 
      section: editedSection,
      estimatedTime: editedTime,
      projectId: editedProjectId,
      recurrence: recurrence,
    });
  };

  if (!task) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Editar Tarea</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Título</Text>
              <TextInput style={styles.input} value={editedTitle} onChangeText={setEditedTitle} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.selectorButtons}>
                {['inbox', 'today', 'next', 'someday'].map(section => (
                  <TouchableOpacity key={section} style={[styles.selectorButton, editedSection === section && styles.selectorButtonActive]} onPress={() => setEditedSection(section)}>
                    <Text style={[styles.selectorButtonText, editedSection === section && styles.selectorButtonTextActive]}>{section.charAt(0).toUpperCase() + section.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Proyecto (Opcional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.projectSelector}>
                  <TouchableOpacity style={[styles.projectButton, !editedProjectId && styles.projectButtonActive]} onPress={() => setEditedProjectId(null)}>
                    <Text style={[styles.projectButtonText, !editedProjectId && styles.projectButtonTextActive]}>Ninguno</Text>
                  </TouchableOpacity>
                  {projects.map(proj => (
                    <TouchableOpacity key={proj.id} style={[styles.projectButton, editedProjectId === proj.id && styles.projectButtonActive]} onPress={() => setEditedProjectId(proj.id)}>
                      <Text style={[styles.projectButtonText, editedProjectId === proj.id && styles.projectButtonTextActive]} numberOfLines={1}>{proj.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tiempo Estimado</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeSelector}>
                  {timeOptions.map(time => (
                    <TouchableOpacity key={time} style={[styles.timeButton, editedTime === time && styles.timeButtonActive]} onPress={() => setEditedTime(editedTime === time ? null : time)}>
                      <Text style={[styles.timeButtonText, editedTime === time && styles.timeButtonTextActive]}>{formatTimeLabel(time)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Repetir Semana</Text>
              <View style={styles.daySelector}>
                {daysOfWeek.map(day => {
                  const isSelected = recurrence?.daysOfWeek?.includes(day.key);
                  return (
                    <TouchableOpacity key={day.key} style={[styles.dayButton, isSelected && styles.dayButtonActive]} onPress={() => handleDayToggle(day.key)}>
                      <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextActive]}>{day.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}><Text style={styles.saveButtonText}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 14, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#6c757d', marginBottom: 10, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#f8f9fa' },
  selectorButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#dee2e6', backgroundColor: '#f8f9fa' },
  selectorButtonActive: { backgroundColor: '#4A90E2', borderColor: '#4A90E2' },
  selectorButtonText: { fontSize: 14, color: '#495057', fontWeight: '500' },
  selectorButtonTextActive: { color: '#ffffff' },
  projectSelector: { flexDirection: 'row', gap: 10 },
  projectButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', height: 40, justifyContent: 'center', alignItems: 'center' },
  projectButtonActive: { backgroundColor: '#50C878', borderColor: '#50C878' },
  projectButtonText: { color: '#495057', fontWeight: '500' },
  projectButtonTextActive: { color: '#ffffff' },
  timeSelector: { flexDirection: 'row', gap: 10 },
  timeButton: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: '#4A90E2', justifyContent: 'center', alignItems: 'center' },
  timeButtonActive: { backgroundColor: '#4A90E2' },
  timeButtonText: { color: '#4A90E2', fontWeight: '600' },
  timeButtonTextActive: { color: '#ffffff' },
  daySelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#dee2e6', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  dayButtonActive: { backgroundColor: '#4A90E2', borderColor: '#4A90E2' },
  dayButtonText: { color: '#495057', fontWeight: '600', fontSize: 12 },
  dayButtonTextActive: { color: '#ffffff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#f8f9fa' },
  cancelButtonText: { color: '#6c757d', fontSize: 16, fontWeight: '500' },
  saveButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#4A90E2' },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});

export default EditTaskModal;