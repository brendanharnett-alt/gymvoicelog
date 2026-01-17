import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutEntry, DayWorkout } from '../types/workout';

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

  const addEntry = useCallback((text: string = '') => {
    const key = getDateKey(currentDate);
    const workout = workoutsByDate.get(key) || {
      date: new Date(currentDate),
      entries: [],
    };
    
    const newEntry: WorkoutEntry = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      timestamp: new Date(),
      date: new Date(currentDate),
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
    const key = getDateKey(currentDate);
    const workout = workoutsByDate.get(key);
    
    if (workout) {
      const entry = workout.entries.find(e => e.id === id);
      if (entry) {
        Object.assign(entry, updates);
        workoutsByDate.set(key, workout);
        setCurrentDate(new Date(currentDate));
        
        // Save to AsyncStorage
        triggerSave();
      }
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
  };
}

