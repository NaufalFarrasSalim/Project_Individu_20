import { Flashcard } from '../types/flashcard';

export function calculateSummary(cards: Flashcard[]) {
  const total = cards.length;
  if (total === 0) return { total: 0, masteredCount: 0, percentage: 0 };

  const masteredCount = cards.filter(c => c.status === 'Dikuasai').length;
  const percentage = Math.round((masteredCount / total) * 100);

  return {
    total,
    masteredCount,
    percentage
  };
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}