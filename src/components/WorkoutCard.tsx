import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutEntry } from '../types/workout';

interface WorkoutCardProps {
  entry: WorkoutEntry;
  onUpdate: (updates: Partial<WorkoutEntry>) => void;
  onDelete?: () => void;
  autoFocus?: boolean; // Auto-focus title when true
}

type CardState = 'collapsed' | 'expanded-light' | 'expanded-details';

// Compute display line for collapsed view
function getDisplayLine(entry: WorkoutEntry): string {
  // Priority 1: Exercise with weight and reps
  if (entry.exercise) {
    if (entry.weight !== undefined && entry.weight > 0 && entry.reps !== undefined && entry.reps > 0) {
      const unit = entry.weightUnit === 'kg' ? 'kg' : 'lb';
      return `${entry.exercise} · ${entry.weight}${unit} × ${entry.reps}`;
    }
    // Priority 2: Exercise with duration
    if (entry.duration !== undefined && entry.duration > 0) {
      return `${entry.exercise} · ${entry.duration} min`;
    }
    // Priority 3: Just exercise
    return entry.exercise;
  }
  
  // Priority 4: Title
  if (entry.title && entry.title.trim()) {
    return entry.title;
  }
  
  // Priority 5: Legacy text field
  if (entry.text && entry.text.trim()) {
    return entry.text;
  }
  
  // Fallback
  return 'Untitled entry';
}

export function WorkoutCard({
  entry,
  onUpdate,
  onDelete,
  autoFocus = false,
}: WorkoutCardProps) {
  const [cardState, setCardState] = useState<CardState>('collapsed');
  const [title, setTitle] = useState(entry.title || '');
  const [description, setDescription] = useState(entry.description || '');
  const [exercise, setExercise] = useState(entry.exercise || '');
  const [reps, setReps] = useState(entry.reps?.toString() || '');
  const [weight, setWeight] = useState(entry.weight?.toString() || '');
  const [duration, setDuration] = useState(entry.duration?.toString() || '');
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>(entry.weightUnit || 'lb');
  const [showDetails, setShowDetails] = useState(false);
  
  const titleInputRef = useRef<TextInput>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-expand and focus if requested
  useEffect(() => {
    if (autoFocus) {
      setCardState('expanded-light');
      // Small delay to ensure input is mounted
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  // Debounced save function
  const debouncedSave = (updates: Partial<WorkoutEntry>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(updates);
    }, 500); // 500ms debounce
  };

  // Handle title change
  const handleTitleChange = (value: string) => {
    setTitle(value);
    debouncedSave({ title: value || undefined });
  };

  // Handle description change
  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    debouncedSave({ description: value || undefined });
  };

  // Handle exercise change
  const handleExerciseChange = (value: string) => {
    setExercise(value);
    debouncedSave({ exercise: value || undefined });
  };

  // Handle reps change
  const handleRepsChange = (value: string) => {
    setReps(value);
    const numValue = value.trim() === '' ? undefined : parseInt(value, 10);
    debouncedSave({ reps: numValue });
  };

  // Handle weight change
  const handleWeightChange = (value: string) => {
    setWeight(value);
    const numValue = value.trim() === '' ? undefined : parseFloat(value);
    debouncedSave({ weight: numValue });
  };

  // Handle duration change
  const handleDurationChange = (value: string) => {
    setDuration(value);
    const numValue = value.trim() === '' ? undefined : parseInt(value, 10);
    debouncedSave({ duration: numValue });
  };

  // Handle weight unit toggle
  const handleWeightUnitToggle = () => {
    const newUnit = weightUnit === 'lb' ? 'kg' : 'lb';
    setWeightUnit(newUnit);
    debouncedSave({ weightUnit: newUnit });
  };

  // Handle edit (expand card)
  const handleEdit = () => {
    if (cardState === 'collapsed') {
      setCardState('expanded-light');
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // Handle collapse
  const handleCollapse = () => {
    Keyboard.dismiss();
    setCardState('collapsed');
    setShowDetails(false);
  };

  // Handle details toggle
  const handleDetailsToggle = () => {
    setShowDetails(!showDetails);
    if (!showDetails) {
      setCardState('expanded-details');
    }
  };

  const displayLine = getDisplayLine(entry);
  // Ensure timestamp is a Date object
  const timestampDate = entry.timestamp instanceof Date 
    ? entry.timestamp 
    : new Date(entry.timestamp);
  const timestamp = timestampDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Collapsed view
  if (cardState === 'collapsed') {
    return (
      <View style={styles.card}>
        <View style={styles.collapsedContent}>
          <View style={styles.collapsedHeader}>
            <Text style={styles.displayLine} numberOfLines={1}>
              {displayLine}
            </Text>
            <View style={styles.collapsedActions}>
              <TouchableOpacity
                onPress={handleEdit}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="create-outline" size={18} color="#888" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color="#FF4444" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.collapsedMeta}>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
          {entry.rawTranscription && (
            <Text style={styles.rawTranscription} numberOfLines={1}>
              {entry.rawTranscription}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Expanded views
  return (
    <View style={[styles.card, styles.expandedCard]}>
      {/* Header with collapse and delete buttons */}
      <View style={styles.expandedHeader}>
        <TouchableOpacity onPress={handleCollapse} style={styles.collapseButton}>
          <Ionicons name="chevron-up" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color="#FF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.expandedContent} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            ref={titleInputRef}
            style={styles.textInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Bench Press · 225 × 10"
            placeholderTextColor="#666"
            multiline={false}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={handleDescriptionChange}
            placeholder="Felt heavy on last rep"
            placeholderTextColor="#666"
            multiline={true}
            numberOfLines={3}
          />
        </View>

        {/* Details toggle */}
        <TouchableOpacity onPress={handleDetailsToggle} style={styles.detailsToggle}>
          <Text style={styles.detailsToggleText}>
            Details {showDetails ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {/* Structured fields (only when details is shown) */}
        {showDetails && (
          <View style={styles.detailsContainer}>
            {/* Exercise */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Exercise</Text>
              <TextInput
                style={styles.textInput}
                value={exercise}
                onChangeText={handleExerciseChange}
                placeholder="Bench Press"
                placeholderTextColor="#666"
              />
            </View>

            {/* Reps */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Reps</Text>
              <TextInput
                style={styles.textInput}
                value={reps}
                onChangeText={handleRepsChange}
                placeholder="10"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>

            {/* Weight with unit toggle */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Weight</Text>
              <View style={styles.weightContainer}>
                <TextInput
                  style={[styles.textInput, styles.weightInput]}
                  value={weight}
                  onChangeText={handleWeightChange}
                  placeholder="225"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  onPress={handleWeightUnitToggle}
                  style={styles.unitToggle}
                >
                  <Text style={[
                    styles.unitToggleText,
                    weightUnit === 'lb' && styles.unitToggleTextActive
                  ]}>
                    lb
                  </Text>
                  <Text style={styles.unitToggleSeparator}>|</Text>
                  <Text style={[
                    styles.unitToggleText,
                    weightUnit === 'kg' && styles.unitToggleTextActive
                  ]}>
                    kg
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Duration */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.textInput}
                value={duration}
                onChangeText={handleDurationChange}
                placeholder=""
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Raw transcription (read-only, if present) */}
        {entry.rawTranscription && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Raw Transcription</Text>
            <Text style={styles.rawTranscriptionReadOnly}>{entry.rawTranscription}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 12,
  },
  expandedCard: {
    marginBottom: 12,
  },
  collapsedContent: {
    flex: 1,
  },
  collapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  displayLine: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  collapsedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  collapsedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#888888',
  },
  rawTranscription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  collapseButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  expandedContent: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  detailsToggle: {
    paddingVertical: 12,
    marginTop: 8,
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightInput: {
    flex: 1,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  unitToggleText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  unitToggleTextActive: {
    color: '#FFFFFF',
  },
  unitToggleSeparator: {
    fontSize: 14,
    color: '#444444',
  },
  rawTranscriptionReadOnly: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
});

