import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { WorkoutEntry, CardLine } from '../types/workout';
import { textToBodyLines } from '../utils/lines';

// Helper function to convert text to title case (first letter of each word capitalized)
const toTitleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface WorkoutCardProps {
  entry: WorkoutEntry;
  onUpdate: (updates: Partial<WorkoutEntry>) => void;
  onDelete?: () => void;
  autoFocus?: boolean; // Auto-focus title when true
  onSummaryFocusChange?: (isFocused: boolean) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  onDeselect?: () => void;
  showSelectionCheckbox?: boolean;
  combineMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isDeleteConfirming?: boolean;
  onDeleteConfirmStart?: () => void;
  onDeleteConfirmCancel?: () => void;
}

type CardState = 'collapsed' | 'expanded';

// Compute exercise name for collapsed view
function getExerciseName(entry: WorkoutEntry): string {
  if (entry.exercise) {
    return entry.exercise;
  }
  // Extract first line (exercise name) if title/text contains newlines
  const getFirstLine = (text: string | undefined): string => {
    if (!text) return '';
    const firstLine = text.split('\n')[0].trim();
    return firstLine;
  };
  
  if (entry.title && entry.title.trim()) {
    return getFirstLine(entry.title);
  }
  if (entry.text && entry.text.trim()) {
    return getFirstLine(entry.text);
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
  onSummaryFocusChange,
  isSelected = false,
  onSelect,
  onDeselect,
  showSelectionCheckbox = false,
  combineMode = false,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  isDeleteConfirming = false,
  onDeleteConfirmStart,
  onDeleteConfirmCancel,
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
  
  // Initialize editable lines for edit mode
  const getInitialLines = (): CardLine[] => {
    if (entry.lines && entry.lines.length > 0) {
      // Use existing lines, create a copy for editing
      return entry.lines.map(line => ({ ...line }));
    }
    // For manual cards without lines, initialize from text/title (all as body)
    const sourceText = entry.title || entry.text || '';
    if (sourceText.trim()) {
      return textToBodyLines(sourceText);
    }
    // Empty card - start with one empty body line
    return [{ id: `${Date.now()}-${Math.random()}`, text: '', kind: 'body' }];
  };
  const [editableLines, setEditableLines] = useState<CardLine[]>(getInitialLines());
  
  const firstLineInputRef = useRef<TextInput | null>(null);
  const lineInputRefs = useRef<Map<string, TextInput>>(new Map());

  // Auto-expand and focus if requested
  useEffect(() => {
    if (autoFocus && editableLines.length > 0) {
      setCardState('expanded');
      // Small delay to ensure input is mounted
      setTimeout(() => {
        firstLineInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus, editableLines.length]);

  // Update summary text when entry changes (e.g., from external updates)
  // Only update if we're not currently editing (collapsed state)
  useEffect(() => {
    if (cardState === 'collapsed') {
      const newSummary = getInitialSummaryText();
      setSummaryText(newSummary);
      // Reset editable lines when collapsing
      setEditableLines(getInitialLines());
    }
  }, [entry.title, entry.text, entry.lines, cardState]);

  // Handle edit (expand card)
  const handleEdit = () => {
    if (cardState === 'collapsed') {
      setCardState('expanded');
    }
  };

  // Delete confirmation state and animation
  const deleteConfirmOpacity = useSharedValue(1);
  const deleteConfirmScale = useSharedValue(1);
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate when entering confirm state
  useEffect(() => {
    if (isDeleteConfirming) {
      // Animate in with scale and opacity (from 0.8 to 1.0 for subtle effect)
      deleteConfirmOpacity.value = 0.8;
      deleteConfirmScale.value = 0.8;
      deleteConfirmOpacity.value = withTiming(1, { duration: 200 });
      deleteConfirmScale.value = withTiming(1, { duration: 200 });
      // Auto-revert after 3 seconds
      deleteTimeoutRef.current = setTimeout(() => {
        if (onDeleteConfirmCancel) {
          onDeleteConfirmCancel();
        }
      }, 3000);
    } else {
      // Reset animation values
      deleteConfirmOpacity.value = 1;
      deleteConfirmScale.value = 1;
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = null;
      }
    }
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, [isDeleteConfirming, onDeleteConfirmCancel]);

  // Handle delete button press
  const handleDeletePress = () => {
    if (isDeleteConfirming) {
      // Second tap - actually delete
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = null;
      }
      if (onDelete) {
        onDelete();
      }
    } else {
      // First tap - enter confirm state
      if (onDeleteConfirmStart) {
        onDeleteConfirmStart();
      }
    }
  };

  // Animated style for delete confirm text
  const deleteConfirmStyle = useAnimatedStyle(() => {
    return {
      opacity: deleteConfirmOpacity.value,
      transform: [{ scale: deleteConfirmScale.value }],
    };
  });

  // Handle collapse - save the edited lines back to entry
  const handleCollapse = () => {
    Keyboard.dismiss();
    // Save the editable lines back to entry.lines
    // Also update title for backward compatibility (join header lines)
    const headerLines = editableLines.filter(l => l.kind === 'header');
    const titleText = headerLines.length > 0 
      ? headerLines.map(l => l.text).join('\n')
      : editableLines.map(l => l.text).join('\n').split('\n')[0] || '';
    
    onUpdate({ 
      lines: editableLines,
      title: titleText.trim() || undefined 
    });
    setCardState('collapsed');
    // Reset focus state when collapsing
    if (onSummaryFocusChange) {
      onSummaryFocusChange(false);
    }
  };
  
  // Handle line text change
  const handleLineTextChange = (lineId: string, newText: string) => {
    setEditableLines(prev => 
      prev.map(line => line.id === lineId ? { ...line, text: newText } : line)
    );
  };
  
  // Handle line kind toggle
  const handleLineKindToggle = (lineId: string) => {
    setEditableLines(prev =>
      prev.map(line => 
        line.id === lineId 
          ? { ...line, kind: line.kind === 'header' ? 'body' : 'header' }
          : line
      )
    );
  };
  
  // Handle adding a new line
  const handleAddLine = () => {
    const newLine: CardLine = {
      id: `${Date.now()}-${Math.random()}`,
      text: '',
      kind: 'body',
    };
    setEditableLines(prev => [...prev, newLine]);
  };
  
  // Handle removing a line
  const handleRemoveLine = (lineId: string) => {
    setEditableLines(prev => prev.filter(line => line.id !== lineId));
  };

  // Handle summary input focus
  const handleSummaryFocus = () => {
    if (onSummaryFocusChange) {
      onSummaryFocusChange(true);
    }
  };

  // Handle summary input blur
  const handleSummaryBlur = () => {
    if (onSummaryFocusChange) {
      onSummaryFocusChange(false);
    }
  };

  // Handle selection toggle
  const handleSelectionToggle = () => {
    if (isSelected && onDeselect) {
      onDeselect();
    } else if (!isSelected && onSelect) {
      onSelect();
    }
  };

  // Handle card press - only in combine mode to toggle selection
  // Edit is now only accessible via the edit icon button
  const handleCardPress = () => {
    // Only handle press in combine mode for selection
    if (combineMode) {
      handleSelectionToggle();
    }
    // Edit is now only via edit icon - no action needed here
  };

  const exerciseName = getExerciseName(entry);
  const setDetails = getSetDetails(entry);
  // Ensure timestamp is a Date object
  const timestampDate = entry.timestamp instanceof Date 
    ? entry.timestamp 
    : new Date(entry.timestamp);
  const timestamp = timestampDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Parse multiple sets from title/text if it contains newlines
  // Format: "Exercise Name\n225 x 6\n245 x 6" -> extract sets
  // NOTE: This is legacy logic - only used when entry.lines is not available
  const parseSetsFromText = (text: string | undefined): string[] => {
    if (!text) return [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    // First line is usually the exercise name, rest are sets
    // Check if lines match set pattern (e.g., "225 x 6", "100 x 10")
    const setPattern = /^\d+\s*x\s*\d+/i; // Matches "225 x 6" or "100x10"
    return lines.filter(line => setPattern.test(line));
  };

  // Get sets from title or text (legacy fallback)
  const setLines = parseSetsFromText(entry.title || entry.text);
  // If no sets found in title/text, use the structured setDetails
  const displaySets = setLines.length > 0 ? setLines : (setDetails ? [setDetails] : []);

  // Collapsed view
  if (cardState === 'collapsed') {
    const cardContent = (
      <Pressable
        onPress={() => {
          // Cancel delete confirmation if tapping outside the delete button
          if (isDeleteConfirming && onDeleteConfirmCancel) {
            onDeleteConfirmCancel();
          }
        }}
        style={[styles.card, isSelected && styles.cardSelected]}
      >
        <View style={styles.collapsedContent}>
          <View style={styles.collapsedMainContent}>
            <View style={styles.collapsedHeader}>
            {/* Selection checkbox - only show when in combine mode */}
            {showSelectionCheckbox && combineMode && (onSelect || onDeselect) && (
              <TouchableOpacity
                onPress={handleSelectionToggle}
                style={styles.selectionCheckbox}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isSelected ? "checkbox" : "checkbox-outline"}
                  size={24}
                  color={isSelected ? "#FF4444" : "#888"}
                />
              </TouchableOpacity>
            )}
            {entry.lines ? (
              // Render typed lines in original order
              <View style={styles.exerciseNameContainer}>
                {entry.lines.map((line) => {
                  if (line.kind === 'header') {
                    return (
                      <Text key={line.id} style={styles.exerciseName}>
                        {toTitleCase(line.text)}
                      </Text>
                    );
                  } else {
                    return (
                      <Text key={line.id} style={styles.setLine}>
                        {line.text}
                      </Text>
                    );
                  }
                })}
              </View>
            ) : (
              // Legacy rendering fallback
              <View style={styles.exerciseNameContainer}>
                <Text style={styles.exerciseName}>
                  {toTitleCase(exerciseName)}
                </Text>
              </View>
            )}
            {!combineMode && (
              <View style={styles.collapsedActions}>
                <TouchableOpacity
                  onPress={handleEdit}
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="pencil" size={18} color="#888888" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          </View>
          {/* Reorder handle - positioned on the right side */}
          {!combineMode && (onMoveUp || onMoveDown) && (
            <View style={styles.reorderHandle}>
              <TouchableOpacity
                onPress={onMoveUp}
                disabled={!canMoveUp}
                style={[styles.reorderHandleButton, !canMoveUp && styles.reorderButtonDisabled]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-up" size={16} color={canMoveUp ? "#888888" : "#444444"} />
              </TouchableOpacity>
              <View style={styles.reorderHandleDivider} />
              <TouchableOpacity
                onPress={onMoveDown}
                disabled={!canMoveDown}
                style={[styles.reorderHandleButton, !canMoveDown && styles.reorderButtonDisabled]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-down" size={16} color={canMoveDown ? "#888888" : "#444444"} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {/* Bottom section with timestamp on left, trash icon on right */}
        <View style={styles.cardBottom}>
          <View style={styles.collapsedMeta}>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
          {!combineMode && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation(); // Prevent card press from firing
                handleDeletePress();
              }}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isDeleteConfirming ? (
                <Animated.View style={deleteConfirmStyle}>
                  <Text style={styles.deleteConfirmText}>DELETE ?</Text>
                </Animated.View>
              ) : (
                <Ionicons name="trash-outline" size={18} color="#888888" />
              )}
            </TouchableOpacity>
          )}
        </View>
        {!entry.lines && entry.rawTranscription && (
          <View style={styles.rawTranscriptionContainer}>
            <View style={styles.rawTranscriptionIndicator} />
            <Text style={styles.rawTranscription}>
              {entry.rawTranscription}
            </Text>
          </View>
        )}
        {entry.lines ? null : (
          // Legacy rendering fallback - only show if no lines
          displaySets.length > 0 && (
            <View style={styles.setsContainer}>
              {displaySets.map((set, index) => (
                <Text key={index} style={styles.setLine}>
                  {set}
                </Text>
              ))}
            </View>
          )
        )}
      </Pressable>
    );

    // Wrap in Pressable only for combine mode selection
    // In normal mode, no press handler - allows drag to work
    if (combineMode) {
      return (
        <Pressable 
          onPress={handleCardPress}
        >
          {cardContent}
        </Pressable>
      );
    }
    // In normal mode, return card content directly (no Pressable wrapper)
    // This allows the outer drag Pressable to handle gestures
    return cardContent;
  }

  // Expanded view
  return (
    <Pressable
      onPress={() => {
        // Cancel delete confirmation if tapping outside the delete button
        if (isDeleteConfirming && onDeleteConfirmCancel) {
          onDeleteConfirmCancel();
        }
      }}
      style={[styles.card, styles.expandedCard]}
    >
      {/* Header with collapse and delete buttons */}
      <View style={styles.expandedHeader}>
        <TouchableOpacity onPress={handleCollapse} style={styles.collapseButton}>
          <Ionicons name="chevron-up" size={20} color="#888888" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDeletePress}
          style={styles.deleteButton}
        >
          {isDeleteConfirming ? (
            <Animated.View style={deleteConfirmStyle}>
              <Text style={styles.deleteConfirmText}>DELETE ?</Text>
            </Animated.View>
          ) : (
            <Ionicons name="trash-outline" size={18} color="#888888" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.expandedContent}>
        {/* Editable lines list */}
        <View style={styles.textAreaContainer}>
          <Text style={styles.fieldLabel}>Workout Content</Text>
          <ScrollView 
            style={styles.linesScrollView}
            nestedScrollEnabled={true}
          >
            {editableLines.map((line, index) => (
              <View key={line.id} style={styles.lineRow}>
                <TouchableOpacity
                  onPress={() => handleLineKindToggle(line.id)}
                  style={styles.lineKindToggle}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={line.kind === 'header' ? 'text-outline' : 'list-outline'}
                    size={20}
                    color={line.kind === 'header' ? '#FFBF00' : '#888888'}
                  />
                </TouchableOpacity>
                <TextInput
                  ref={(ref) => {
                    if (ref) {
                      lineInputRefs.current.set(line.id, ref);
                      if (index === 0 && !firstLineInputRef.current) {
                        (firstLineInputRef as React.MutableRefObject<TextInput | null>).current = ref;
                      }
                    }
                  }}
                  style={[styles.lineTextInput, line.kind === 'header' && styles.lineTextInputHeader]}
                  value={line.text}
                  onChangeText={(text) => handleLineTextChange(line.id, text)}
                  placeholder={line.kind === 'header' ? 'Exercise name...' : 'Set details...'}
                  placeholderTextColor="#666"
                  multiline={true}
                  textAlignVertical="top"
                  onFocus={handleSummaryFocus}
                  onBlur={handleSummaryBlur}
                />
                {editableLines.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveLine(line.id)}
                    style={styles.lineRemoveButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#888888" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              onPress={handleAddLine}
              style={styles.addLineButton}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color="#888888" />
              <Text style={styles.addLineText}>Add line</Text>
            </TouchableOpacity>
          </ScrollView>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414', // Premium dark surface color
    borderRadius: 16,
    padding: 16,
    marginBottom: 12, // Spacing between cards
    // Subtle edge instead of strong border
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 0, 0.10)', // Very subtle amber edge
    // Subtle elevation for layered feel
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3, // Android elevation
    overflow: 'hidden',
  },
  cardSelected: {
    // Strong yellow outline only when selected/active
    borderColor: '#FFBF00',
    borderWidth: 2,
    backgroundColor: '#141414',
  },
  expandedCard: {
    marginBottom: 0, // Remove margin since outline wrapper handles spacing
    // When expanded/editing, show slightly more visible border
    borderColor: 'rgba(255, 200, 0, 0.15)', // Slightly more visible when editing
  },
  collapsedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  collapsedMainContent: {
    flex: 1,
  },
  collapsedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  selectionCheckbox: {
    marginRight: 12,
    padding: 4,
  },
  exerciseNameContainer: {
    flex: 1,
    marginRight: 8,
    flexShrink: 1,
  },
  exerciseName: {
    fontSize: 20, // Larger for more prominence
    fontWeight: '800', // Extra bold for stronger presence
    color: '#FFBF00', // Amber Yellow
    flexWrap: 'wrap',
    letterSpacing: 0.5, // Slight letter spacing for better readability
  },
  setsContainer: {
    marginTop: 4,
    marginBottom: 6,
  },
  setLine: {
    fontSize: 18, // Bigger font size
    color: '#FFFFFF', // Pure White
    fontStyle: 'italic', // Italicized as in screenshot
    marginBottom: 2,
  },
  setDetails: {
    fontSize: 15, // Same size as weight/rep numbers
    color: '#FFFFFF', // Pure White
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
  reorderHandle: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 12,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#2A2A2A',
  },
  reorderHandleButton: {
    padding: 4,
  },
  reorderHandleDivider: {
    width: 20,
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 2,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  collapsedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#FFFFFF', // Pure White
  },
  rawTranscriptionContainer: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'flex-start',
  },
  rawTranscriptionIndicator: {
    width: 3,
    backgroundColor: '#FFBF00', // Yellow accent color
    marginRight: 8,
    marginTop: 2,
    minHeight: 16,
  },
  rawTranscription: {
    fontSize: 12,
    color: '#FFFFFF', // Pure White
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 16,
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
    height: 150,
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
    height: 150,
    textAlignVertical: 'top',
  },
  readOnlyTextArea: {
    padding: 12,
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
    minHeight: 150,
  },
  placeholderText: {
    color: '#666666',
  },
  linesScrollView: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    backgroundColor: '#0A0A0A',
    padding: 8,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  lineKindToggle: {
    padding: 4,
    marginTop: 4,
  },
  lineTextInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minHeight: 36,
    maxHeight: 100,
  },
  lineTextInputHeader: {
    fontWeight: '700',
    color: '#FFD700',
  },
  lineRemoveButton: {
    padding: 4,
    marginTop: 4,
  },
  addLineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginTop: 4,
    gap: 6,
  },
  addLineText: {
    color: '#888888',
    fontSize: 14,
  },
  deleteConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFBF00', // Amber accent color matching headers and buttons
    letterSpacing: 0.5,
  },
});

