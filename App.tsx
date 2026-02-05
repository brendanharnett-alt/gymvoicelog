import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from './src/hooks/useWorkoutStore';
import { DateHeader } from './src/components/DateHeader';
import { SwipeContainer } from './src/components/SwipeContainer';
import { WorkoutCardList } from './src/components/WorkoutCardList';
import { RecordButton } from './src/components/RecordButton';
import { EditWorkoutDialog } from './src/components/EditWorkoutDialog';
import { Calendar } from './src/components/Calendar';
import { MonthYearPicker } from './src/components/MonthYearPicker';
import { WorkoutEntry } from './src/types/workout';
import { startOfMonth, normalizeDate, getDateLabel } from './src/utils/dateUtils';
import { combineCards } from './src/utils/combineCards';

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
    selectedCardIds,
    selectCard,
    deselectCard,
    clearSelection,
    getSelectedCards,
    combineSelectedCards,
  } = useWorkoutStore();

  const [editingEntry, setEditingEntry] = useState<WorkoutEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>('days');
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(currentDate));
  const [isRecordingTargetModalOpen, setIsRecordingTargetModalOpen] = useState(false);
  const [isSummaryInputFocused, setIsSummaryInputFocused] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  
  // recordingTargetDate defaults to Today, separate from viewedDate (currentDate)
  const [recordingTargetDate, setRecordingTargetDate] = useState<Date>(() => {
    const today = new Date();
    return normalizeDate(today);
  });
  
  // Check if viewing a non-Today date
  const today = useMemo(() => normalizeDate(new Date()), []);
  const isViewingToday = useMemo(() => {
    const currentNormalized = normalizeDate(currentDate);
    return currentNormalized.getTime() === today.getTime();
  }, [currentDate, today]);
  
  // Get label for recording target date
  const recordingTargetLabel = useMemo(() => {
    return getDateLabel(recordingTargetDate, today);
  }, [recordingTargetDate, today]);

  // Track previous currentDate to detect navigation away from a page
  const prevCurrentDateRef = useRef<Date>(currentDate);

  // Reset recordingTargetDate to Today when user navigates away from current page
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:68',message:'useEffect triggered',data:{prevDateRef:prevCurrentDateRef.current?.getTime(),currentDate:currentDate?.getTime(),recordingTargetDate:recordingTargetDate?.getTime(),today:today?.getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    // #endregion
    const prevDate = normalizeDate(prevCurrentDateRef.current);
    const currentDateNormalized = normalizeDate(currentDate);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:72',message:'Date comparison',data:{prevDateNormalized:prevDate.getTime(),currentDateNormalized:currentDateNormalized.getTime(),datesMatch:prevDate.getTime()===currentDateNormalized.getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C,E'})}).catch(()=>{});
    // #endregion
    
    // If the date has changed (user navigated to a different page), reset to Today
    if (prevDate.getTime() !== currentDateNormalized.getTime()) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:75',message:'RESETTING recordingTargetDate to Today',data:{prevDate:prevDate.getTime(),currentDate:currentDateNormalized.getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C,E'})}).catch(()=>{});
      // #endregion
      setRecordingTargetDate(today);
    }
    
    // Update ref for next comparison
    prevCurrentDateRef.current = currentDate;
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:79',message:'Updated prevCurrentDateRef',data:{newRefValue:prevCurrentDateRef.current?.getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }, [currentDate, today]);

  const handleRecordingComplete = (result: { transcript: string; summary?: string | null; extractedLifts?: any[] | null }) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:94',message:'handleRecordingComplete called',data:{currentDate:currentDate?.getTime(),recordingTargetDate:recordingTargetDate?.getTime(),isViewingToday},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    // Use summary if available, otherwise fall back to transcript
    const displayText = result.summary || result.transcript;
    
    // Use recordingTargetDate (defaults to Today, can be overridden to viewed date)
    // Normalize to ensure consistent date handling
    const targetDate = normalizeDate(recordingTargetDate);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:100',message:'Before addEntry',data:{targetDate:targetDate.getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // Create entry with summary as title/description and transcript as rawTranscription
    const newEntry = addEntry(displayText, targetDate);
    
    // Update with structured data
    if (result.summary) {
      updateEntry(newEntry.id, {
        title: result.summary,
        rawTranscription: result.transcript,
      });
    } else {
      // Fallback: if no summary, store transcript as rawTranscription
      updateEntry(newEntry.id, {
        rawTranscription: result.transcript,
      });
    }
    
    // REMOVED: Reset recordingTargetDate back to Today after recording is saved
    // The target should persist on the current page until user navigates away
    // Reset only happens in useEffect when currentDate changes (navigation)
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:120',message:'After recording save - NOT resetting target',data:{recordingTargetDateStill:recordingTargetDate?.getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // In production, you'd use a toast library like react-native-toast-message
    console.log('Workout logged:', { summary: result.summary, transcript: result.transcript });
  };
  
  const handleRecordingTargetChange = (selectedDate: Date) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:113',message:'handleRecordingTargetChange called',data:{selectedDate:selectedDate?.getTime(),currentDate:currentDate?.getTime(),currentRecordingTarget:recordingTargetDate?.getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setRecordingTargetDate(normalizeDate(selectedDate));
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:115',message:'After setRecordingTargetDate, before modal close',data:{newTarget:normalizeDate(selectedDate).getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setIsRecordingTargetModalOpen(false);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:116',message:'After modal close',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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

  const handleCombine = async () => {
    const selectedEntries = getSelectedCards();
    if (selectedEntries.length < 2) {
      console.warn('Need at least 2 cards to combine');
      return;
    }

    setIsCombining(true);
    try {
      // Extract texts in chronological order (title or text fallback)
      const texts = selectedEntries.map(entry => entry.title || entry.text || '').filter(text => text.trim().length > 0);
      
      if (texts.length < 2) {
        throw new Error('At least 2 non-empty texts required to combine');
      }

      // Call AI to format combined text
      const combinedText = await combineCards(texts);

      // Create new combined entry and delete originals
      await combineSelectedCards(combinedText);

      // Clear selection
      clearSelection();
    } catch (err) {
      console.error('Failed to combine cards:', err);
      // Show error to user (in production, use a toast library)
      alert(`Failed to combine cards: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCombining(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
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
        <View style={[styles.content, isSummaryInputFocused && styles.contentNoPadding]}>
          <WorkoutCardList
            dayWorkout={currentDayWorkout}
            onAddEntry={() => addEntry('')}
            onUpdateEntry={updateEntry}
            onDeleteEntry={handleDeleteEntry}
            onSummaryFocusChange={setIsSummaryInputFocused}
            selectedCardIds={selectedCardIds}
            onSelectCard={selectCard}
            onDeselectCard={deselectCard}
            onCombine={handleCombine}
            isCombining={isCombining}
          />
        </View>
      </SwipeContainer>

      {/* Recording Button - Fixed at bottom (hidden when editing summary) */}
      {!isSummaryInputFocused && (
        <View style={styles.recordButtonContainer}>
          {/* Recording target chip - only show when viewing non-Today date */}
          {!isViewingToday && (
            <TouchableOpacity
              style={styles.recordingTargetChip}
              onPress={() => setIsRecordingTargetModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.recordingTargetText}>
                Recording to: {recordingTargetLabel}
              </Text>
              <Text style={styles.recordingTargetChange}>Change</Text>
            </TouchableOpacity>
          )}
          <RecordButton onRecordingComplete={handleRecordingComplete} />
        </View>
      )}

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

      {/* Recording Target Selection Modal */}
      <Modal
        visible={isRecordingTargetModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsRecordingTargetModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsRecordingTargetModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.recordingTargetModal}
          >
            <Text style={styles.recordingTargetModalTitle}>Recording Target</Text>
            <TouchableOpacity
              style={styles.recordingTargetOption}
              onPress={() => handleRecordingTargetChange(today)}
            >
              <Text style={styles.recordingTargetOptionText}>Today</Text>
              {normalizeDate(recordingTargetDate).getTime() === today.getTime() && (
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.recordingTargetOption}
              onPress={() => handleRecordingTargetChange(currentDate)}
            >
              <Text style={styles.recordingTargetOptionText}>
                {getDateLabel(currentDate, today)}
              </Text>
              {normalizeDate(recordingTargetDate).getTime() === normalizeDate(currentDate).getTime() && (
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  contentNoPadding: {
    paddingBottom: 0, // Remove padding when record button is hidden
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
  recordingTargetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  recordingTargetText: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '400',
  },
  recordingTargetChange: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
  recordingTargetModal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 20,
    minWidth: 280,
  },
  recordingTargetModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  recordingTargetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0A0A0A',
    marginBottom: 8,
  },
  recordingTargetOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
});
