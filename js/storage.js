/**
 * Storage Service - TaskFlow
 * Encapsulates localStorage interactions, error handling, and default seed data.
 */

const TaskStorage = (() => {
  const TASKS_KEY = 'taskflow_todos_v1';
  const THEME_KEY = 'taskflow_theme_pref';

  // Starter sample tasks for first-time visitors
  const DEFAULT_TASKS = [
    {
      id: 'demo-1',
      text: 'Explore TaskFlow: Try adding, editing, or completing tasks',
      completed: false,
      priority: 'high',
      createdAt: Date.now() - 3600000 * 2, // 2 hours ago
      completedAt: null
    },
    {
      id: 'demo-2',
      text: 'Review documentation and project checklist',
      completed: false,
      priority: 'normal',
      createdAt: Date.now() - 3600000, // 1 hour ago
      completedAt: null
    },
    {
      id: 'demo-3',
      text: 'Set up project environment and install dependencies',
      completed: true,
      priority: 'low',
      createdAt: Date.now() - 3600000 * 5, // 5 hours ago
      completedAt: Date.now() - 3600000 * 4 // 4 hours ago
    }
  ];

  /**
   * Safe check for localStorage availability
   */
  function isStorageAvailable() {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('LocalStorage is not available in this environment. Falling back to memory storage.', e);
      return false;
    }
  }

  const storageAvailable = isStorageAvailable();
  let memoryTasks = null;
  let memoryTheme = 'light';

  return {
    /**
     * Retrieve all tasks
     * @returns {Array} List of task objects
     */
    getTasks() {
      if (!storageAvailable) {
        if (!memoryTasks) memoryTasks = [...DEFAULT_TASKS];
        return memoryTasks;
      }

      try {
        const data = localStorage.getItem(TASKS_KEY);
        if (!data) {
          // First visit: save and return default initial tasks
          this.saveTasks(DEFAULT_TASKS);
          return DEFAULT_TASKS;
        }
        return JSON.parse(data);
      } catch (err) {
        console.error('Failed to parse tasks from localStorage:', err);
        return DEFAULT_TASKS;
      }
    },

    /**
     * Persist tasks array
     * @param {Array} tasks 
     * @returns {boolean} Success status
     */
    saveTasks(tasks) {
      if (!storageAvailable) {
        memoryTasks = tasks;
        return true;
      }

      try {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        return true;
      } catch (err) {
        console.error('Failed to save tasks to localStorage:', err);
        return false;
      }
    },

    /**
     * Get saved theme ('light' | 'dark')
     */
    getTheme() {
      if (!storageAvailable) return memoryTheme;
      return localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    },

    /**
     * Save preferred theme
     * @param {string} theme 
     */
    saveTheme(theme) {
      if (!storageAvailable) {
        memoryTheme = theme;
        return;
      }
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (err) {
        console.warn('Could not save theme to localStorage:', err);
      }
    }
  };
})();
