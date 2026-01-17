export interface WorkoutEntry {
  id: string;
  text: string; // Legacy field - kept for backwards compatibility
  timestamp: Date;
  date: Date; // The date this entry belongs to
  
  // New structured fields
  title?: string;
  description?: string;
  rawTranscription?: string;
  
  // Structured exercise fields
  exercise?: string;
  reps?: number;
  weight?: number;
  weightUnit?: 'lb' | 'kg';
  duration?: number; // Duration in minutes
}

export interface DayWorkout {
  date: Date;
  entries: WorkoutEntry[];
}

