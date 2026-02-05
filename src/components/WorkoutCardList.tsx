import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DayWorkout, WorkoutEntry } from '../types/workout';
import { WorkoutCard } from './WorkoutCard';

interface WorkoutCardListProps {
  dayWorkout: DayWorkout;
  onAddEntry: () => WorkoutEntry; // Returns the new entry
  onUpdateEntry: (id: string, updates: Partial<WorkoutEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onSummaryFocusChange?: (isFocused: boolean) => void;
  selectedCardIds?: Set<string>;
  onSelectCard?: (id: string) => void;
  onDeselectCard?: (id: string) => void;
  onCombine?: () => void;
  isCombining?: boolean;
}

export function WorkoutCardList({
  dayWorkout,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onSummaryFocusChange,
  selectedCardIds = new Set(),
  onSelectCard,
  onDeselectCard,
  onCombine,
  isCombining = false,
}: WorkoutCardListProps) {
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  // Track focus count to handle multiple cards (though typically only one is expanded)
  const focusCountRef = useRef(0);

  const selectedCount = selectedCardIds.size;
  const showCombineButton = selectedCount >= 2 && onCombine;

  // Sort entries: newest → oldest (by timestamp)
  const sortedEntries = [...dayWorkout.entries].sort((a, b) => {
    const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return timeB.getTime() - timeA.getTime();
  });

  // Handle add button tap
  const handleAddCard = useCallback(() => {
    const newEntry = onAddEntry();
    setNewlyCreatedId(newEntry.id);
    // Clear the auto-focus flag after a delay
    setTimeout(() => {
      setNewlyCreatedId(null);
    }, 1000);
  }, [onAddEntry]);

  // Handle update
  const handleUpdate = useCallback((id: string, updates: Partial<WorkoutEntry>) => {
    onUpdateEntry(id, updates);
  }, [onUpdateEntry]);

  // Handle delete
  const handleDelete = useCallback((id: string) => {
    onDeleteEntry(id);
  }, [onDeleteEntry]);

  // Handle summary focus change from any card
  const handleSummaryFocusChange = useCallback((isFocused: boolean) => {
    if (isFocused) {
      focusCountRef.current += 1;
    } else {
      focusCountRef.current = Math.max(0, focusCountRef.current - 1);
    }
    // Notify parent if any card has focus
    if (onSummaryFocusChange) {
      onSummaryFocusChange(focusCountRef.current > 0);
    }
  }, [onSummaryFocusChange]);

  // Handle long press to enter selection mode
  const handleCardLongPress = useCallback((entryId: string) => {
    setIsSelectionMode(true);
    if (onSelectCard) {
      onSelectCard(entryId); // Auto-select the long-pressed card
    }
  }, [onSelectCard]);

  // Handle exiting selection mode
  const handleExitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    if (onDeselectCard) {
      // Clear all selections
      selectedCardIds.forEach(id => onDeselectCard(id));
    }
  }, [selectedCardIds, onDeselectCard]);

  return (
    <View style={styles.container}>
      {/* Cancel selection button - shown when in selection mode */}
      {isSelectionMode && (
        <TouchableOpacity
          onPress={handleExitSelectionMode}
          style={styles.cancelSelectionButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
          <Text style={styles.cancelSelectionButtonText}>Cancel Selection</Text>
        </TouchableOpacity>
      )}

      {/* Combine button - shown when 2+ cards selected */}
      {showCombineButton && (
        <TouchableOpacity
          onPress={onCombine}
          style={[styles.combineButton, isCombining && styles.combineButtonDisabled]}
          activeOpacity={0.7}
          disabled={isCombining}
        >
          <Ionicons name="layers-outline" size={20} color="#FFFFFF" />
          <Text style={styles.combineButtonText}>
            {isCombining ? 'Combining...' : `Combine ${selectedCount} Cards`}
          </Text>
        </TouchableOpacity>
      )}

      {/* + Add button */}
      <TouchableOpacity
        onPress={handleAddCard}
        style={styles.addButton}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>

      {/* Card list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sortedEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>
              Tap "+ Add" to create your first exercise card
            </Text>
          </View>
        ) : (
          sortedEntries.map((entry) => (
            <Pressable
              key={entry.id}
              onLongPress={() => handleCardLongPress(entry.id)}
              delayLongPress={500}
            >
              <WorkoutCard
                entry={entry}
                onUpdate={(updates) => handleUpdate(entry.id, updates)}
                onDelete={() => handleDelete(entry.id)}
                autoFocus={newlyCreatedId === entry.id}
                onSummaryFocusChange={handleSummaryFocusChange}
                isSelected={selectedCardIds.has(entry.id)}
                onSelect={isSelectionMode && onSelectCard ? () => onSelectCard(entry.id) : undefined}
                onDeselect={isSelectionMode && onDeselectCard ? () => onDeselectCard(entry.id) : undefined}
                showSelectionCheckbox={isSelectionMode}
              />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cancelSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    gap: 8,
  },
  cancelSelectionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  combineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FF6666',
    gap: 8,
  },
  combineButtonDisabled: {
    opacity: 0.6,
  },
  combineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#CCCCCC',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

