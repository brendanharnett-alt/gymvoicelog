import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutEntry, DayWorkout, CardLine } from '../types/workout';

const STORAGE_KEY = 'GYMVOICELOG_CARDS';

// In-memory store
const workoutsByDate = new Map<string, DayWorkout>();

function getDateKey(date: Date): string {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.toISOString().split('T')[0];
}

function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

// Serialize workouts for storage (convert Dates to ISO strings)
function serializeWorkouts(map: Map<string, DayWorkout>): string {
  const obj: Record<string, { date: string; entries: Array<Omit<WorkoutEntry, 'date' | 'timestamp'> & { date: string; timestamp: string }> }> = {};
  
  map.forEach((dayWorkout, key) => {
    obj[key] = {
      date: dayWorkout.date.toISOString(),
      entries: dayWorkout.entries.map(entry => ({
        ...entry,
        date: entry.date.toISOString(),
        timestamp: entry.timestamp.toISOString(),
      })),
    };
  });
  
  return JSON.stringify(obj);
}

// Deserialize workouts from storage (convert ISO strings to Dates)
function deserializeWorkouts(json: string): Map<string, DayWorkout> {
  try {
    const obj = JSON.parse(json);
    const map = new Map<string, DayWorkout>();
    
    Object.keys(obj).forEach(key => {
      const dayWorkout = obj[key];
      map.set(key, {
        date: new Date(dayWorkout.date),
        entries: dayWorkout.entries.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          timestamp: new Date(entry.timestamp),
        })),
      });
    });
    
    return map;
  } catch (error) {
    console.warn('Failed to deserialize workouts:', error);
    return new Map();
  }
}

// Load workouts from AsyncStorage
async function loadWorkouts(): Promise<Map<string, DayWorkout>> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      return deserializeWorkouts(json);
    }
  } catch (error) {
    console.warn('Failed to load workouts:', error);
  }
  return new Map();
}

// Save workouts to AsyncStorage
async function saveWorkouts(map: Map<string, DayWorkout>): Promise<void> {
  try {
    const json = serializeWorkouts(map);
    await AsyncStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.warn('Failed to save workouts:', error);
  }
}

export function useWorkoutStore() {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const today = new Date();
    return normalizeDate(today);
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialLoad = useRef(true);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

  // Load workouts on mount
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadWorkouts().then(loaded => {
        loaded.forEach((dayWorkout, key) => {
          workoutsByDate.set(key, dayWorkout);
        });
        setIsLoaded(true);
        // Trigger re-render to show loaded data
        setCurrentDate(new Date(currentDate));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save workouts whenever the map changes (triggered by mutations)
  const triggerSave = useCallback(() => {
    saveWorkouts(workoutsByDate);
  }, []);

  const currentDayWorkout = useMemo<DayWorkout>(() => {
    const key = getDateKey(currentDate);
    const existing = workoutsByDate.get(key);
    
    if (existing) {
      return existing;
    }
    
    const newWorkout: DayWorkout = {
      date: new Date(currentDate),
      entries: [],
    };
    workoutsByDate.set(key, newWorkout);
    return newWorkout;
  }, [currentDate]);

  const addEntry = useCallback((text: string = '', targetDate?: Date) => {
    // If targetDate is provided, use it (for recordings, explicitly pass today)
    // Otherwise, use currentDate (viewed date) for manual entries
    // This separates recordingTargetDate from viewedDate
    const entryDate = targetDate ? normalizeDate(targetDate) : normalizeDate(currentDate);
    const key = getDateKey(entryDate);
    const workout = workoutsByDate.get(key) || {
      date: new Date(entryDate),
      entries: [],
    };
    
    const newEntry: WorkoutEntry = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      timestamp: new Date(),
      date: new Date(entryDate),
    };
    
    workout.entries.push(newEntry);
    workoutsByDate.set(key, workout);
    
    // Trigger re-render by updating current date reference
    setCurrentDate(new Date(currentDate));
    
    // Save to AsyncStorage
    triggerSave();
    
    return newEntry; // Return the new entry so caller can get its ID
  }, [currentDate, triggerSave]);

  const updateEntry = useCallback((id: string, updates: Partial<WorkoutEntry>) => {
    let found = false;

    workoutsByDate.forEach((workout, key) => {
      const entry = workout.entries.find(e => e.id === id);
      if (entry) {
        Object.assign(entry, updates);
        workoutsByDate.set(key, workout);
        found = true;
      }
    });

    if (found) {
      setCurrentDate(new Date(currentDate));
      triggerSave();
    }
  }, [currentDate, triggerSave]);

  const deleteEntry = useCallback((id: string) => {
    const key = getDateKey(currentDate);
    const workout = workoutsByDate.get(key);
    
    if (workout) {
      workout.entries = workout.entries.filter(e => e.id !== id);
      workoutsByDate.set(key, workout);
      setCurrentDate(new Date(currentDate));
      
      // Save to AsyncStorage
      triggerSave();
    }
  }, [currentDate, triggerSave]);

  const reorderEntries = useCallback((orderedIds: string[]) => {
    const key = getDateKey(currentDate);
    const workout = workoutsByDate.get(key);
    
    if (workout) {
      const entryMap = new Map(workout.entries.map(e => [e.id, e]));
      workout.entries = orderedIds.map(id => entryMap.get(id)!).filter(Boolean);
      workoutsByDate.set(key, workout);
      setCurrentDate(new Date(currentDate));
      
      // Save to AsyncStorage
      triggerSave();
    }
  }, [currentDate, triggerSave]);

  const goToNextDay = useCallback(() => {
    const today = normalizeDate(new Date());
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const normalizedNext = normalizeDate(nextDate);
    
    // Only navigate if next date is not beyond today
    if (normalizedNext.getTime() <= today.getTime()) {
      setCurrentDate(normalizedNext);
    }
  }, [currentDate]);

  const goToPrevDay = useCallback(() => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setCurrentDate(normalizeDate(prevDate));
  }, [currentDate]);

  const goToDate = useCallback((date: Date) => {
    const today = normalizeDate(new Date());
    const normalizedDate = normalizeDate(date);
    
    // Only navigate if date is not beyond today
    if (normalizedDate.getTime() <= today.getTime()) {
      setCurrentDate(normalizedDate);
    }
  }, []);

  // Selection management for Combine feature
  const selectCard = useCallback((id: string) => {
    setSelectedCardIds(prev => new Set([...prev, id]));
  }, []);

  const deselectCard = useCallback((id: string) => {
    setSelectedCardIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCardIds(new Set());
  }, []);

  const getSelectedCards = useCallback((): WorkoutEntry[] => {
    const key = getDateKey(currentDate);
    const workout = workoutsByDate.get(key);
    if (!workout) return [];

    return workout.entries
      .filter(entry => selectedCardIds.has(entry.id))
      .sort((a, b) => {
        // Sort by timestamp to preserve chronological order
        const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return timeA.getTime() - timeB.getTime();
      });
  }, [currentDate, selectedCardIds]);

  const combineSelectedCards = useCallback(async (combinedLines: CardLine[]) => {
    const selectedEntries = getSelectedCards();
    if (selectedEntries.length < 2) {
      throw new Error('At least 2 cards must be selected to combine');
    }

    const key = getDateKey(currentDate);
    const workout = workoutsByDate.get(key);
    if (!workout) {
      throw new Error('No workout found for current date');
    }

    // Get the earliest timestamp from selected entries for the new combined entry
    const earliestTimestamp = selectedEntries.reduce((earliest, entry) => {
      const entryTime = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);
      const earliestTime = earliest instanceof Date ? earliest : new Date(earliest);
      return entryTime.getTime() < earliestTime.getTime() ? entryTime : earliest;
    }, selectedEntries[0].timestamp);

    // Generate title from header lines (or first line if no headers) for backward compatibility
    const headerLines = combinedLines.filter(line => line.kind === 'header');
    const titleText = headerLines.length > 0
      ? headerLines.map(line => line.text).join('\n')
      : combinedLines.length > 0
        ? combinedLines[0].text
        : '';
    
    // Generate text from all lines for backward compatibility
    const textContent = combinedLines.map(line => line.text).join('\n');

    // Create new combined entry with lines
    const combinedEntry: WorkoutEntry = {
      id: `${Date.now()}-${Math.random()}`,
      text: textContent,
      title: titleText,
      lines: combinedLines,
      timestamp: earliestTimestamp instanceof Date ? earliestTimestamp : new Date(earliestTimestamp),
      date: new Date(currentDate),
    };

    // Delete original entries
    const idsToDelete = new Set(selectedEntries.map(e => e.id));
    workout.entries = workout.entries.filter(e => !idsToDelete.has(e.id));

    // Add combined entry
    workout.entries.push(combinedEntry);
    workoutsByDate.set(key, workout);

    // Clear selection
    setSelectedCardIds(new Set());

    // Trigger re-render and save
    setCurrentDate(new Date(currentDate));
    triggerSave();

    return combinedEntry;
  }, [currentDate, getSelectedCards, triggerSave]);

  return {
    currentDate,
    currentDayWorkout,
    addEntry,
    updateEntry,
    deleteEntry,
    reorderEntries,
    goToNextDay,
    goToPrevDay,
    goToDate,
    // Selection and combine methods
    selectedCardIds,
    selectCard,
    deselectCard,
    clearSelection,
    getSelectedCards,
    combineSelectedCards,
  };
}

