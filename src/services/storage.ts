import { Flashcard, FlashcardUpdateInput } from '../types/flashcard';

const STORAGE_KEY = 'VOCAB_FLASHCARDS_DATA';

const INITIAL_DATA: Flashcard[] = [
  {
    id: '1',
    word: 'Resilient',
    meaning: 'Tangguh, cepat pulih kembali dari kondisi sulit',
    example: 'She is a resilient leader who overcomes every obstacle.',
    category: 'Adjective',
    status: 'Dikuasai',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    word: 'Diligent',
    meaning: 'Rajin, tekun dalam mengerjakan sesuatu',
    example: 'He is a diligent student who always finishes his homework.',
    category: 'Adjective',
    status: 'Dalam Proses',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    word: 'Enhance',
    meaning: 'Meningkatkan, memperbaik kualitas atau nilai',
    example: 'Reading books can enhance your vocabulary skills.',
    category: 'Verb',
    status: 'Belajar',
    createdAt: new Date().toISOString()
  }
];

export class FlashcardService {
  // Simulasi async/await untuk memuat data dengan penanganan loading/error
  static async loadFlashcards(): Promise<Flashcard[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
            resolve(INITIAL_DATA);
          } else {
            resolve(JSON.parse(stored));
          }
        } catch (error) {
          reject(new Error('Gagal memuat data dari penyimpanan lokal: ' + error));
        }
      }, 400); // Simulasi jeda jaringan
    });
  }

  static saveFlashcards(cards: Flashcard[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }

  static async addCard(newCardData: Omit<Flashcard, 'id' | 'createdAt'>): Promise<Flashcard[]> {
    const cards = await this.loadFlashcards();
    const newCard: Flashcard = {
      ...newCardData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    const updated = [newCard, ...cards];
    this.saveFlashcards(updated);
    return updated;
  }

  static async updateCard(id: string, updates: FlashcardUpdateInput): Promise<Flashcard[]> {
    const cards = await this.loadFlashcards();
    const updated = cards.map(card => card.id === id ? { ...card, ...updates } : card);
    this.saveFlashcards(updated);
    return updated;
  }

  static async deleteCard(id: string): Promise<Flashcard[]> {
    const cards = await this.loadFlashcards();
    const updated = cards.filter(card => card.id !== id);
    this.saveFlashcards(updated);
    return updated;
  }
}