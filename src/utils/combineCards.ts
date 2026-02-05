const BACKEND_URL = 'https://gymvoicelog-stt-production.up.railway.app/combine';

/**
 * Combines multiple workout text entries into a single formatted entry using AI
 * @param texts Array of text strings to combine (in order)
 * @returns Combined formatted text string
 */
export async function combineCards(texts: string[]): Promise<string> {
  if (!texts || texts.length < 2) {
    throw new Error('At least 2 texts required to combine');
  }

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Combine failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.combinedText) {
      throw new Error('AI returned empty combined text');
    }

    return result.combinedText;
  } catch (err) {
    console.error('Failed to combine cards:', err);
    throw err;
  }
}

