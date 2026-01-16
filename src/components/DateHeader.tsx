import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDateLabel, formatDate } from '../utils/dateUtils';

interface DateHeaderProps {
  date: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenCalendar: () => void;
}

export function DateHeader({ date, onPrevDay, onNextDay, onOpenCalendar }: DateHeaderProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPrevDay} style={styles.navButton}>
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onOpenCalendar} style={styles.dateContainer}>
        <Text style={styles.todayLabel}>{getDateLabel(date, today)}</Text>
        <Text style={styles.dateLabel}>{formatDate(date)}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onNextDay} style={styles.navButton}>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
  },
  dateContainer: {
    alignItems: 'center',
    flex: 1,
  },
  todayLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '400',
  },
});

