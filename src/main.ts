import './style.css';
import { Flashcard, MasteryStatus, CategoryType } from './types/flashcard';
import { FlashcardService } from './services/storage';
import { calculateSummary, shuffleArray } from './utils/helpers';

let allCards: Flashcard[] = [];
let editingId: string | null = null;
let currentQuizCards: Flashcard[] = [];
let currentQuizIndex: number = 0;
let isShowingMeaning: boolean = false;

const gridEl = document.getElementById('flashcard-grid') as HTMLElement;
const loadingEl = document.getElementById('loading-state') as HTMLElement;
const errorEl = document.getElementById('error-state') as HTMLElement;

const statTotal = document.getElementById('stat-total') as HTMLElement;
const statMastered = document.getElementById('stat-mastered') as HTMLElement;
const statPercentage = document.getElementById('stat-percentage') as HTMLElement;

const searchInput = document.getElementById('search-input') as HTMLInputElement;
const filterStatus = document.getElementById('filter-status') as HTMLSelectElement;
const filterCategory = document.getElementById('filter-category') as HTMLSelectElement;

const btnOpenModal = document.getElementById('btn-open-modal') as HTMLButtonElement;
const btnStartQuiz = document.getElementById('btn-start-quiz') as HTMLButtonElement;
const vocabModal = document.getElementById('vocab-modal') as HTMLElement;
const vocabForm = document.getElementById('vocab-form') as HTMLFormElement;
const btnCancel = document.getElementById('btn-cancel') as HTMLButtonElement;
const modalTitle = document.getElementById('modal-title') as HTMLElement;

const quizModal = document.getElementById('quiz-modal') as HTMLElement;
const quizContainer = document.getElementById('quiz-container') as HTMLElement;
const btnCloseQuiz = document.getElementById('btn-close-quiz') as HTMLButtonElement;

async function initApp() {
  try {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');

    allCards = await FlashcardService.loadFlashcards();
    renderApp();
  } catch (err) {
    errorEl.textContent = (err as Error).message;
    errorEl.classList.remove('hidden');
  } finally {
    loadingEl.classList.add('hidden');
  }
}

function renderApp() {
  updateSummaryDisplay();
  renderFlashcards();
}

function updateSummaryDisplay() {
  const summary = calculateSummary(allCards);
  statTotal.textContent = summary.total.toString();
  statMastered.textContent = summary.masteredCount.toString();
  statPercentage.textContent = `${summary.percentage}%`;
}

function renderFlashcards() {
  const keyword = searchInput.value.toLowerCase();
  const selectedStatus = filterStatus.value;
  const selectedCategory = filterCategory.value;

  const filtered = allCards.filter(card => {
    const matchKeyword = card.word.toLowerCase().includes(keyword) || card.meaning.toLowerCase().includes(keyword);
    const matchStatus = selectedStatus ? card.status === selectedStatus : true;
    const matchCategory = selectedCategory ? card.category === selectedCategory : true;
    return matchKeyword && matchStatus && matchCategory;
  });

  if (filtered.length === 0) {
    gridEl.innerHTML = `<p class="empty-message">Tidak ada data kosakata yang ditemukan.</p>`;
    return;
  }

  gridEl.innerHTML = filtered.map(card => `
    <div class="card flashcard-item">
      <div class="card-header">
        <span class="badge category-${card.category.toLowerCase()}">${card.category}</span>
        <span class="badge status-${card.status.toLowerCase().replace(/\s+/g, '-')}">${card.status}</span>
      </div>
      <h3 class="card-word">${card.word}</h3>
      <p class="card-meaning"><strong>Arti:</strong> ${card.meaning}</p>
      <p class="card-example"><em>"${card.example}"</em></p>
      <div class="card-actions">
        <button class="btn-sm btn-edit" data-id="${card.id}">Edit</button>
        <button class="btn-sm btn-delete" data-id="${card.id}">Hapus</button>
      </div>
    </div>
  `).join('');

  attachCardEventListeners();
}

function attachCardEventListeners() {
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) openEditModal(id);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id && confirm('Yakin ingin menghapus kosakata ini?')) {
        allCards = await FlashcardService.deleteCard(id);
        renderApp();
      }
    });
  });
}

function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'Tambah Kosakata Baru';
  vocabForm.reset();
  (document.getElementById('card-id') as HTMLInputElement).value = '';
  vocabModal.classList.remove('hidden');
}

function openEditModal(id: string) {
  const card = allCards.find(c => c.id === id);
  if (!card) return;

  editingId = id;
  modalTitle.textContent = 'Edit Kosakata';
  (document.getElementById('card-id') as HTMLInputElement).value = card.id;
  (document.getElementById('input-word') as HTMLInputElement).value = card.word;
  (document.getElementById('input-meaning') as HTMLInputElement).value = card.meaning;
  (document.getElementById('input-example') as HTMLTextAreaElement).value = card.example;
  (document.getElementById('input-category') as HTMLSelectElement).value = card.category;
  (document.getElementById('input-status') as HTMLSelectElement).value = card.status;

  vocabModal.classList.remove('hidden');
}

function closeModal() {
  vocabModal.classList.add('hidden');
  editingId = null;
}

vocabForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const word = (document.getElementById('input-word') as HTMLInputElement).value.trim();
  const meaning = (document.getElementById('input-meaning') as HTMLInputElement).value.trim();
  const example = (document.getElementById('input-example') as HTMLTextAreaElement).value.trim();
  const category = (document.getElementById('input-category') as HTMLSelectElement).value as CategoryType;
  const status = (document.getElementById('input-status') as HTMLSelectElement).value as MasteryStatus;

  if (!word || !meaning || !example) {
    alert('Semua field wajib diisi dengan benar!');
    return;
  }

  if (editingId) {
    allCards = await FlashcardService.updateCard(editingId, { word, meaning, example, category, status });
  } else {
    allCards = await FlashcardService.addCard({ word, meaning, example, category, status });
  }

  closeModal();
  renderApp();
});

function startQuiz() {
  if (allCards.length === 0) {
    alert('Belum ada kosakata untuk dikuiskan!');
    return;
  }
  currentQuizCards = shuffleArray(allCards);
  currentQuizIndex = 0;
  isShowingMeaning = false;
  quizModal.classList.remove('hidden');
  renderQuizCard();
}

function renderQuizCard() {
  if (currentQuizIndex >= currentQuizCards.length) {
    quizContainer.innerHTML = `
      <div class="quiz-finished">
        <h3>🎉 Kuis Selesai!</h3>
        <p>Anda telah berlatih seluruh ${currentQuizCards.length} kosakata.</p>
        <button id="btn-restart-quiz" class="btn btn-primary">Ulangi Kuis</button>
      </div>
    `;
    document.getElementById('btn-restart-quiz')?.addEventListener('click', startQuiz);
    return;
  }

  const card = currentQuizCards[currentQuizIndex];
  quizContainer.innerHTML = `
    <div class="quiz-counter">Kartu ${currentQuizIndex + 1} dari ${currentQuizCards.length}</div>
    <div class="flashcard-interactive ${isShowingMeaning ? 'flipped' : ''}" id="interactive-card">
      <div class="card-face card-front">
        <span class="badge category-${card.category.toLowerCase()}">${card.category}</span>
        <h2>${card.word}</h2>
        <p class="hint-click">(Klik untuk melihat arti)</p>
      </div>
      <div class="card-face card-back">
        <h3>${card.meaning}</h3>
        <p><em>"${card.example}"</em></p>
      </div>
    </div>
    <div class="quiz-nav">
      <button id="btn-prev-quiz" class="btn btn-outline" ${currentQuizIndex === 0 ? 'disabled' : ''}>Sebelumnya</button>
      <button id="btn-next-quiz" class="btn btn-primary">Selanjutnya</button>
    </div>
  `;

  document.getElementById('interactive-card')?.addEventListener('click', () => {
    isShowingMeaning = !isShowingMeaning;
    renderQuizCard();
  });

  document.getElementById('btn-prev-quiz')?.addEventListener('click', () => {
    if (currentQuizIndex > 0) {
      currentQuizIndex--;
      isShowingMeaning = false;
      renderQuizCard();
    }
  });

  document.getElementById('btn-next-quiz')?.addEventListener('click', () => {
    currentQuizIndex++;
    isShowingMeaning = false;
    renderQuizCard();
  });
}

btnOpenModal.addEventListener('click', openAddModal);
btnCancel.addEventListener('click', closeModal);
btnStartQuiz.addEventListener('click', startQuiz);
btnCloseQuiz.addEventListener('click', () => quizModal.classList.add('hidden'));

searchInput.addEventListener('input', renderFlashcards);
filterStatus.addEventListener('change', renderFlashcards);
filterCategory.addEventListener('change', renderFlashcards);

initApp();