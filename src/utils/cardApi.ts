const BACKEND_BASE_URL = 'https://gymvoicelog-stt-production.up.railway.app';

/**
 * Logs an edit event for a card to the backend
 * @param cardId The ID of the card that was edited
 * @param summaryText Optional summary text to update on the backend
 */
export function editCard(cardId: string, summaryText?: string): void {
  const url = `${BACKEND_BASE_URL}/cards/${cardId}/edit`;
  const body: { summary_text?: string } = {};
  
  if (summaryText !== undefined) {
    body.summary_text = summaryText;
  }

  fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).catch((error) => {
    console.error('Failed to log card edit:', error);
  });
}

/**
 * Logs a delete event for a card to the backend
 * @param cardId The ID of the card that was deleted
 */
export function deleteCard(cardId: string): void {
  const url = `${BACKEND_BASE_URL}/cards/${cardId}/delete`;

  fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  }).catch((error) => {
    console.error('Failed to log card delete:', error);
  });
}

/**
 * Logs a merge event for cards to the backend
 * @param sourceCardId The ID of the source card being merged
 * @param targetCardId The ID of the target card that receives the merge
 */
export function mergeCards(sourceCardId: string, targetCardId: string): void {
  const url = `${BACKEND_BASE_URL}/cards/merge`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sourceCardId,
      targetCardId,
    }),
  }).catch((error) => {
    console.error('Failed to log card merge:', error);
  });
}

