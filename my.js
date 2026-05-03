/* ============================================================
   KANBAN BOARD — script.js
   Sections:
     1. Data layer  — load/save cards from localStorage
     2. Render      — draw all cards on the page
     3. Add cards   — show/hide form, create new card
     4. Delete      — remove a card
     5. Edit        — open modal, save changes
     6. Drag & drop — move cards between columns
     7. Startup     — run everything when page loads
   ============================================================ */


/* ── 1. DATA LAYER ───────────────────────────────────────── */

let board = {
  todo:       [],
  inprogress: [],
  done:       []
};

function loadBoard() {
  const saved = localStorage.getItem('kanban-board');
  if (saved) board = JSON.parse(saved);
}

function saveBoard() {
  localStorage.setItem('kanban-board', JSON.stringify(board));
}

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}


/* ── 2. RENDER ───────────────────────────────────────────── */

function renderBoard() {
  const columns = ['todo', 'inprogress', 'done'];

  columns.forEach(col => {
    const area  = document.getElementById('area-' + col);
    const count = document.getElementById('count-' + col);
    area.innerHTML = '';
    board[col].forEach(card => area.appendChild(createCardElement(card, col)));
    count.textContent = board[col].length;
  });

  // Update header stats
  const total = board.todo.length + board.inprogress.length + board.done.length;
  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-progress').textContent = board.inprogress.length;
  document.getElementById('stat-done').textContent     = board.done.length;
}

function createCardElement(card, col) {
  const div = document.createElement('div');
  div.className  = 'card';
  div.draggable  = true;
  div.dataset.id  = card.id;
  div.dataset.col = col;

  div.innerHTML = `
    <p class="card-text">${escapeHTML(card.text)}</p>
    <div class="card-actions">
      <button class="btn-edit"   onclick="openModal('${card.id}', '${col}')">Edit</button>
      <button class="btn-delete" onclick="deleteCard('${card.id}', '${col}')">Delete</button>
    </div>
  `;

  attachDragEvents(div);
  return div;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


/* ── 3. ADD CARDS ────────────────────────────────────────── */

function showForm(col) {
  document.getElementById('form-' + col).classList.remove('hidden');
  document.getElementById('input-' + col).focus();
}

function hideForm(col) {
  document.getElementById('form-' + col).classList.add('hidden');
  document.getElementById('input-' + col).value = '';
}

function addCard(col) {
  const textarea = document.getElementById('input-' + col);
  const text = textarea.value.trim();
  if (!text) return;

  board[col].push({ id: generateId(), text });
  saveBoard();
  renderBoard();
  hideForm(col);
}

// Ctrl+Enter shortcut to add/save quickly
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    ['todo', 'inprogress', 'done'].forEach(col => {
      const form = document.getElementById('form-' + col);
      if (!form.classList.contains('hidden')) addCard(col);
    });
    const modal = document.getElementById('modal-overlay');
    if (!modal.classList.contains('hidden')) saveEdit();
  }
  // Escape closes modal
  if (e.key === 'Escape') closeModal();
});


/* ── 4. DELETE ───────────────────────────────────────────── */

function deleteCard(id, col) {
  board[col] = board[col].filter(c => c.id !== id);
  saveBoard();
  renderBoard();
}


/* ── 5. EDIT ─────────────────────────────────────────────── */

let editingId  = null;
let editingCol = null;

function openModal(id, col) {
  editingId  = id;
  editingCol = col;
  const card = board[col].find(c => c.id === id);
  document.getElementById('modal-input').value = card.text;
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-input').focus();
}

function saveEdit() {
  const newText = document.getElementById('modal-input').value.trim();
  if (!newText) return;
  const card = board[editingCol].find(c => c.id === editingId);
  card.text  = newText;
  saveBoard();
  renderBoard();
  closeModal();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  editingId  = null;
  editingCol = null;
}

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});


/* ── 6. DRAG AND DROP ────────────────────────────────────── */

let dragId  = null;
let dragCol = null;

function attachDragEvents(cardEl) {
  cardEl.addEventListener('dragstart', function(e) {
    dragId  = this.dataset.id;
    dragCol = this.dataset.col;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  cardEl.addEventListener('dragend', function() {
    this.classList.remove('dragging');
  });
}

function attachColumnDropEvents() {
  document.querySelectorAll('.column').forEach(col => {
    const targetCol = col.dataset.status;

    col.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('drag-over');
    });

    col.addEventListener('dragleave', function() {
      this.classList.remove('drag-over');
    });

    col.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      if (targetCol === dragCol) return;

      const idx  = board[dragCol].findIndex(c => c.id === dragId);
      const [card] = board[dragCol].splice(idx, 1);
      board[targetCol].push(card);

      saveBoard();
      renderBoard();
    });
  });
}


/* ── 7. STARTUP ──────────────────────────────────────────── */

function init() {
  loadBoard();

  const isEmpty = !board.todo.length && !board.inprogress.length && !board.done.length;

  if (isEmpty) {
    board.todo = [
      { id: generateId(), text: 'Set up project folder structure' },
      { id: generateId(), text: 'Design the wireframes' },
      { id: generateId(), text: 'Write the README file' }
    ];
    board.inprogress = [
      { id: generateId(), text: 'Build the homepage layout' }
    ];
    board.done = [
      { id: generateId(), text: 'Create GitHub repository' }
    ];
    saveBoard();
  }

  renderBoard();
  attachColumnDropEvents();
}

init();