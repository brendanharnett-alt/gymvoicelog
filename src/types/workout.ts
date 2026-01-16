export interface WorkoutEntry {
  id: string;
  text: string;
  timestamp: Date;
  date: Date; // The date this entry belongs to
}

export interface DayWorkout {
  date: Date;
  entries: WorkoutEntry[];
}

