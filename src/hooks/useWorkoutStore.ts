import { useState, useCallback, useMemo } from 'react';
import { WorkoutEntry, DayWorkout } from '../types/workout';

// Simple in-memory store (can be replaced with AsyncStorage later)
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

export function useWorkoutStore() {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const today = new Date();
    return normalizeDate(today);
  });

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
    
    return newEntry; // Return the new entry so caller can get its ID
  }, [currentDate]);

  const updateEntry = useCallback((id: string, updates: Partial<WorkoutEntry>) => {
    const key = getDateKey(currentDate);
    const workout = workoutsByDate.get(key);
    
    if (workout) {
      const entry = workout.entries.find(e => e.id === id);
      if (entry) {
        Object.assign(entry, updates);
        workoutsByDate.set(key, workout);
        setCurrentDate(new Date(currentDate));
      }
    }
  }, [currentDate]);

  const deleteEntry = useCallback((id: string) => {
    const key = getDateKey(currentDate);
    const workout = workoutsByDate.get(key);
    
    if (workout) {
      workout.entries = workout.entries.filter(e => e.id !== id);
      workoutsByDate.set(key, workout);
      setCurrentDate(new Date(currentDate));
    }
  }, [currentDate]);

  const reorderEntries = useCallback((orderedIds: string[]) => {
    const key = getDateKey(currentDate);
    const workout = workoutsByDate.get(key);
    
    if (workout) {
      const entryMap = new Map(workout.entries.map(e => [e.id, e]));
      workout.entries = orderedIds.map(id => entryMap.get(id)!).filter(Boolean);
      workoutsByDate.set(key, workout);
      setCurrentDate(new Date(currentDate));
    }
  }, [currentDate]);

  const goToNextDay = useCallback(() => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setCurrentDate(normalizeDate(nextDate));
  }, [currentDate]);

  const goToPrevDay = useCallback(() => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setCurrentDate(normalizeDate(prevDate));
  }, [currentDate]);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(normalizeDate(date));
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

