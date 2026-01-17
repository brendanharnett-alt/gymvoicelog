import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useWorkoutStore } from './src/hooks/useWorkoutStore';
import { DateHeader } from './src/components/DateHeader';
import { SwipeContainer } from './src/components/SwipeContainer';
import { DraggableWorkoutList } from './src/components/DraggableWorkoutList';
import { RecordButton } from './src/components/RecordButton';
import { EditWorkoutDialog } from './src/components/EditWorkoutDialog';
import { Calendar } from './src/components/Calendar';
import { MonthYearPicker } from './src/components/MonthYearPicker';
import { WorkoutEntry } from './src/types/workout';
import { startOfMonth } from './src/utils/dateUtils';

type CalendarView = 'days' | 'months';

export default function App() {
  const {
    currentDate,
    currentDayWorkout,
    addEntry,
    updateEntry,
    deleteEntry,
    goToNextDay,
    goToPrevDay,
    goToDate,
    reorderEntries,
  } = useWorkoutStore();

  const [editingEntry, setEditingEntry] = useState<WorkoutEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>('days');
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(currentDate));

  const handleRecordingComplete = (transcript: string) => {
    addEntry(transcript);
    // In production, you'd use a toast library like react-native-toast-message
    console.log('Workout logged:', transcript);
  };

  const handleDeleteEntry = (id: string) => {
    deleteEntry(id);
    console.log('Entry deleted');
  };

  const handleEditEntry = (entry: WorkoutEntry) => {
    setEditingEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleSaveEntry = (id: string, updates: Partial<WorkoutEntry>) => {
    updateEntry(id, updates);
    setIsEditDialogOpen(false);
    setEditingEntry(null);
    console.log('Entry updated');
  };

  const handleReorderEntries = (orderedIds: string[]) => {
    reorderEntries(orderedIds);
  };

  const handleDateSelect = (date: Date) => {
    goToDate(date);
    setIsCalendarOpen(false);
    setCalendarView('days');
  };

  const handleMonthSelect = (date: Date) => {
    setCalendarMonth(date);
    setCalendarView('days');
  };

  const handleOpenCalendar = () => {
    setCalendarMonth(startOfMonth(currentDate));
    setCalendarView('days');
    setIsCalendarOpen(true);
  };

  const handleCalendarOpenChange = (open: boolean) => {
    setIsCalendarOpen(open);
    if (!open) {
      setCalendarView('days');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <DateHeader
          date={currentDate}
          onPrevDay={goToPrevDay}
          onNextDay={goToNextDay}
          onOpenCalendar={handleOpenCalendar}
        />
      </View>

      {/* Workout List with Swipe */}
      <SwipeContainer onSwipeLeft={goToNextDay} onSwipeRight={goToPrevDay}>
        <View style={styles.content}>
          <DraggableWorkoutList
            dayWorkout={currentDayWorkout}
            onDeleteEntry={handleDeleteEntry}
            onEditEntry={handleEditEntry}
            onReorderEntries={handleReorderEntries}
          />
        </View>
      </SwipeContainer>

      {/* Recording Button - Fixed at bottom */}
      <View style={styles.recordButtonContainer}>
        <RecordButton onRecordingComplete={handleRecordingComplete} />
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={isCalendarOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => handleCalendarOpenChange(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => handleCalendarOpenChange(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.calendarModal}
          >
            {calendarView === 'days' ? (
              <Calendar
                selectedDate={currentDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                onSelect={handleDateSelect}
                onMonthYearClick={() => setCalendarView('months')}
              />
            ) : (
              <MonthYearPicker
                date={calendarMonth}
                onSelect={handleMonthSelect}
                onBack={() => setCalendarView('days')}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Dialog */}
      <EditWorkoutDialog
        entry={editingEntry}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEntry}
      />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  content: {
    flex: 1,
    paddingBottom: 160, // Space for record button
  },
  recordButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    maxWidth: '90%',
    maxHeight: '80%',
  },
});
