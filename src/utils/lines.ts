import { CardLine, LineKind } from '../types/workout';

/**
 * Generates a unique ID for a line
 * Uses crypto.randomUUID() if available, otherwise falls back to a simple generator
 */
function generateLineId(): string {
  // Try crypto.randomUUID() first (available in modern environments)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: simple unique ID generator
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Set pattern regex - matches "225 x 6", "100x10", "225.5 x 6", "100 x 10.5", etc.
 * Allows decimals in both weight and reps
 */
const SET_PATTERN = /^\d+(\.\d+)?\s*x\s*\d+(\.\d+)?/i;

/**
 * Converts plain text to body lines (all lines are body type, including empty lines)
 * @param text The text to convert
 * @returns Array of CardLine objects, all with kind "body"
 */
export function textToBodyLines(text: string): CardLine[] {
  if (!text) {
    return [];
  }
  
  const lines = text.split('\n');
  return lines.map((line, index) => ({
    id: generateLineId(),
    text: line, // Preserve original line (including empty strings)
    kind: 'body' as LineKind,
  }));
}

/**
 * Converts summary text to typed lines (header/body classification)
 * @param summary The summary text to convert
 * @returns Array of CardLine objects with appropriate kind (header or body)
 */
export function summaryToTypedLines(summary: string): CardLine[] {
  if (!summary) {
    return [];
  }
  
  const lines = summary.split('\n');
  
  // Count non-empty lines
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  const hasMultipleNonEmptyLines = nonEmptyLines.length > 1;
  
  // Check if a line contains any digits
  const hasDigits = (text: string): boolean => {
    return /\d/.test(text);
  };
  
  return lines.map((line) => {
    const trimmed = line.trim();
    
    // Determine kind based on content
    let kind: LineKind = 'body'; // Default to body
    
    // Empty lines are always body
    if (trimmed === '') {
      kind = 'body';
    }
    // A line can only be header if ALL are true:
    // 1. Summary has more than one non-empty line
    // 2. Line contains no digits
    else if (hasMultipleNonEmptyLines && !hasDigits(trimmed)) {
      kind = 'header';
    }
    // All other non-empty lines are body
    else {
      kind = 'body';
    }
    
    return {
      id: generateLineId(),
      text: line, // Preserve original line (including empty strings and whitespace)
      kind,
    };
  });
}

