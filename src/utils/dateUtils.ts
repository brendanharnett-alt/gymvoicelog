export function formatDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function getDateLabel(date: Date, today: Date): string {
  // Normalize both dates to midnight for accurate comparison
  const dateCopy = new Date(date);
  dateCopy.setHours(0, 0, 0, 0);
  const todayCopy = new Date(today);
  todayCopy.setHours(0, 0, 0, 0);
  
  const diffTime = dateCopy.getTime() - todayCopy.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return formatDate(date);
}

export function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  normalized.setMinutes(0);
  normalized.setSeconds(0);
  normalized.setMilliseconds(0);
  return normalized;
}

export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  return normalizeDate(result);
}

