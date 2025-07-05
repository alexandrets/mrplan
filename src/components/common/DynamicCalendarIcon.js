// src/components/common/DynamicCalendarIcon.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DynamicCalendarIcon = ({ onPress, style, textStyle }) => {
  const currentDayOfMonth = new Date().getDate();

  const content = (
    <View style={[styles.calendarIcon, style]}>
      <Text style={[styles.calendarIconDate, textStyle]}>{currentDayOfMonth}</Text>
    </View>
  );

  // Si el componente recibe la prop 'onPress', se convierte en un botón.
  // Si no, es solo una vista decorativa.
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Estilos base extraídos de DashboardScreenOriginal.js
const styles = StyleSheet.create({
  calendarIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)', 
    backgroundColor: 'transparent',
  },
  calendarIconDate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default DynamicCalendarIcon;