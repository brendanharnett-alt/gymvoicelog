import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
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
  combineMode?: boolean;
  onCombineModeChange?: (enabled: boolean) => void;
  isRecording?: boolean;
  isSummaryInputFocused?: boolean;
  onReorderEntries?: (orderedIds: string[]) => void;
  deleteConfirmingCardId?: string | null;
  onDeleteConfirmStart?: (cardId: string) => void;
  onDeleteConfirmCancel?: () => void;
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
  combineMode = false,
  onCombineModeChange,
  isRecording = false,
  isSummaryInputFocused = false,
  onReorderEntries,
  deleteConfirmingCardId = null,
  onDeleteConfirmStart,
  onDeleteConfirmCancel,
}: WorkoutCardListProps) {
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  // Track focus count to handle multiple cards (though typically only one is expanded)
  const focusCountRef = useRef(0);

  const selectedCount = selectedCardIds.size;
  const canCombine = selectedCount >= 2 && onCombine;

  // Use entries in their stored order
  const sortedEntries = [...dayWorkout.entries];

  // Handle move up - move entry one position earlier
  const handleMoveUp = useCallback((entryId: string) => {
    if (!onReorderEntries) return;
    const currentIndex = sortedEntries.findIndex(e => e.id === entryId);
    if (currentIndex > 0) {
      const newOrder = [...sortedEntries];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      const orderedIds = newOrder.map(e => e.id);
      onReorderEntries(orderedIds);
    }
  }, [sortedEntries, onReorderEntries]);

  // Handle move down - move entry one position later
  const handleMoveDown = useCallback((entryId: string) => {
    if (!onReorderEntries) return;
    const currentIndex = sortedEntries.findIndex(e => e.id === entryId);
    if (currentIndex >= 0 && currentIndex < sortedEntries.length - 1) {
      const newOrder = [...sortedEntries];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      const orderedIds = newOrder.map(e => e.id);
      onReorderEntries(orderedIds);
    }
  }, [sortedEntries, onReorderEntries]);

  // Render item for FlatList
  const renderItem = useCallback(({ item, index }: { item: WorkoutEntry; index: number }) => {
    const canMoveUp = index > 0;
    const canMoveDown = index < sortedEntries.length - 1;
    
    return (
      <WorkoutCard
        entry={item}
        onUpdate={(updates) => handleUpdate(item.id, updates)}
        onDelete={() => handleDelete(item.id)}
        autoFocus={newlyCreatedId === item.id}
        onSummaryFocusChange={handleSummaryFocusChange}
        isSelected={selectedCardIds.has(item.id)}
        onSelect={combineMode && onSelectCard ? () => onSelectCard(item.id) : undefined}
        onDeselect={combineMode && onDeselectCard ? () => onDeselectCard(item.id) : undefined}
        showSelectionCheckbox={combineMode}
        combineMode={combineMode}
        onMoveUp={onReorderEntries && !combineMode ? () => handleMoveUp(item.id) : undefined}
        onMoveDown={onReorderEntries && !combineMode ? () => handleMoveDown(item.id) : undefined}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        isDeleteConfirming={deleteConfirmingCardId === item.id}
        onDeleteConfirmStart={onDeleteConfirmStart ? () => onDeleteConfirmStart(item.id) : undefined}
        onDeleteConfirmCancel={onDeleteConfirmCancel}
      />
    );
  }, [
    newlyCreatedId,
    handleUpdate,
    handleDelete,
    handleSummaryFocusChange,
    selectedCardIds,
    combineMode,
    onSelectCard,
    onDeselectCard,
    sortedEntries,
    onReorderEntries,
    handleMoveUp,
    handleMoveDown,
  ]);

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

  // Handle entering combine mode
  const handleEnterCombineMode = useCallback(() => {
    if (onCombineModeChange) {
      onCombineModeChange(true);
    }
  }, [onCombineModeChange]);

  // Handle exiting combine mode
  const handleExitCombineMode = useCallback(() => {
    if (onCombineModeChange) {
      onCombineModeChange(false);
    }
    // Clear all selections
    if (onDeselectCard) {
      selectedCardIds.forEach(id => onDeselectCard(id));
    }
  }, [onCombineModeChange, onDeselectCard, selectedCardIds]);

  return (
    <View style={styles.container}>
      {/* Top bar - shown when in combine mode */}
      {combineMode && (
        <View style={styles.combineTopBar}>
          <TouchableOpacity
            onPress={handleExitCombineMode}
            style={styles.combineCancelButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
            <Text style={styles.combineCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.combineTitle}>Combine cards</Text>
          {canCombine ? (
            <TouchableOpacity
              onPress={onCombine}
              style={[styles.combineActionButton, isCombining && styles.combineActionButtonDisabled]}
              activeOpacity={0.7}
              disabled={isCombining}
            >
              <Text style={styles.combineActionText}>
                {isCombining ? 'Combining...' : 'Combine'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.combineActionButtonPlaceholder} />
          )}
        </View>
      )}

      {/* Action buttons - shown when NOT in combine mode */}
      {!combineMode && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            onPress={handleAddCard}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#000000" />
            <Text style={styles.actionButtonText}>Add card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleEnterCombineMode}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal-outline" size={20} color="#000000" />
            <Text style={styles.actionButtonText}>Combine</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Card list */}
      {sortedEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="fitness-outline" size={48} color="#444" />
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySubtext}>
            Tap "+ Add" to create your first exercise card
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  combineTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  combineCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  combineCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  combineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  combineActionButton: {
    backgroundColor: '#FFBF00',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  combineActionButtonDisabled: {
    opacity: 0.6,
  },
  combineActionButtonPlaceholder: {
    width: 60,
  },
  combineActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFBF00', // Yellow accent color
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.3)', // Light top border for 3D effect
    borderLeftColor: 'rgba(255, 255, 255, 0.2)', // Light left border
    borderBottomColor: 'rgba(0, 0, 0, 0.3)', // Dark bottom border
    borderRightColor: 'rgba(0, 0, 0, 0.2)', // Dark right border
    gap: 8,
    // Enhanced 3D shadow effect
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700', // Bold for better contrast on yellow
    color: '#000000', // Black text
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

