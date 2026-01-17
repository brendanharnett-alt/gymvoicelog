import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
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
}

export function WorkoutCardList({
  dayWorkout,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: WorkoutCardListProps) {
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
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
            <WorkoutCard
              key={entry.id}
              entry={entry}
              onUpdate={(updates) => handleUpdate(entry.id, updates)}
              autoFocus={newlyCreatedId === entry.id}
            />
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

