/**
 * FocusFlow - Modern Vanilla JavaScript To-Do Application
 * 
 * Features:
 * - Pure vanilla JavaScript (no frameworks/libraries)
 * - Add, Edit, Delete tasks
 * - Mark tasks as Completed / Pending
 * - Three filter views: 'all', 'pending', 'completed'
 * - Live task stats counter (total, pending, completed)
 * - Persistent storage with browser localStorage & corruption safety
 * - Dark / Light theme toggle with persistence
 * - XSS-safe input escaping
 * - Smooth CSS transitions and state management
 */

// Strict mode ensures cleaner, safer JavaScript
'use strict';

/* ==========================================================================
   1. State & Storage Constants
   ========================================================================== */

const STORAGE_KEYS = {
  TASKS: 'focusflow_tasks_v1',
  THEME: 'focusflow_theme_pref'
};

// Application state held in memory
let state = {
  tasks: [],          // Array of task objects: { id, text, completed, createdAt }
  currentFilter: 'all', // 'all' | 'pending' | 'completed'
  theme: 'light',     // 'light' | 'dark'
  editingId: null     // ID of task currently being edited, or null
};

/* ==========================================================================
   2. DOM Element Selectors
   ========================================================================== */

const DOM = {
  // Theme elements
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeLabelText: document.getElementById('themeLabelText'),

  // Stat counter elements
  totalCount: document.getElementById('totalCount'),
  pendingCount: document.getElementById('pendingCount'),
  completedCount: document.getElementById('completedCount'),

  // Form & Input elements
  taskForm: document.getElementById('taskForm'),
  taskInput: document.getElementById('taskInput'),

  // Filter elements
  filterButtons: document.querySelectorAll('.filter-btn'),
  filteredCountText: document.getElementById('filteredCountText'),

  // List & Empty state elements
  taskList: document.getElementById('taskList'),
  emptyState: document.getElementById('emptyState'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateMessage: document.getElementById('emptyStateMessage')
};

/* ==========================================================================
   3. Utility Functions
   ========================================================================== */

/**
 * Escapes HTML characters in user-entered strings to prevent Cross-Site Scripting (XSS)
 * and prevent breaking the document markup.
 * @param {string} str - Raw input string
 * @returns {string} Sanitized string
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a unique, collision-resistant string ID for each task.
 * @returns {string}
 */
function generateId() {
  return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/* ==========================================================================
   4. LocalStorage Helpers (with Error Recovery)
   ========================================================================== */

/**
 * Loads tasks safely from localStorage.
 * Handles missing keys, corrupted JSON, or non-array payloads gracefully.
 * @returns {Array} List of validated task items
 */
function loadTasksFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!rawData) return [];

    const parsed = JSON.parse(rawData);

    // Verify parsed data is an array
    if (!Array.isArray(parsed)) {
      console.warn('Storage format invalid: expected an array. Initializing clean state.');
      return [];
    }

    // Sanitize & validate each item
    return parsed.filter(item => {
      return item && typeof item === 'object' && typeof item.id === 'string' && typeof item.text === 'string';
    }).map(item => ({
      id: item.id,
      text: item.text.trim(),
      completed: Boolean(item.completed),
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now()
    }));
  } catch (error) {
    console.error('Failed to read or parse tasks from localStorage:', error);
    // Graceful recovery: return empty task list so the application still works
    return [];
  }
}

/**
 * Saves current tasks array to localStorage.
 */
function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

/**
 * Loads saved theme preference or detects OS color scheme.
 * @returns {string} 'dark' | 'light'
 */
function loadThemePreference() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (error) {
    console.warn('Could not read theme preference:', error);
  }
  return 'light';
}

/**
 * Saves theme preference to localStorage.
 * @param {string} theme - 'dark' | 'light'
 */
function saveThemePreference(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.warn('Could not save theme preference:', error);
  }
}

/* ==========================================================================
   5. Theme Management
   ========================================================================== */

/**
 * Applies the given theme to the document and updates the toggle button.
 * @param {string} theme - 'dark' | 'light'
 */
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  if (theme === 'dark') {
    DOM.themeLabelText.textContent = 'Light Mode';
    DOM.themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
  } else {
    DOM.themeLabelText.textContent = 'Dark Mode';
    DOM.themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
  }
}

/**
 * Toggles between light and dark themes.
 */
function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  saveThemePreference(nextTheme);
}

/* ==========================================================================
   6. Task Core Actions (CRUD & Toggle)
   ========================================================================== */

/**
 * Adds a new task to the task list.
 * @param {string} rawText - Unsanitized input from the form
 */
function addTask(rawText) {
  const trimmed = rawText.trim();
  // Edge case: ignore empty or whitespace-only task input
  if (!trimmed) {
    return;
  }

  const newTask = {
    id: generateId(),
    text: trimmed,
    completed: false,
    createdAt: Date.now()
  };

  // Prepend to display newest tasks first
  state.tasks.unshift(newTask);
  saveTasksToStorage();
  renderApp();
}

/**
 * Toggles a task's status between pending and completed.
 * @param {string} id - Task identifier
 */
function toggleTaskStatus(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasksToStorage();
  renderApp();
}

/**
 * Initiates inline edit mode for a specific task.
 * @param {string} id - Task identifier
 */
function startEditTask(id) {
  state.editingId = id;
  renderApp();

  // Focus the edit input immediately
  const editInput = document.querySelector(`.task-edit-input[data-id="${id}"]`);
  if (editInput) {
    editInput.focus();
    // Position cursor at end of input
    const val = editInput.value;
    editInput.value = '';
    editInput.value = val;
  }
}

/**
 * Cancels active inline editing without saving changes.
 */
function cancelEditTask() {
  state.editingId = null;
  renderApp();
}

/**
 * Saves edited text for a specific task.
 * @param {string} id - Task identifier
 * @param {string} newText - Edited task text
 */
function saveEditTask(id, newText) {
  const trimmed = newText.trim();
  // If the user clears the input completely, cancel the edit to protect original text
  if (!trimmed) {
    cancelEditTask();
    return;
  }

  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.text = trimmed;
    saveTasksToStorage();
  }

  state.editingId = null;
  renderApp();
}

/**
 * Deletes a task from the list with a smooth exit animation.
 * @param {string} id - Task identifier
 */
function deleteTask(id) {
  const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);

  // Animate out before removing from state and DOM
  if (taskElement) {
    taskElement.classList.add('task-removing');
    taskElement.addEventListener('animationend', () => {
      state.tasks = state.tasks.filter(t => t.id !== id);
      if (state.editingId === id) {
        state.editingId = null;
      }
      saveTasksToStorage();
      renderApp();
    }, { once: true });
  } else {
    // Fallback if element not found in DOM
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasksToStorage();
    renderApp();
  }
}

/**
 * Sets current filter view ('all', 'pending', 'completed')
 * @param {string} filterName
 */
function setFilter(filterName) {
  if (['all', 'pending', 'completed'].includes(filterName)) {
    state.currentFilter = filterName;
    renderApp();
  }
}

/* ==========================================================================
   7. Rendering UI & Stats
   ========================================================================== */

/**
 * Updates the stat cards (Total, Pending, Completed).
 */
function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;

  DOM.totalCount.textContent = total;
  DOM.pendingCount.textContent = pending;
  DOM.completedCount.textContent = completed;
}

/**
 * Updates filter tabs active state and badge counter.
 * @param {number} countVisible - Number of tasks displayed under current filter
 */
function updateFilterTabs(countVisible) {
  DOM.filterButtons.forEach(btn => {
    const filter = btn.dataset.filter;
    const isActive = filter === state.currentFilter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const label = countVisible === 1 ? '1 item' : `${countVisible} items`;
  DOM.filteredCountText.textContent = label;
}

/**
 * Creates the HTML for a single task row.
 * Properly escapes task content to protect against XSS injection.
 * @param {Object} task - Task object
 * @returns {string} Task HTML string
 */
function createTaskItemHTML(task) {
  const isEditing = state.editingId === task.id;
  const safeText = escapeHTML(task.text);

  if (isEditing) {
    // Inline edit template
    return `
      <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <form class="task-edit-form" data-id="${task.id}">
          <input
            type="text"
            class="task-edit-input"
            data-id="${task.id}"
            value="${safeText}"
            maxlength="200"
            required
            aria-label="Edit task title"
          >
          <div class="task-actions">
            <button type="submit" class="action-btn save-btn" title="Save changes" aria-label="Save changes">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <button type="button" class="action-btn cancel-btn" data-action="cancel" title="Cancel edit" aria-label="Cancel edit">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </form>
      </li>
    `;
  }

  // Standard task item template
  return `
    <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-left">
        <button
          type="button"
          class="checkbox-btn ${task.completed ? 'checked' : ''}"
          data-action="toggle"
          data-id="${task.id}"
          role="checkbox"
          aria-checked="${task.completed}"
          aria-label="${task.completed ? 'Mark task as pending' : 'Mark task as completed'}"
          title="${task.completed ? 'Mark as pending' : 'Mark as complete'}"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <span class="task-text">${safeText}</span>
      </div>

      <div class="task-actions">
        <button
          type="button"
          class="action-btn edit-btn"
          data-action="edit"
          data-id="${task.id}"
          title="Edit task"
          aria-label="Edit task"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>

        <button
          type="button"
          class="action-btn delete-btn"
          data-action="delete"
          data-id="${task.id}"
          title="Delete task"
          aria-label="Delete task"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </li>
  `;
}

/**
 * Filters tasks according to the currently active filter.
 * @returns {Array} Filtered tasks
 */
function getFilteredTasks() {
  switch (state.currentFilter) {
    case 'pending':
      return state.tasks.filter(t => !t.completed);
    case 'completed':
      return state.tasks.filter(t => t.completed);
    case 'all':
    default:
      return state.tasks;
  }
}

/**
 * Main render function. Synchronizes DOM with current state.
 */
function renderApp() {
  updateStats();

  const filteredTasks = getFilteredTasks();
  updateFilterTabs(filteredTasks.length);

  // Handle empty state display
  if (filteredTasks.length === 0) {
    DOM.taskList.innerHTML = '';
    DOM.emptyState.classList.remove('hidden');

    if (state.currentFilter === 'pending') {
      DOM.emptyStateTitle.textContent = 'All caught up!';
      DOM.emptyStateMessage.textContent = 'You have no pending tasks right now. Great job!';
    } else if (state.currentFilter === 'completed') {
      DOM.emptyStateTitle.textContent = 'No completed tasks';
      DOM.emptyStateMessage.textContent = 'Tasks you complete will appear here.';
    } else {
      DOM.emptyStateTitle.textContent = 'No tasks yet';
      DOM.emptyStateMessage.textContent = 'Get started by creating your first task above.';
    }
  } else {
    DOM.emptyState.classList.add('hidden');
    DOM.taskList.innerHTML = filteredTasks.map(createTaskItemHTML).join('');
  }
}

/* ==========================================================================
   8. Event Listeners & Event Delegation
   ========================================================================== */

/**
 * Initializes all event handlers for the application.
 */
function setupEventListeners() {
  // 1. Task Creation Form Submit
  DOM.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(DOM.taskInput.value);
    DOM.taskInput.value = '';
    DOM.taskInput.focus();
  });

  // 2. Filter Buttons Click
  DOM.filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedFilter = button.dataset.filter;
      setFilter(selectedFilter);
    });
  });

  // 3. Theme Toggle Button Click
  DOM.themeToggleBtn.addEventListener('click', toggleTheme);

  // 4. Delegated Task Actions (Click) on Task List
  DOM.taskList.addEventListener('click', (e) => {
    // Check for button action
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    const taskId = actionBtn.dataset.id;

    if (action === 'toggle' && taskId) {
      toggleTaskStatus(taskId);
    } else if (action === 'edit' && taskId) {
      startEditTask(taskId);
    } else if (action === 'cancel') {
      cancelEditTask();
    } else if (action === 'delete' && taskId) {
      deleteTask(taskId);
    }
  });

  // 5. Delegated Form Submit for Inline Edit
  DOM.taskList.addEventListener('submit', (e) => {
    const editForm = e.target.closest('.task-edit-form');
    if (!editForm) return;

    e.preventDefault();
    const taskId = editForm.dataset.id;
    const input = editForm.querySelector('.task-edit-input');
    if (taskId && input) {
      saveEditTask(taskId, input.value);
    }
  });

  // 6. Inline Edit Keyboard Shortcuts (Escape to cancel)
  DOM.taskList.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('task-edit-input')) {
      if (e.key === 'Escape') {
        cancelEditTask();
      }
    }
  });
}

/* ==========================================================================
   9. Application Initialization
   ========================================================================== */

/**
 * Initializes theme, restores stored state, sets listeners, and renders.
 */
function init() {
  // Initialize Theme
  const savedTheme = loadThemePreference();
  applyTheme(savedTheme);

  // Initialize Tasks
  state.tasks = loadTasksFromStorage();

  // Set up all events
  setupEventListeners();

  // Render initial interface
  renderApp();
}

// Start application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
