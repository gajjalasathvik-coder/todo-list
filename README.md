# FocusFlow - Modern To-Do List Web Application

A modern, responsive, and beginner-friendly To-Do List web application built entirely with HTML5, CSS3, and vanilla JavaScript. The application runs 100% in the browser with no backend, database, external frameworks, libraries, or build steps required.

---

## 🌐 Live Website Demo

Try the live application directly in your browser:
**https://gajjalasathvik-coder.github.io/todo-list/**

---

## ✨ Features

- **Add Tasks**: Quickly add tasks with keyboard support (press <kbd>Enter</kbd>).
- **Edit Tasks**: Inline task editing with instant save and <kbd>Esc</kbd> key cancellation.
- **Delete Tasks**: Remove tasks with a smooth exit animation.
- **Mark Status**: Toggle tasks between Pending and Completed with visual feedback.
- **Filter Views**: Easily filter between **All**, **Pending**, and **Completed** tasks, complete with contextual empty states.
- **Live Counter Cards**: Dashboard stat cards that automatically track Total, Pending, and Completed tasks in real-time.
- **Dark & Light Mode**: Seamless theme toggle that respects user preference and system settings, persisted across sessions.
- **Persistent Storage**: Uses browser `localStorage` to automatically save tasks and theme settings across page reloads.
- **Edge Case & Error Handling**:
  - Trims task input and ignores empty or whitespace-only submissions.
  - Safe HTML escaping to prevent XSS (Cross-Site Scripting) injections.
  - Graceful recovery if stored data is corrupted, malformed, or missing.
- **Fluid Design & Animations**: Subtle background ambient glows, card hover effects, clean transitions, and responsive mobile-first layout.

---

## 🚀 How to Run the App

**No installation, server, or dependencies required!**

1. Clone or download this repository to your computer.
2. Locate the `index.html` file in the project folder.
3. Double-click `index.html` (or drag and drop it into any modern web browser such as Chrome, Firefox, Safari, Edge, or Brave).

The app runs offline and works right out of the box.

---

## 📁 File Structure

The project strictly contains four well-organized files:

```text
to do list/
│
├── index.html     # Semantic HTML5 markup, dashboard structure, and accessibility tags
├── style.css      # CSS3 custom properties (variables), modern layouts, and animations
├── script.js      # Clean vanilla JavaScript for state management, localStorage, and DOM
└── README.md      # Comprehensive documentation and project guide
```

---

## 🛠️ Technology Stack

- **HTML5**: Semantic tags (`<header>`, `<main>`, `<section>`, `<footer>`), ARIA attributes, and accessible structure.
- **CSS3**: CSS Custom Properties (variables) for theme switching, CSS Grid & Flexbox, micro-animations, and responsive media queries.
- **Vanilla JavaScript (ES6+)**: Event delegation, `localStorage` API, array methods (`filter`, `map`, `find`), and input sanitization.

---

## 🔒 Security & Data Safety

- **Data Privacy**: All data is stored locally in your browser's `localStorage`. No data is ever transmitted over the network.
- **Input Sanitization**: User-entered strings are escaped before insertion into innerHTML, preventing script execution vulnerabilities.

---

## 📄 License

Open-source and free to use for personal or educational purposes. Ready for publication on GitHub and deployment to GitHub Pages, Netlify, or Vercel.
