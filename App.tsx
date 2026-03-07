import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { useWorkoutStore, generateUUID } from './src/hooks/useWorkoutStore';
import { editCard } from './src/utils/cardApi';
import { DateHeader } from './src/components/DateHeader';
import { SwipeContainer } from './src/components/SwipeContainer';
import { WorkoutCardList } from './src/components/WorkoutCardList';
import { RecordButton } from './src/components/RecordButton';
import { EditWorkoutDialog } from './src/components/EditWorkoutDialog';
import { Calendar } from './src/components/Calendar';
import { MonthYearPicker } from './src/components/MonthYearPicker';
import { VoiceTipsBottomSheet } from './src/components/VoiceTipsBottomSheet';
import { WorkoutEntry } from './src/types/workout';
import { startOfMonth, normalizeDate, getDateLabel } from './src/utils/dateUtils';
import { textToBodyLines, summaryToTypedLines } from './src/utils/lines';
import { CardLine } from './src/types/workout';

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
    getDatesWithWorkouts,
  } = useWorkoutStore();

  const [editingEntry, setEditingEntry] = useState<WorkoutEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>('days');
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(currentDate));
  const [isRecordingTargetModalOpen, setIsRecordingTargetModalOpen] = useState(false);
  const [isSummaryInputFocused, setIsSummaryInputFocused] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [combineMode, setCombineMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [deleteConfirmingCardId, setDeleteConfirmingCardId] = useState<string | null>(null);
  const [isVoiceTipsOpen, setIsVoiceTipsOpen] = useState(false);
  const [pendingRecordingCardId, setPendingRecordingCardId] = useState<string | null>(null);
  
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

  // Handle recording start - generate UUID for backend but don't create card yet
  const handleRecordingStart = useCallback((): string | undefined => {
    // Generate UUID for backend, but don't create card yet
    const cardId = generateUUID();
    setPendingRecordingCardId(cardId);
    return cardId;
  }, []);

  const handleRecordingComplete = (result: { transcript: string; summary?: string | null; extractedLifts?: any[] | null }) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:94',message:'handleRecordingComplete called',data:{currentDate:currentDate?.getTime(),recordingTargetDate:recordingTargetDate?.getTime(),isViewingToday},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // Use the card ID that was generated when recording started
    const cardIdToUse = pendingRecordingCardId;
    if (!cardIdToUse) {
      console.error('No pending card ID found for recording');
      return;
    }
    
    // Use summary if available, otherwise fall back to transcript
    const displayText = result.summary || result.transcript;
    const targetDate = normalizeDate(recordingTargetDate);
    
    // Create the card now with the pre-generated ID
    const newEntry = addEntry(displayText, targetDate, cardIdToUse);
    
    // Update with structured data
    // Compute typed lines
    const lines = result.summary 
      ? summaryToTypedLines(result.summary)
      : textToBodyLines(result.transcript);
    
    if (result.summary) {
      updateEntry(newEntry.id, {
        title: result.summary,
        rawTranscription: result.transcript,
        lines,
      });
    } else {
      // Fallback: if no summary, store transcript as rawTranscription
      updateEntry(newEntry.id, {
        rawTranscription: result.transcript,
        lines,
      });
    }
    
    // Clear pending card ID
    setPendingRecordingCardId(null);
    
    // REMOVED: Reset recordingTargetDate back to Today after recording is saved
    // The target should persist on the current page until user navigates away
    // Reset only happens in useEffect when currentDate changes (navigation)
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:120',message:'After recording save - NOT resetting target',data:{recordingTargetDateStill:recordingTargetDate?.getTime()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // In production, you'd use a toast library like react-native-toast-message
    console.log('=== WORKOUT LOGGED ===');
    console.log('Summary from Backend:', result.summary || '(none)');
    console.log('Transcript from Backend:', result.transcript);
    console.log('Final Display Text (stored as title):', result.summary || result.transcript);
    console.log('Processed Lines:', lines.map(l => ({ kind: l.kind, text: l.text })));
    console.log('Lines Count:', lines.length);
    console.log('Header Lines:', lines.filter(l => l.kind === 'header').map(l => l.text));
    console.log('Body Lines:', lines.filter(l => l.kind === 'body').map(l => l.text));
    console.log('========================');
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

  // Handle edit button click for API tracking
  const handleEditEntryClick = useCallback((id: string) => {
    // Find the entry to check if it's voice-created
    const entry = currentDayWorkout.entries.find(e => e.id === id);
    if (entry?.rawTranscription) {
      // Voice-created card - log edit event (fire-and-forget)
      console.log('Edit button clicked - Calling editCard API for voice-created card:', id);
      const summaryText = entry.text || entry.title || undefined;
      editCard(id, summaryText);
    }
  }, [currentDayWorkout]);

  // Memoize delete confirmation callbacks to prevent unnecessary re-renders
  // This fixes flickering of "DELETE ?" text during recording
  const handleDeleteConfirmStart = useCallback((cardId: string) => {
    setDeleteConfirmingCardId(cardId);
  }, []);

  const handleDeleteConfirmCancel = useCallback(() => {
    setDeleteConfirmingCardId(null);
  }, []);

  const handleSaveEntry = (id: string, updates: Partial<WorkoutEntry>) => {
    // Check if this is a voice-created card before updating
    const entry = currentDayWorkout.entries.find(e => e.id === id);
    console.log('Edit - Card ID:', id);
    console.log('Edit - Has rawTranscription:', !!entry?.rawTranscription);
    console.log('Edit - Entry:', entry);
    
    if (entry?.rawTranscription) {
      // Voice-created card - log edit event (fire-and-forget)
      console.log('Edit - Calling editCard API with:', { id, summaryText: updates.text });
      editCard(id, updates.text);
    } else {
      console.log('Edit - Skipping API call (not voice-created)');
    }
    
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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:205',message:'handleCombine called',data:{selectedCardIdsSize:selectedCardIds.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E,F'})}).catch(()=>{});
    // #endregion
    const selectedEntries = getSelectedCards();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:208',message:'Got selected entries',data:{selectedEntriesCount:selectedEntries.length,entryIds:selectedEntries.map(e=>e.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (selectedEntries.length < 2) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:211',message:'Not enough entries to combine',data:{selectedEntriesCount:selectedEntries.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.warn('Need at least 2 cards to combine');
      return;
    }

    setIsCombining(true);
    try {
      // Extract lines from each entry in selection order
      // Use entry.lines if available, otherwise convert legacy text using textToBodyLines
      const allLines: CardLine[] = [];
      
      selectedEntries.forEach((entry, index) => {
        let entryLines: CardLine[];
        
        if (entry.lines && entry.lines.length > 0) {
          // Use existing lines, create copies to avoid mutation
          entryLines = entry.lines.map(line => ({ ...line }));
        } else {
          // Convert legacy text to body lines
          const sourceText = entry.title || entry.text || '';
          entryLines = textToBodyLines(sourceText);
        }
        
        // Add entry lines to combined array
        allLines.push(...entryLines);
        
        // Insert blank body line between cards (but not after the last card)
        if (index < selectedEntries.length - 1) {
          allLines.push({
            id: `${Date.now()}-${Math.random()}`,
            text: '',
            kind: 'body',
          });
        }
      });

      // Create new combined entry and delete originals
      await combineSelectedCards(allLines);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:237',message:'combineSelectedCards completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Clear selection and exit combine mode
      clearSelection();
      setCombineMode(false);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:242',message:'handleCombine catch block',data:{errorType:err?.constructor?.name,errorMessage:err instanceof Error ? err.message : String(err),errorStack:err instanceof Error ? err.stack?.substring(0,300) : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E,F'})}).catch(()=>{});
      // #endregion
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
            onEditEntry={handleEditEntryClick}
            onSummaryFocusChange={setIsSummaryInputFocused}
            selectedCardIds={selectedCardIds}
            onSelectCard={selectCard}
            onDeselectCard={deselectCard}
            onCombine={handleCombine}
            isCombining={isCombining}
            combineMode={combineMode}
            onCombineModeChange={setCombineMode}
            isRecording={isRecording}
            isSummaryInputFocused={isSummaryInputFocused}
            onReorderEntries={reorderEntries}
            deleteConfirmingCardId={deleteConfirmingCardId}
            onDeleteConfirmStart={handleDeleteConfirmStart}
            onDeleteConfirmCancel={handleDeleteConfirmCancel}
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
          <RecordButton 
            onRecordingComplete={handleRecordingComplete}
            onRecordingStateChange={setIsRecording}
            onRecordingStart={handleRecordingStart}
            cardId={pendingRecordingCardId || undefined}
          />
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setIsVoiceTipsOpen(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="help-circle-outline" size={28} color="#666666" />
          </TouchableOpacity>
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
                datesWithWorkouts={getDatesWithWorkouts()}
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

      {/* Voice Tips Bottom Sheet */}
      <VoiceTipsBottomSheet
        visible={isVoiceTipsOpen}
        onClose={() => setIsVoiceTipsOpen(false)}
      />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black
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
  helpButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
