import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutEntry, DayWorkout } from '../types/workout';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface DraggableWorkoutListProps {
  dayWorkout: DayWorkout;
  onDeleteEntry: (id: string) => void;
  onEditEntry: (entry: WorkoutEntry) => void;
  onReorderEntries: (orderedIds: string[]) => void;
}

function WorkoutCard({
  entry,
  onDelete,
  onEdit,
}: {
  entry: WorkoutEntry;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        scale.value = withSpring(1.02);
        opacity.value = 0.9;
      },
      onPanResponderMove: (evt, gestureState) => {
        translateY.value = gestureState.dy;
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withSpring(1);
      },
    })
  ).current;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]} {...panResponder.panHandlers}>
      <View style={styles.cardContent}>
        <Text style={styles.cardText}>{entry.text}</Text>
        <Text style={styles.cardTime}>
          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <Ionicons name="create-outline" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export function DraggableWorkoutList({
  dayWorkout,
  onDeleteEntry,
  onEditEntry,
  onReorderEntries,
}: DraggableWorkoutListProps) {
  if (dayWorkout.entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="fitness-outline" size={48} color="#444" />
        <Text style={styles.emptyText}>No workouts yet</Text>
        <Text style={styles.emptySubtext}>Tap the mic to record your first exercise</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {dayWorkout.entries.map((entry) => (
        <WorkoutCard
          key={entry.id}
          entry={entry}
          onDelete={() => onDeleteEntry(entry.id)}
          onEdit={() => onEditEntry(entry)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
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
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  cardText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 12,
    color: '#888888',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});

