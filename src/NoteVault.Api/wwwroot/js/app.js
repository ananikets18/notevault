// NoteVault - Minimal Vanilla JS Frontend with JWT Authentication

const NOTES_API_URL = '/api/notes';
const AUTH_API_URL = '/api/auth';
const TOKEN_KEY = 'notevault_token';
const USER_KEY = 'notevault_username';

// State
let authMode = 'login'; // 'login' | 'register'
let noteToDeleteId = null;
let searchDebounceTimer = null;

// DOM Elements - Auth
const authSection = document.getElementById('authSection');
const notesSection = document.getElementById('notesSection');
const authHeaderActions = document.getElementById('authHeaderActions');
const userBadgeName = document.getElementById('userBadgeName');
const logoutBtn = document.getElementById('logoutBtn');

const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const authHeading = document.getElementById('authHeading');
const authSubheading = document.getElementById('authSubheading');
const authForm = document.getElementById('authForm');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authErrorBanner = document.getElementById('authErrorBanner');

// DOM Elements - Notes
const notesGrid = document.getElementById('notesGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const emptyTitle = document.getElementById('emptyTitle');
const emptySubtitle = document.getElementById('emptySubtitle');
const notesCountText = document.getElementById('notesCountText');

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

const noteModal = document.getElementById('noteModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalHeading = document.getElementById('modalHeading');
const noteForm = document.getElementById('noteForm');
const noteIdInput = document.getElementById('noteId');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const titleCounter = document.getElementById('titleCounter');
const formErrorBanner = document.getElementById('formErrorBanner');
const saveBtnText = document.getElementById('saveBtnText');
const openCreateBtn = document.getElementById('openCreateBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const emptyCreateBtn = document.getElementById('emptyCreateBtn');

const deleteModal = document.getElementById('deleteModal');
const deleteBackdrop = document.getElementById('deleteBackdrop');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deletePromptText = document.getElementById('deletePromptText');

const toastContainer = document.getElementById('toastContainer');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  syncAuthView();
});

// --- Event Listeners ---
function setupEventListeners() {
  // Auth mode tabs
  tabLoginBtn.addEventListener('click', () => setAuthMode('login'));
  tabRegisterBtn.addEventListener('click', () => setAuthMode('register'));
  authForm.addEventListener('submit', handleAuthSubmit);
  logoutBtn.addEventListener('click', () => logoutUser('Signed out successfully.'));

  // Search input with debounce (GET /api/notes?search=...)
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    clearSearchBtn.classList.toggle('hidden', !val);

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      loadNotes(val.trim());
    }, 300);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    loadNotes();
  });

  // Note modal open/close
  openCreateBtn.addEventListener('click', () => openNoteModal());
  emptyCreateBtn.addEventListener('click', () => openNoteModal());
  closeModalBtn.addEventListener('click', closeNoteModal);
  cancelModalBtn.addEventListener('click', closeNoteModal);
  modalBackdrop.addEventListener('click', closeNoteModal);

  // Note form submit (Create / Edit)
  noteForm.addEventListener('submit', handleNoteFormSubmit);

  // Character counter for title
  noteTitleInput.addEventListener('input', (e) => {
    titleCounter.textContent = `${e.target.value.length} / 100`;
  });

  // Delete modal buttons
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  deleteBackdrop.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // Keyboard navigation: Escape to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!noteModal.classList.contains('hidden')) closeNoteModal();
      if (!deleteModal.classList.contains('hidden')) closeDeleteModal();
    }
  });
}

// --- Session & Auth Helpers ---

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveSession(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function syncAuthView() {
  const token = getToken();
  const username = localStorage.getItem(USER_KEY);
  const isAuthenticated = Boolean(token);

  authSection.classList.toggle('hidden', isAuthenticated);
  notesSection.classList.toggle('hidden', !isAuthenticated);
  authHeaderActions.classList.toggle('hidden', !isAuthenticated);

  if (isAuthenticated) {
    userBadgeName.textContent = username || 'User';
    loadNotes(searchInput.value.trim());
  } else {
    notesGrid.innerHTML = '';
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
  }
}

function setAuthMode(mode) {
  authMode = mode;
  clearBannerError(authErrorBanner);

  const isLogin = mode === 'login';
  tabLoginBtn.className = isLogin
    ? 'py-2 text-xs font-semibold rounded-lg bg-white text-slate-900 shadow-sm transition-all'
    : 'py-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-800 transition-all';
  tabRegisterBtn.className = !isLogin
    ? 'py-2 text-xs font-semibold rounded-lg bg-white text-slate-900 shadow-sm transition-all'
    : 'py-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-800 transition-all';

  authHeading.textContent = isLogin ? 'Sign in to NoteVault' : 'Create your NoteVault account';
  authSubheading.textContent = isLogin
    ? 'Access your private notes securely with your account.'
    : 'Choose a username and password (min 6 characters).';
  authPasswordInput.autocomplete = isLogin ? 'current-password' : 'new-password';
  authSubmitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
}

function logoutUser(toastMessage = null, toastType = 'success') {
  clearSession();
  closeNoteModal();
  closeDeleteModal();
  authForm.reset();
  syncAuthView();
  if (toastMessage) {
    showToast(toastMessage, toastType);
  }
}

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    logoutUser('Session expired. Please sign in again.', 'error');
    throw new Error('Unauthorized');
  }

  return response;
}

async function extractApiError(res, fallbackMessage) {
  const data = await res.json().catch(() => null);
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }
  if (data?.message) {
    return data.message;
  }
  return fallbackMessage;
}

// --- Auth API Calls ---

async function handleAuthSubmit(e) {
  e.preventDefault();
  clearBannerError(authErrorBanner);

  const username = authUsernameInput.value.trim();
  const password = authPasswordInput.value;

  if (!username || !password) {
    showBannerError(authErrorBanner, 'Username and password are required.');
    return;
  }

  const isLogin = authMode === 'login';
  const endpoint = isLogin ? `${AUTH_API_URL}/login` : `${AUTH_API_URL}/register`;
  const originalText = authSubmitBtn.textContent;
  authSubmitBtn.textContent = isLogin ? 'Signing in...' : 'Creating account...';
  authSubmitBtn.disabled = true;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const msg = await extractApiError(res, isLogin ? 'Invalid credentials.' : 'Registration failed.');
      throw new Error(msg);
    }

    const authData = await res.json();
    saveSession(authData.token, authData.username);
    authForm.reset();
    showToast(isLogin ? `Welcome back, ${authData.username}!` : `Account created for ${authData.username}!`, 'success');
    syncAuthView();
  } catch (err) {
    showBannerError(authErrorBanner, err.message || 'Authentication failed.');
  } finally {
    authSubmitBtn.textContent = originalText;
    authSubmitBtn.disabled = false;
  }
}

// --- Notes API Calls ---

// 1 & 2. Read all notes / Search notes (GET /api/notes?search=...)
async function loadNotes(searchTerm = '') {
  if (!getToken()) return;
  showLoading(true);

  try {
    const url = searchTerm
      ? `${NOTES_API_URL}?search=${encodeURIComponent(searchTerm)}`
      : NOTES_API_URL;

    const res = await authFetch(url);
    if (!res.ok) {
      throw new Error(await extractApiError(res, 'Failed to fetch notes.'));
    }

    const notes = await res.json();
    renderNotes(notes, searchTerm);
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      console.error('Error loading notes:', err);
      showToast('Failed to load notes. Please check connection.', 'error');
    }
  } finally {
    showLoading(false);
  }
}

// 3. Create Note (POST /api/notes) or Edit Note (PUT /api/notes/{id})
async function handleNoteFormSubmit(e) {
  e.preventDefault();
  clearBannerError(formErrorBanner);

  const id = noteIdInput.value;
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  if (!title || !content) {
    showBannerError(formErrorBanner, 'Title and content are required.');
    return;
  }

  const isEditing = Boolean(id);
  const originalBtnText = saveBtnText.textContent;
  saveBtnText.textContent = isEditing ? 'Updating...' : 'Saving...';

  try {
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${NOTES_API_URL}/${id}` : NOTES_API_URL;

    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });

    if (!res.ok) {
      const msg = await extractApiError(res, isEditing ? 'Failed to update note.' : 'Failed to create note.');
      throw new Error(msg);
    }

    closeNoteModal();
    showToast(isEditing ? 'Note updated successfully!' : 'Note created successfully!', 'success');
    await loadNotes(searchInput.value.trim());
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      console.error('Error saving note:', err);
      showBannerError(formErrorBanner, err.message || 'An error occurred while saving.');
    }
  } finally {
    saveBtnText.textContent = originalBtnText;
  }
}

// 4. Delete Note (DELETE /api/notes/{id})
async function handleConfirmDelete() {
  if (!noteToDeleteId) return;

  const originalText = confirmDeleteBtn.textContent;
  confirmDeleteBtn.textContent = 'Deleting...';
  confirmDeleteBtn.disabled = true;

  try {
    const res = await authFetch(`${NOTES_API_URL}/${noteToDeleteId}`, {
      method: 'DELETE'
    });

    if (!res.ok && res.status !== 204) {
      throw new Error(await extractApiError(res, 'Failed to delete note.'));
    }

    closeDeleteModal();
    showToast('Note deleted successfully.', 'success');
    await loadNotes(searchInput.value.trim());
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      console.error('Error deleting note:', err);
      showToast('Failed to delete note.', 'error');
    }
  } finally {
    confirmDeleteBtn.textContent = originalText;
    confirmDeleteBtn.disabled = false;
  }
}

// --- UI Rendering ---

function renderNotes(notes, searchTerm = '') {
  notesGrid.innerHTML = '';

  const total = notes.length;
  notesCountText.textContent = searchTerm
    ? `Found ${total} ${total === 1 ? 'note' : 'notes'} for "${searchTerm}"`
    : `${total} ${total === 1 ? 'note' : 'notes'} saved`;

  if (total === 0) {
    notesGrid.classList.add('hidden');
    emptyState.classList.remove('hidden');

    if (searchTerm) {
      emptyTitle.textContent = `No notes match "${searchTerm}"`;
      emptySubtitle.textContent = 'Try searching with a different keyword or clear the search filter.';
      emptyCreateBtn.classList.add('hidden');
    } else {
      emptyTitle.textContent = 'No notes saved yet';
      emptySubtitle.textContent = 'Your vault is empty. Click below to add your first note!';
      emptyCreateBtn.classList.remove('hidden');
    }
    return;
  }

  emptyState.classList.add('hidden');
  notesGrid.classList.remove('hidden');

  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'group relative flex flex-col justify-between bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all';

    const dateFormatted = formatDate(note.createdAt);

    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-3 mb-2">
          <h2 class="text-base font-semibold text-slate-900 group-hover:text-slate-950 transition-colors break-words">
            ${escapeHtml(note.title)}
          </h2>
        </div>
        <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words mb-6">
          ${escapeHtml(note.content)}
        </p>
      </div>

      <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span title="Created timestamp">${dateFormatted}</span>
        
        <div class="flex items-center space-x-1">
          <!-- Edit button -->
          <button data-action="edit" data-id="${note.id}" 
                  class="edit-btn p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" 
                  title="Edit note">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <!-- Delete button -->
          <button data-action="delete" data-id="${note.id}" 
                  class="delete-btn p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                  title="Delete note">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    `;

    card.querySelector('.edit-btn').addEventListener('click', () => openNoteModal(note));
    card.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(note));

    notesGrid.appendChild(card);
  });
}

// --- Modal Helpers ---

function openNoteModal(note = null) {
  clearBannerError(formErrorBanner);
  if (note) {
    modalHeading.textContent = 'Edit Note';
    noteIdInput.value = note.id;
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    titleCounter.textContent = `${note.title.length} / 100`;
    saveBtnText.textContent = 'Save Changes';
  } else {
    modalHeading.textContent = 'New Note';
    noteIdInput.value = '';
    noteTitleInput.value = '';
    noteContentInput.value = '';
    titleCounter.textContent = '0 / 100';
    saveBtnText.textContent = 'Create Note';
  }

  noteModal.classList.remove('hidden');
  setTimeout(() => noteTitleInput.focus(), 100);
}

function closeNoteModal() {
  noteModal.classList.add('hidden');
}

function openDeleteModal(note) {
  noteToDeleteId = note.id;
  deletePromptText.textContent = `Are you sure you want to delete "${note.title}"? This cannot be undone.`;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  noteToDeleteId = null;
  deleteModal.classList.add('hidden');
}

function showBannerError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearBannerError(el) {
  el.textContent = '';
  el.classList.add('hidden');
}

function showLoading(isLoading) {
  loadingState.classList.toggle('hidden', !isLoading);
}

// --- Toast Notifications ---

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const bgColor = type === 'error' ? 'bg-rose-600' : 'bg-slate-900';
  const icon = type === 'error'
    ? `<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`
    : `<svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;

  toast.className = `flex items-center space-x-2 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${bgColor}`;
  toast.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Utilities ---

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
