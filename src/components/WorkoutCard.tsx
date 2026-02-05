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

type CardState = 'collapsed' | 'expanded';

// Compute exercise name for collapsed view
function getExerciseName(entry: WorkoutEntry): string {
  if (entry.exercise) {
    return entry.exercise;
  }
  if (entry.title && entry.title.trim()) {
    return entry.title;
  }
  if (entry.text && entry.text.trim()) {
    return entry.text;
  }
  return 'Untitled entry';
}

// Compute set details for collapsed view
function getSetDetails(entry: WorkoutEntry): string | null {
  if (entry.weight !== undefined && entry.weight > 0 && entry.reps !== undefined && entry.reps > 0) {
    const unit = entry.weightUnit === 'kg' ? 'kg' : 'lb';
    return `${entry.weight}${unit} × ${entry.reps}`;
  }
  if (entry.duration !== undefined && entry.duration > 0) {
    return `${entry.duration} min`;
  }
  return null;
}

export function WorkoutCard({
  entry,
  onUpdate,
  onDelete,
  autoFocus = false,
}: WorkoutCardProps) {
  const [cardState, setCardState] = useState<CardState>('collapsed');
  // Get initial summary text from entry (title or text, matching getExerciseName logic)
  const getInitialSummaryText = () => {
    if (entry.title && entry.title.trim()) {
      return entry.title;
    }
    if (entry.text && entry.text.trim()) {
      return entry.text;
    }
    return '';
  };
  const [summaryText, setSummaryText] = useState(getInitialSummaryText());
  
  const summaryInputRef = useRef<TextInput>(null);

  // Auto-expand and focus if requested
  useEffect(() => {
    if (autoFocus) {
      setCardState('expanded');
      // Small delay to ensure input is mounted
      setTimeout(() => {
        summaryInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  // Update summary text when entry changes (e.g., from external updates)
  // Only update if we're not currently editing (collapsed state)
  useEffect(() => {
    if (cardState === 'collapsed') {
      const newSummary = getInitialSummaryText();
      setSummaryText(newSummary);
    }
  }, [entry.title, entry.text, cardState]);

  // Handle edit (expand card)
  const handleEdit = () => {
    if (cardState === 'collapsed') {
      setCardState('expanded');
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // Handle collapse - save the edited summary text as title
  const handleCollapse = () => {
    Keyboard.dismiss();
    // Save the summary text as title when collapsing
    onUpdate({ title: summaryText.trim() || undefined });
    setCardState('collapsed');
  };

  const exerciseName = getExerciseName(entry);
  const setDetails = getSetDetails(entry);
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
            <View style={styles.exerciseNameContainer}>
              <Text style={styles.exerciseName}>
                {exerciseName}
              </Text>
            </View>
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
          {setDetails && (
            <Text style={styles.setDetails}>
              {setDetails}
            </Text>
          )}
          <View style={styles.collapsedMeta}>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
          {entry.rawTranscription && (
            <Text style={styles.rawTranscription}>
              {entry.rawTranscription}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Expanded view
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

      <View style={styles.expandedContent}>
        {/* First text area: Editable summary/parsed text */}
        <View style={styles.textAreaContainer}>
          <Text style={styles.fieldLabel}>Summary</Text>
          <TextInput
            ref={summaryInputRef}
            style={[styles.textInput, styles.editableTextArea]}
            value={summaryText}
            onChangeText={setSummaryText}
            placeholder="Edit workout summary..."
            placeholderTextColor="#666"
            multiline={true}
            textAlignVertical="top"
            scrollEnabled={true}
          />
        </View>

        {/* Second text area: Read-only raw transcription */}
        <View style={styles.textAreaContainer}>
          <Text style={styles.fieldLabel}>Raw Transcription</Text>
          <ScrollView 
            style={styles.scrollableTextArea}
            nestedScrollEnabled={true}
          >
            {entry.rawTranscription ? (
              <Text style={styles.readOnlyTextArea}>
                {entry.rawTranscription}
              </Text>
            ) : (
              <Text style={[styles.readOnlyTextArea, styles.placeholderText]}>
                No raw transcription available
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exerciseNameContainer: {
    flex: 1,
    marginRight: 8,
    flexShrink: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flexWrap: 'wrap',
  },
  setDetails: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
    marginBottom: 6,
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
    flexWrap: 'wrap',
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
  textAreaContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollableTextArea: {
    height: 200,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    backgroundColor: '#0A0A0A',
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
  editableTextArea: {
    height: 200,
    textAlignVertical: 'top',
  },
  readOnlyTextArea: {
    padding: 12,
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
    minHeight: 200,
  },
  placeholderText: {
    color: '#666666',
  },
});

