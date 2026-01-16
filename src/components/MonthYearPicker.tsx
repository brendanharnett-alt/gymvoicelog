import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MonthYearPickerProps {
  date: Date;
  onSelect: (date: Date) => void;
  onBack: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthYearPicker({ date, onSelect, onBack }: MonthYearPickerProps) {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const years = [];
  
  // Generate years from 10 years ago to 10 years in the future
  for (let y = currentYear - 10; y <= currentYear + 10; y++) {
    years.push(y);
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(date);
    newDate.setMonth(monthIndex);
    newDate.setDate(1);
    onSelect(newDate);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(date);
    newDate.setFullYear(year);
    onSelect(newDate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Month & Year</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Month</Text>
          <View style={styles.monthsGrid}>
            {MONTHS.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthOption,
                  currentMonth === index && styles.monthOptionSelected,
                ]}
                onPress={() => handleMonthSelect(index)}
              >
                <Text
                  style={[
                    styles.monthOptionText,
                    currentMonth === index && styles.monthOptionTextSelected,
                  ]}
                >
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Year</Text>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearOption,
                currentYear === year && styles.yearOptionSelected,
              ]}
              onPress={() => handleYearSelect(year)}
            >
              <Text
                style={[
                  styles.yearOptionText,
                  currentYear === year && styles.yearOptionTextSelected,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthOption: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthOptionSelected: {
    backgroundColor: '#FF4444',
  },
  monthOptionText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  monthOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  yearOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: '#2A2A2A',
  },
  yearOptionSelected: {
    backgroundColor: '#FF4444',
  },
  yearOptionText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  yearOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

