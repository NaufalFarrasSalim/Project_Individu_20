export type MasteryStatus = 'Belajar' | 'Dalam Proses' | 'Dikuasai';
export type CategoryType = 'Noun' | 'Verb' | 'Adjective' | 'Adverb' | 'Other';

export interface Flashcard {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: CategoryType;
  status: MasteryStatus;
  createdAt: string;
}

// Menggunakan Utility Type Partial untuk operasi update data parsial
export type FlashcardUpdateInput = Partial<Omit<Flashcard, 'id' | 'createdAt'>>;