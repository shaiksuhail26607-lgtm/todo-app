# TaskFlow — Modern Interactive To-Do List Application

An interactive, responsive, and accessible task management web application built with clean semantic HTML5, modern CSS3, and vanilla JavaScript (ES6+).

## 🚀 Live Overview & Architecture
TaskFlow separates your daily agenda into clear **Pending** and **Completed** lists, providing immediate visual feedback, inline editing, task metrics, and automatic browser persistence.

```
todo-app/
├── index.html        # Semantic HTML5 markup, ARIA roles, modern layout
├── css/
│   └── style.css     # CSS Custom Properties, Dark/Light mode, animations, responsive design
├── js/
│   ├── storage.js    # LocalStorage manager with fallback and schema defaults
│   └── app.js        # Core controller, inline edit handlers, metrics, rendering
└── README.md         # Comprehensive documentation
```

---

## 📋 Feature Checklist Verification

- [x] **1. Input field + "Add Task" button**:
  - Text input with placeholder, autofocus, priority selection (`🔥 High`, `Normal`, `🌱 Low`), and submission via `+ Add Task` button or Enter key.
  - Validation: Prevents empty or whitespace-only submissions with user feedback.
- [x] **2. Immediate display in Pending Tasks**:
  - Newly added items immediately prepend to the Pending Tasks list with smooth entrance animations.
- [x] **3. "Mark Complete" toggle**:
  - Custom styled checkbox toggles task status.
  - Completed items instantly transition to the Completed Tasks list with strike-through styling.
  - Unchecking an item moves it back to Pending.
- [x] **4. Inline Task Editing**:
  - Clicking the ✏️ Edit button replaces the task item text with an inline input and priority dropdown.
  - Includes **Save** (or Enter key) and **Cancel** (or Escape key) options without page jumps.
- [x] **5. Delete functionality**:
  - 🗑️ Delete button permanently removes the task with smooth exit animation.
  - Includes a 4-second **Undo Toast notification** to restore accidental deletions.
- [x] **6. Task Count Indicators**:
  - Dynamic badges: `"X pending"` and `"Y completed"` displayed directly in column headers.
  - Overview metrics card displaying Total tasks, Pending count, Completed count, and dynamic Progress % bar.
- [x] **7. Timestamps**:
  - Pending tasks display creation timestamp (e.g., `Added Today, 4:15 PM`).
  - Completed tasks show both completion time and creation time (e.g., `Completed Today, 4:20 PM • Added Today, 4:15 PM`).
- [x] **8. LocalStorage Persistence**:
  - Changes (add, complete, edit, delete, clear) are automatically saved to `localStorage`.
  - Tasks persist across page reloads and browser sessions with fail-safe error handling.
- [x] **9. Empty State Messaging**:
  - Pending list empty state: Friendly message (`🎉 All caught up! No pending tasks.`).
  - Completed list empty state: Encouraging message (`🎯 No completed tasks yet. Finish a task to see it here!`).

---

## 🌟 Extra Polish & UX Enhancements
- **Dark / Light Theme Toggle**: Seamless switch between light and dark themes with persistent preference storage.
- **Search & Filter**: Real-time task search filtering across both lists.
- **Clear All Completed**: Quick button to bulk clear finished tasks with confirmation.
- **Keyboard Navigation**: Full support for Tab navigation, Enter to submit/save, and Escape to cancel inline edits.
- **Mobile Responsive**: Adapts fluidly from small mobile screens to wide desktop monitors.

---

## 🛠️ How to Run
Simply open `index.html` in any modern web browser:
1. Double-click `index.html`, OR
2. Serve via a lightweight local server:
   ```bash
   npx serve .
   # or with Python
   python -m http.server 8000
   ```
