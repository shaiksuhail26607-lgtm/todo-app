/**
 * TaskFlow - Interactive To-Do List Application
 * Core Application Controller & UI Renderer
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // Application State
  // --------------------------------------------------------------------------
  let tasks = TaskStorage.getTasks();
  let editingTaskId = null;
  let searchQuery = '';
  let recentlyDeleted = null;
  let toastTimer = null;

  // --------------------------------------------------------------------------
  // DOM Elements
  // --------------------------------------------------------------------------
  const todoForm = document.getElementById('todo-form');
  const taskInput = document.getElementById('task-input');
  const prioritySelect = document.getElementById('priority-select');
  const formErrorMsg = document.getElementById('form-error-msg');

  const pendingList = document.getElementById('pending-tasks-list');
  const completedList = document.getElementById('completed-tasks-list');
  const pendingCountBadge = document.getElementById('pending-count');
  const completedCountBadge = document.getElementById('completed-count');

  const pendingEmptyState = document.getElementById('pending-empty-state');
  const completedEmptyState = document.getElementById('completed-empty-state');

  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statCompleted = document.getElementById('stat-completed');
  const statPercentage = document.getElementById('stat-percentage');
  const progressBarFill = document.getElementById('progress-bar-fill');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');

  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const currentDateDisplay = document.getElementById('current-date-display');
  const toastContainer = document.getElementById('toast-container');

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  initTheme();
  initDateDisplay();
  renderApp();

  // --------------------------------------------------------------------------
  // Event Listeners
  // --------------------------------------------------------------------------
  // 1. Task Creation Form Submission
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAddTask();
  });

  // 2. Search & Filter Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    clearSearchBtn.style.display = searchQuery ? 'inline-block' : 'none';
    renderTaskLists();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderTaskLists();
    searchInput.focus();
  });

  // 3. Clear All Completed Tasks
  clearCompletedBtn.addEventListener('click', () => {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear.');
      return;
    }

    if (confirm(`Are you sure you want to clear all ${completedCount} completed tasks?`)) {
      tasks = tasks.filter(t => !t.completed);
      TaskStorage.saveTasks(tasks);
      renderApp();
      showToast(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}.`);
    }
  });

  // 4. Dark / Light Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    TaskStorage.saveTheme(newTheme);
  });

  // --------------------------------------------------------------------------
  // Core Task Operations (CRUD)
  // --------------------------------------------------------------------------

  /**
   * Add a new task from the form input
   */
  function handleAddTask() {
    const rawText = taskInput.value.trim();

    // Validation: prevent empty or whitespace-only tasks
    if (!rawText) {
      showFormError('Please enter a task description.');
      taskInput.focus();
      return;
    }

    clearFormError();

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      text: rawText,
      completed: false,
      priority: prioritySelect.value || 'normal',
      createdAt: Date.now(),
      completedAt: null
    };

    // New tasks appear immediately at the top of the pending list
    tasks.unshift(newTask);
    TaskStorage.saveTasks(tasks);

    // Reset form
    taskInput.value = '';
    prioritySelect.value = 'normal';
    taskInput.focus();

    renderApp();
    showToast('Task added successfully!');
  }

  /**
   * Toggle task completion status
   * @param {string} id 
   */
  function toggleTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;

    TaskStorage.saveTasks(tasks);
    renderApp();

    if (task.completed) {
      showToast('Task marked as completed! 🎉');
    } else {
      showToast('Task moved back to pending.');
    }
  }

  /**
   * Enter inline edit mode for a task
   * @param {string} id 
   */
  function startEditing(id) {
    editingTaskId = id;
    renderTaskLists();

    // Auto-focus the inline edit input
    setTimeout(() => {
      const editInput = document.getElementById(`edit-input-${id}`);
      if (editInput) {
        editInput.focus();
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);
      }
    }, 50);
  }

  /**
   * Save changes made in inline edit mode
   * @param {string} id 
   */
  function saveEditing(id) {
    const editInput = document.getElementById(`edit-input-${id}`);
    const editPriority = document.getElementById(`edit-priority-${id}`);

    if (!editInput) return;

    const newText = editInput.value.trim();
    if (!newText) {
      alert('Task description cannot be empty.');
      editInput.focus();
      return;
    }

    const task = tasks.find(t => t.id === id);
    if (task) {
      task.text = newText;
      if (editPriority) {
        task.priority = editPriority.value;
      }
      TaskStorage.saveTasks(tasks);
    }

    editingTaskId = null;
    renderApp();
    showToast('Task updated successfully.');
  }

  /**
   * Cancel inline edit mode
   */
  function cancelEditing() {
    editingTaskId = null;
    renderTaskLists();
  }

  /**
   * Permanently delete a task with Undo capability
   * @param {string} id 
   */
  function deleteTask(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const taskElement = document.getElementById(`task-item-${id}`);
    if (taskElement) {
      taskElement.classList.add('removing');
    }

    setTimeout(() => {
      const [deletedTask] = tasks.splice(taskIndex, 1);
      TaskStorage.saveTasks(tasks);
      renderApp();

      // Store in memory for Undo action
      recentlyDeleted = { task: deletedTask, index: taskIndex };
      showToast('Task deleted.', true);
    }, 200);
  }

  /**
   * Restore recently deleted task
   */
  function undoDelete() {
    if (!recentlyDeleted) return;

    const { task, index } = recentlyDeleted;
    tasks.splice(Math.min(index, tasks.length), 0, task);
    TaskStorage.saveTasks(tasks);
    recentlyDeleted = null;

    renderApp();
    showToast('Task restored! ↩️');
  }

  // --------------------------------------------------------------------------
  // Rendering & UI Updates
  // --------------------------------------------------------------------------

  /**
   * Primary app render: updates metrics and task lists
   */
  function renderApp() {
    updateMetrics();
    renderTaskLists();
  }

  /**
   * Calculate and render task metrics and progress bar
   */
  function updateMetrics() {
    const totalCount = tasks.length;
    const pendingCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    statTotal.textContent = totalCount;
    statPending.textContent = pendingCount;
    statCompleted.textContent = completedCount;
    statPercentage.textContent = `${percentage}%`;

    progressBarFill.style.width = `${percentage}%`;
    const progressContainer = progressBarFill.parentElement;
    if (progressContainer) {
      progressContainer.setAttribute('aria-valuenow', percentage);
    }

    // Task count indicators above each list
    pendingCountBadge.textContent = `${pendingCount} pending`;
    completedCountBadge.textContent = `${completedCount} completed`;
  }

  /**
   * Render both Pending and Completed task lists
   */
  function renderTaskLists() {
    // Filter tasks if search query is active
    let filteredTasks = tasks;
    if (searchQuery) {
      filteredTasks = tasks.filter(t => t.text.toLowerCase().includes(searchQuery));
    }

    const pendingTasks = filteredTasks.filter(t => !t.completed);
    const completedTasks = filteredTasks.filter(t => t.completed);

    // 1. Render Pending List
    pendingList.innerHTML = '';
    if (pendingTasks.length === 0) {
      pendingEmptyState.style.display = 'flex';
      if (searchQuery) {
        pendingEmptyState.querySelector('h3').textContent = 'No matching tasks';
        pendingEmptyState.querySelector('p').textContent = `No pending tasks match "${searchQuery}".`;
      } else {
        pendingEmptyState.querySelector('h3').textContent = 'All caught up!';
        pendingEmptyState.querySelector('p').textContent = 'You have no pending tasks right now. Relax or create a new task above.';
      }
    } else {
      pendingEmptyState.style.display = 'none';
      pendingTasks.forEach(task => {
        pendingList.appendChild(createTaskElement(task));
      });
    }

    // 2. Render Completed List
    completedList.innerHTML = '';
    if (completedTasks.length === 0) {
      completedEmptyState.style.display = 'flex';
      if (searchQuery) {
        completedEmptyState.querySelector('h3').textContent = 'No matching tasks';
        completedEmptyState.querySelector('p').textContent = `No completed tasks match "${searchQuery}".`;
      } else {
        completedEmptyState.querySelector('h3').textContent = 'No completed tasks yet';
        completedEmptyState.querySelector('p').textContent = 'Mark items complete as you finish them to track your daily progress.';
      }
    } else {
      completedEmptyState.style.display = 'none';
      completedTasks.forEach(task => {
        completedList.appendChild(createTaskElement(task));
      });
    }
  }

  /**
   * Build DOM element for an individual task item
   * @param {Object} task 
   * @returns {HTMLElement}
   */
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.id = `task-item-${task.id}`;

    const isEditing = editingTaskId === task.id;

    if (isEditing) {
      // ----------------------------------------------------------------------
      // INLINE EDIT MODE
      // ----------------------------------------------------------------------
      li.innerHTML = `
        <div class="edit-form-inline">
          <input 
            type="text" 
            id="edit-input-${task.id}" 
            class="edit-input" 
            value="${escapeHtml(task.text)}" 
            maxlength="200"
            aria-label="Edit task description"
          />
          <div class="edit-controls">
            <select id="edit-priority-${task.id}" class="edit-priority-select" title="Change priority">
              <option value="normal" ${task.priority === 'normal' ? 'selected' : ''}>Normal Priority</option>
              <option value="high" ${task.priority === 'high' ? 'selected' : ''}>🔥 High</option>
              <option value="low" ${task.priority === 'low' ? 'selected' : ''}>🌱 Low</option>
            </select>
            <button type="button" class="btn-mini btn-mini-save" id="btn-save-${task.id}">Save</button>
            <button type="button" class="btn-mini btn-mini-cancel" id="btn-cancel-${task.id}">Cancel</button>
          </div>
        </div>
      `;

      // Inline Edit Event Listeners
      const saveBtn = li.querySelector(`#btn-save-${task.id}`);
      const cancelBtn = li.querySelector(`#btn-cancel-${task.id}`);
      const inputEl = li.querySelector(`#edit-input-${task.id}`);

      saveBtn.addEventListener('click', () => saveEditing(task.id));
      cancelBtn.addEventListener('click', () => cancelEditing());

      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveEditing(task.id);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelEditing();
        }
      });

    } else {
      // ----------------------------------------------------------------------
      // REGULAR DISPLAY MODE
      // ----------------------------------------------------------------------
      const formattedCreatedDate = formatTimestamp(task.createdAt);
      const formattedCompletedDate = task.completedAt ? formatTimestamp(task.completedAt) : null;

      let timestampDisplay = `<span>Added ${formattedCreatedDate}</span>`;
      if (task.completed && formattedCompletedDate) {
        timestampDisplay = `<span>Completed ${formattedCompletedDate} • Added ${formattedCreatedDate}</span>`;
      }

      li.innerHTML = `
        <div class="task-toggle-wrapper">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            id="checkbox-${task.id}" 
            ${task.completed ? 'checked' : ''} 
            aria-label="Mark task '${escapeHtml(task.text)}' as ${task.completed ? 'pending' : 'complete'}"
          />
        </div>
        <div class="task-content">
          <div class="task-text ${task.completed ? 'task-completed-text' : ''}">
            ${escapeHtml(task.text)}
          </div>
          <div class="task-meta">
            <span class="priority-badge priority-${task.priority || 'normal'}">
              ${task.priority === 'high' ? '🔥 High' : task.priority === 'low' ? '🌱 Low' : 'Normal'}
            </span>
            <span class="task-timestamp">
              ${timestampDisplay}
            </span>
          </div>
        </div>
        <div class="task-actions">
          <button 
            type="button" 
            class="action-btn action-btn-edit" 
            title="Edit task text inline" 
            aria-label="Edit task"
            data-id="${task.id}"
          >
            ✏️
          </button>
          <button 
            type="button" 
            class="action-btn action-btn-delete" 
            title="Permanently delete task" 
            aria-label="Delete task"
            data-id="${task.id}"
          >
            🗑️
          </button>
        </div>
      `;

      // Checkbox Toggle Listener
      const checkbox = li.querySelector(`#checkbox-${task.id}`);
      checkbox.addEventListener('change', () => toggleTaskComplete(task.id));

      // Edit Button Listener
      const editBtn = li.querySelector('.action-btn-edit');
      editBtn.addEventListener('click', () => startEditing(task.id));

      // Delete Button Listener
      const deleteBtn = li.querySelector('.action-btn-delete');
      deleteBtn.addEventListener('click', () => deleteTask(task.id));
    }

    return li;
  }

  // --------------------------------------------------------------------------
  // Helper Utilities
  // --------------------------------------------------------------------------

  /**
   * Human-readable timestamp formatter
   * @param {number} timestamp 
   * @returns {string} e.g. "Today, 4:15 PM" or "Sep 27, 4:15 PM"
   */
  function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  }

  /**
   * Escape HTML to prevent XSS in task titles
   * @param {string} str 
   * @returns {string}
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Form validation error display
   * @param {string} msg 
   */
  function showFormError(msg) {
    formErrorMsg.textContent = msg;
    formErrorMsg.style.display = 'block';
    taskInput.classList.add('input-error');
  }

  function clearFormError() {
    formErrorMsg.textContent = '';
    formErrorMsg.style.display = 'none';
    taskInput.classList.remove('input-error');
  }

  /**
   * Show feedback toast with optional Undo action
   * @param {string} message 
   * @param {boolean} showUndo 
   */
  function showToast(message, showUndo = false) {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastContainer.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
      ${showUndo ? '<button type="button" class="toast-btn-undo" id="toast-undo-btn">Undo</button>' : ''}
    `;

    toastContainer.appendChild(toast);

    if (showUndo) {
      const undoBtn = toast.querySelector('#toast-undo-btn');
      undoBtn.addEventListener('click', () => {
        undoDelete();
        toast.remove();
      });
    }

    toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 4000);
  }

  /**
   * Initialize Date header
   */
  function initDateDisplay() {
    const today = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    currentDateDisplay.textContent = today.toLocaleDateString('en-US', options);
  }

  /**
   * Theme configuration
   */
  function initTheme() {
    const savedTheme = TaskStorage.getTheme();
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
});
