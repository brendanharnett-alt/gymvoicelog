import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarProps {
  selectedDate: Date;
  month: Date;
  onMonthChange: (date: Date) => void;
  onSelect: (date: Date) => void;
  onMonthYearClick?: () => void;
}

export function Calendar({ selectedDate, month, onMonthChange, onSelect, onMonthYearClick }: CalendarProps) {
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(month);
  const firstDay = getFirstDayOfMonth(month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renderDays = () => {
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.day} />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      const isSelected = date.getTime() === selectedDate.getTime();
      const isToday = date.getTime() === today.getTime();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.day,
            isSelected && styles.daySelected,
            isToday && styles.dayToday,
          ]}
          onPress={() => onSelect(date)}
        >
          <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(month);
    newMonth.setMonth(newMonth.getMonth() + direction);
    onMonthChange(newMonth);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onMonthYearClick} style={styles.monthYearButton}>
          <Text style={styles.monthYear}>
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} style={styles.weekDay}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>{renderDays()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  dayText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  daySelected: {
    backgroundColor: '#FF4444',
    borderRadius: 8,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 8,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

