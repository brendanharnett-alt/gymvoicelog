const BACKEND_BASE_URL = 'https://gymvoicelog-stt-production.up.railway.app';

import { getUserId } from './userId';

/**
 * Logs an edit event for a card to the backend
 * @param cardId The ID of the card that was edited
 * @param summaryText Optional summary text to update on the backend
 */
export async function editCard(cardId: string, summaryText?: string): Promise<void> {
  const userId = await getUserId();
  const url = `${BACKEND_BASE_URL}/cards/${cardId}/edit`;
  const body: { user_id: string; summary_text?: string } = { user_id: userId };

  if (summaryText !== undefined) {
    body.summary_text = summaryText;
  }

  console.log('editCard - Making request to:', url);
  console.log('editCard - Request body:', body);

  fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
    .then((response) => {
      console.log('editCard - Response status:', response.status);
      if (!response.ok) {
        console.error('editCard - Response not OK:', response.status, response.statusText);
      }
      return response;
    })
    .catch((error) => {
      console.error('Failed to log card edit:', error);
    });
}

/**
 * Logs a delete event for a card to the backend
 * @param cardId The ID of the card that was deleted
 */
export async function deleteCard(cardId: string): Promise<void> {
  const userId = await getUserId();
  const url = `${BACKEND_BASE_URL}/cards/${cardId}/delete`;

  fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  }).catch((error) => {
    console.error('Failed to log card delete:', error);
  });
}

/**
 * Logs a merge event for cards to the backend
 * @param sourceCardId The ID of the source card being merged
 * @param targetCardId The ID of the target card that receives the merge
 */
export async function mergeCards(sourceCardId: string, targetCardId: string): Promise<void> {
  const userId = await getUserId();
  const url = `${BACKEND_BASE_URL}/cards/merge`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      sourceCardId,
      targetCardId,
    }),
  }).catch((error) => {
    console.error('Failed to log card merge:', error);
  });
}

