# Interaction & Design System AI — Architecture Guide

## 1. Executive Overview
This document outlines the software architecture, modular directory structure, coding standards, and scalability conventions for the **Interaction & Design System AI Platform**.

This architecture is designed to support:
- Multi-page and multi-view extensions (e.g., Chat Tutor, Flow Canvas, Component Sandbox).
- A centralized, reusable Design System UI Kit (Figma Dark Theme Tokens).
- Modular Node.js / Express backend with MongoDB Atlas persistence.
- Zero external build-step overhead (Native ES Modules support in all modern browsers).

---

## 2. Core Architectural Principles

### 2.1 Zero-Emoji UI Policy
- **Strict Rule:** Emojis and sticker-style graphics are **never** used in UI components, notifications, tooltips, or text badges unless explicitly requested by the user.
- **Iconography Standard:** All iconography must use Google Material Symbols Outlined or custom SVG vectors adhering to the established design tokens.

### 2.2 Reusable Design System ("LEGO Blocks")
- UI primitives (Buttons, Modals, Drawers, Cards, Badges, Tabs) live in `src/design-system/components/`.
- Styling tokens (colors, spacing, radiuses, shadows, transitions) live in `src/design-system/tokens.css`.
- Any new screen, view, or feature imports these primitives rather than duplicating markup or CSS.

### 2.3 Feature-Sliced Modularity
- Each major domain capability (Chat Tutor, Hierarchy Builder, Quiz Engine) is encapsulated in its own directory under `src/features/`.
- Feature modules communicate through a shared state manager (`src/core/state.js`) or event bus (`src/core/events.js`).

---

## 3. Directory Layout

```text
AI_Trading_Chatbot_Sprint/
├── .env                                # Environment variables (MongoDB URI, API Keys - git-ignored)
├── .gitignore                          # Excludes node_modules, .env, OS artifacts
├── package.json                        # Node dependencies & project scripts
├── ARCHITECTURE.md                     # This documentation file
├── TECH_STACK_GUIDE_FOR_DESIGNERS.md   # Designer reference guide
│
├── server/                             # ─── BACKEND / SERVER LAYER ───
│   ├── server.js                       # Express application entry point & static server
│   ├── config/
│   │   └── db.js                       # MongoDB Atlas client & DNS resolution fallback
│   └── routes/
│       ├── sessions.routes.js          # /api/sessions (GET, POST, DELETE chat sessions)
│       ├── flows.routes.js             # /api/flows (GET, POST information architecture trees)
│       └── quizzes.routes.js           # /api/quizzes (POST quiz interaction history)
│
├── src/                                # ─── FRONTEND APPLICATION LAYER ───
│   ├── core/                           # Shared infrastructure
│   │   ├── state.js                    # Centralized reactive state store
│   │   ├── events.js                   # Pub/Sub event dispatcher
│   │   └── api/
│   │       ├── dbClient.js             # MongoDB REST API fetch wrappers
│   │       └── aiEngine.js             # AI provider routing (Built-in Heuristics, Gemini, Groq)
│   │
│   ├── design-system/                  # Design System UI Kit
│   │   ├── tokens.css                  # Color palette, elevation, typography tokens
│   │   ├── components/                 # Reusable UI component modules
│   │   │   ├── Button.js & .css        # Button variations (primary, secondary, icon)
│   │   │   ├── Modal.js & .css         # Accessible dialogs with backdrop handling
│   │   │   ├── Drawer.js & .css        # Sliding side sheets (Sidebar navigation)
│   │   │   └── Card.js & .css          # Glassmorphic containers
│   │   └── index.css                   # Consolidated design system bundle
│   │
│   ├── features/                       # Independent domain feature modules
│   │   ├── chat-tutor/                 # AI Chat stream, user bubbles & BTS cards
│   │   │   ├── chatView.js
│   │   │   └── reasoningCard.js
│   │   │
│   │   ├── hierarchy-builder/          # Multi-level interactive node tree & scoring
│   │   │   ├── treeCanvas.js
│   │   │   └── iaScorer.js
│   │   │
│   │   └── quiz-engine/                # Heuristic MCQs & validation
│   │       ├── mcqCard.js
│   │       └── quizData.js
│   │
│   └── pages/                          # Screen views and page shells
│       ├── tutor-page/                 # Main interactive tutor view
│       │   └── tutorPage.js
│       ├── flow-canvas-page/           # (Future) Dedicated full-screen IA canvas
│       └── design-lab-page/            # (Future) Live token & animation playground
│
├── index.html                          # Master application shell
├── styles.css                          # Layout & view-specific styling
└── app.js                              # Client initialization & runtime bootstrap
```

---

## 4. Design System Tokens Specification

Tokens are defined in `src/design-system/tokens.css` via CSS Custom Properties:

```css
:root {
  /* Surfaces & Backgrounds */
  --bg-primary: #0a0a0a;
  --bg-topbar: #181818;
  --bg-card: #0e0e0e;
  --bg-card-glass: rgba(18, 18, 18, 0.85);
  --bg-input: #0e0e0e;

  /* Borders & Dividers */
  --border-subtle: #2f2f2f;
  --border-card: #282828;

  /* Typography */
  --text-primary: #e3e3e3;
  --text-secondary: #a2a2a2;
  --text-muted: #707070;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Brand Accents */
  --accent-green: #4caf50;
  --accent-green-light: #81c784;
  --accent-green-glow: rgba(76, 175, 80, 0.15);
  --accent-red: #ef5350;

  /* Geometry */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 9999px;
}
```

---

## 5. Adding New Features & Pages

### 5.1 Creating a New Feature
1. Create a directory: `src/features/<feature-name>/`.
2. Encapsulate markup rendering, local logic, and event listeners within the feature module.
3. Import shared primitives from `src/design-system/` or `src/core/`.
4. Register the feature with the main bootstrap in `src/pages/` or `app.js`.

### 5.2 Creating a New Page / Screen
1. Create a directory: `src/pages/<page-name>/`.
2. Define the page view container inside `index.html` or dynamically mount it via JavaScript.
3. Use `src/core/state.js` to preserve active context across page transitions.

---

## 6. Git & Branching Strategy

| Branch Name Convention | Usage |
| :--- | :--- |
| `main` | Production-ready, fully tested, stable branch. |
| `feature/<name>` | Developing a new user-facing capability or widget. |
| `refactor/<name>` | Code cleanup, modularization, performance optimization. |
| `fix/<name>` | Targeted bug fix or security patch. |

### Standard Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/component-sandbox

# 2. Commit modular changes
git add .
git commit -m "Implement interactive component preview sandbox"

# 3. Push and merge
git checkout main
git merge feature/component-sandbox
git push origin main
```
