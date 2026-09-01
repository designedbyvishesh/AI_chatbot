# Interaction & Design System AI — BTP Project Roadmap

> **Author:** Vishesh (Rahul)
> **University:** Bachelor's Thesis Project (BTP)
> **Last Updated:** September 2026
> **Repository:** `designedbyvishesh/AI_chatbot`

---

## Table of Contents

1. [Project Brief](#1-project-brief)
2. [Problem Statement & Motivation](#2-problem-statement--motivation)
3. [Research Requirements](#3-research-requirements)
4. [Design Prerequisites — What to Do Before Building](#4-design-prerequisites--what-to-do-before-building)
5. [Tech Stack — Detailed Breakdown](#5-tech-stack--detailed-breakdown)
6. [System Architecture](#6-system-architecture)
7. [Feature Roadmap & Phases](#7-feature-roadmap--phases)
8. [Current Project Status — What's Already Built](#8-current-project-status--whats-already-built)
9. [Deliverables & Evaluation Criteria](#9-deliverables--evaluation-criteria)
10. [Timeline & Milestones](#10-timeline--milestones)
11. [Future Scope & Vision](#11-future-scope--vision)
12. [References & Resources](#12-references--resources)

---

## 1. Project Brief

### 1.1 One-Liner
An **AI-powered interactive learning platform** that helps designers understand design system trends, practice interaction pattern decisions through MCQ-based quizzes, build information architectures visually, and receive real-time AI mentorship — all within a single, beautiful dark-themed interface.

### 1.2 Full Brief

The modern product design landscape evolves rapidly. New interaction patterns, component standards, animation philosophies, and AI-driven design tools emerge every quarter. Designers — especially those in early-to-mid career stages — struggle to stay current with *when* and *why* to use specific UI components (Modals vs. Drawers vs. Popovers), how cognitive science laws (Fitts's Law, Hick's Law, Miller's 7±2) impact layout decisions, and where AI is reshaping the design workflow.

**This platform solves that problem** by combining:

| Pillar | What It Does |
| :--- | :--- |
| **Trend Awareness** | Curated design system challenges and topic modules that keep designers updated on evolving patterns. |
| **AI Chat Tutor** | A conversational AI (powered by Google Gemini 2.0 Flash, Groq LPU, or a built-in heuristic engine) that answers design questions in depth, with UX heuristics citations and behind-the-scenes reasoning transparency. |
| **Interactive MCQ Quizzes** | Scenario-based multiple-choice questions testing when to use which component, with instant explanations grounded in NNGroup, Apple HIG, and Material Design 3 standards. |
| **Hierarchy Flow Builder** | A visual, chainable tree builder where users construct multi-level information architectures (Tab → Filter → Folder → File) and receive AI-powered cognitive load scoring. |
| **Whiteboarding Canvas** *(Future)* | A freeform collaborative drawing board for sketching user flows, wireframes, and design concepts in real-time. |

### 1.3 Target Audience

| Audience Segment | Context |
| :--- | :--- |
| **Design Students** (Primary) | B.Des / M.Des students learning interaction design fundamentals. |
| **Junior Product Designers** | Designers 0–3 years in industry who need to sharpen component selection decisions. |
| **Bootcamp Learners** | UI/UX bootcamp participants studying design system patterns. |
| **Design Educators** | Professors and mentors who can use MCQs and hierarchy challenges as teaching tools. |

### 1.4 Core Value Proposition

> **"Stop guessing which component to use. Practice, learn, and master interaction design decisions with AI-guided reasoning — not just answers, but the cognitive science behind them."**

---

## 2. Problem Statement & Motivation

### 2.1 The Problem

1. **Pattern Overload:** Designers encounter 50+ component types across Material Design 3, Apple HIG, Ant Design, Chakra UI, and Radix — but rarely understand the *decision boundaries* between them.
2. **No Interactive Practice Tool:** Existing platforms (NNGroup, Baymard, Laws of UX) provide static articles, not interactive practice environments.
3. **AI Literacy Gap:** Designers hear about "AI in design" but lack hands-on context for how AI can assist with component selection, hierarchy validation, and cognitive load evaluation.
4. **Fragmented Learning:** Trend awareness, quiz practice, hierarchy building, and AI Q&A currently live on separate platforms — forcing context-switching.

### 2.2 Motivation

- As a designer myself, I experienced firsthand the difficulty of deciding between Tabs vs. Segmented Controls, or understanding *when* a 4-level drill-down becomes a cognitive tunneling risk.
- This project consolidates trend tracking, AI mentorship, and interactive quizzing into a unified experience, using real-world technology (live AI APIs, cloud databases) — demonstrating that a designer can build a full-stack product from end to end.

---

## 3. Research Requirements

This section outlines the research domains you need to explore **before and during** the product design and development phases.

### 3.1 Academic / Theoretical Research

| Research Area | What to Study | Key Sources |
| :--- | :--- | :--- |
| **Cognitive Load Theory** | Miller's Law (7±2 chunks), Hick's Law (decision time vs. option count), Cognitive Tunneling in deep navigation. | George A. Miller (1956), Hick (1952), Sweller's Cognitive Load Theory |
| **Fitts's Law & Motor UX** | Target acquisition time as a function of distance and size — impacts button sizing, tap targets, and hover affordances. | Paul M. Fitts (1954), ISO 9241 |
| **Progressive Disclosure** | When and how to reveal complexity incrementally rather than all at once — applies directly to hierarchy builder depth. | Nielsen Norman Group articles |
| **Gestalt Principles in UI** | Proximity, similarity, closure, continuity — how they influence card layouts, grouping of quiz options, and sidebar hierarchy. | Wertheimer, Koffka, Köhler |
| **Modal vs. Non-Modal Interruption Theory** | Cognitive cost of context-switching when a modal blocks background content vs. a drawer preserving spatial reference. | Iqbal & Horvitz (2007) "Disruption and Recovery of Computing Tasks" |
| **Perceived Performance & Loading States** | How skeleton screens reduce perceived latency by up to 30% compared to spinners; the 100ms / 1s / 10s response-time model. | Jakob Nielsen (1993) "Usability Engineering", Google Web Vitals |

### 3.2 Design System & Industry Pattern Research

| Research Area | What to Study | Key Sources |
| :--- | :--- | :--- |
| **Material Design 3 Components** | Latest M3 component taxonomy — when to use each overlay, navigation, and selection component. | [m3.material.io](https://m3.material.io) |
| **Apple Human Interface Guidelines (HIG)** | iOS/macOS standards for Segmented Controls, Navigation Controllers, Sheets, and Popovers. | [developer.apple.com/design](https://developer.apple.com/design/human-interface-guidelines) |
| **Ant Design / Radix / Chakra Patterns** | Cross-framework comparison of component API patterns and when they diverge from M3/HIG. | Open-source documentation |
| **Motion & Animation Standards** | M3 Motion system (emphasized, standard, spring easing), 12 Principles of Animation adapted for UI. | Google Material Motion, Disney's 12 Principles |
| **Dark Theme & Accessibility** | WCAG 2.2 AA/AAA contrast ratios for dark surfaces, APCA perceptual contrast model, reduced motion preferences. | WCAG 2.2, APCA by Andrew Somers |
| **Design Token Architecture** | How tokens (color, spacing, typography, elevation) systematize a design system and enable theming. | Salesforce Lightning Design System, Figma Variables |

### 3.3 Technology & AI Research

| Research Area | What to Study | Key Sources |
| :--- | :--- | :--- |
| **Large Language Models (LLMs) for Design** | How models like Gemini, GPT-4, Claude, and Llama 3 can answer design questions with structured reasoning. | Google AI Studio, Groq Console |
| **Prompt Engineering for Design Context** | Crafting system prompts that make LLMs respond with UX heuristics, cognitive science references, and structured outputs (MCQs, critiques). | OpenAI Prompt Engineering Guide, Anthropic Prompt Library |
| **AI-Powered Evaluation Systems** | How to use AI to score user-built hierarchies against cognitive load metrics (depth, breadth, decision complexity). | Research papers on automated UX evaluation |
| **Retrieval-Augmented Generation (RAG)** | Feeding design system documentation into the AI so it cites specific guidelines rather than hallucinating. | LangChain / LlamaIndex documentation |
| **Streaming Token Generation** | Real-time token-by-token response rendering for a chat-like experience (SSE / WebSocket / fetch streaming). | MDN Server-Sent Events, Groq API docs |

### 3.4 Competitive & Market Research

| Competitor / Reference | What They Do Well | Gap This Project Fills |
| :--- | :--- | :--- |
| **Laws of UX** (lawsofux.com) | Beautiful presentation of cognitive laws. | Static — no practice quizzes or AI interaction. |
| **NNGroup** (nngroup.com) | Gold-standard UX research articles. | Long-form reading only — no interactive learning. |
| **Component Gallery** (component.gallery) | Visual catalog of real-world component implementations. | No "when to use which" decision engine. |
| **Figma Learn** | Official design tool tutorials. | Tool-specific, not cross-platform design system education. |
| **ChatGPT / Gemini** (raw) | General-purpose AI chat. | Not optimized for design context — no MCQs, no hierarchy builder, no heuristic reasoning transparency. |
| **Designercize** | Random design prompt generator. | No AI feedback, no structured learning path. |

---

## 4. Design Prerequisites — What to Do Before Building

This section defines everything you should prepare from a **design perspective** before writing any production code.

### 4.1 Design System Foundation (Figma)

Before building, create and finalize the following in Figma:

#### 4.1.1 Design Tokens
- [ ] **Color Palette:** Define all surface, text, border, and accent colors as Figma Variables
  - Already established: `--bg-primary: #0a0a0a`, `--accent-green: #4caf50`, etc.
  - Extend with: semantic aliases (success, warning, error, info states)
- [ ] **Typography Scale:** Font families (Inter, DM Serif Text, JetBrains Mono) with all weight/size combinations
- [ ] **Spacing Scale:** 4px base grid system (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- [ ] **Elevation / Shadows:** Subtle and floating shadow levels for cards, modals, dropdowns
- [ ] **Border Radii:** sm (8px), md (12px), lg (16px), pill (9999px)
- [ ] **Animation Tokens:** Duration (150ms, 250ms, 400ms) and easing curves (decelerate, standard, emphasized)

#### 4.1.2 Component Library (Figma)
Design these reusable components with all states (default, hover, focus, active, disabled, loading):

| Component | States Required | Priority |
| :--- | :--- | :--- |
| **Button** (Primary, Secondary, Ghost, Icon) | Default, Hover, Focus, Active, Disabled, Loading | P0 |
| **Input / Textarea** | Empty, Focused, Filled, Error, Disabled | P0 |
| **Card** (Glassmorphic) | Default, Hover, Active/Selected | P0 |
| **Modal Dialog** | Open state with backdrop | P0 |
| **Drawer / Side Sheet** | Open/Closed with overlay | P0 |
| **Sidebar Navigation** | Collapsed/Expanded, Active item | P0 |
| **Topbar / Appbar** | Default, Scrolled, Chat mode | P0 |
| **MCQ Option Card** | Default, Selected, Correct, Incorrect | P0 |
| **Quiz Feedback Card** | Correct (green), Incorrect (red) | P0 |
| **Hierarchy Node** | Editable, Chained, Evaluating | P0 |
| **BTS Reasoning Step** | Loading, Complete, With sources | P0 |
| **Badge / Chip** | Default, Active, Muted | P1 |
| **Dropdown Menu** | Open/Closed with items | P1 |
| **Toggle Switch** | On/Off | P1 |
| **Skeleton Loader** | Shimmer animation | P1 |
| **Toast / Notification** | Info, Success, Error, Warning | P2 |
| **Progress Bar** | Determinate, Indeterminate | P2 |
| **Whiteboard Canvas** *(Future)* | Drawing, Selection, Pan, Zoom | P3 |

#### 4.1.3 Page/Screen Designs
Design complete high-fidelity screens for:

1. **Home / Dashboard View** — Task cards, greeting, suggestion chips, input bar
2. **AI Chat Thread View** — User bubbles, BTS reasoning card, AI response cards, MCQ widgets
3. **Hierarchy Builder Full View** — Node tree, evaluation critique, MongoDB sync
4. **Settings Modal** — AI provider selection (Built-in / Gemini / Groq) with API key inputs
5. **Sidebar** — Session history, design challenge modules, tabs
6. **Whiteboard Canvas** *(Future)* — Infinite canvas, toolbar, shape primitives

#### 4.1.4 Interaction & Micro-Animation Specification

Before coding, specify these animations in your design file:

| Interaction | Easing | Duration | Notes |
| :--- | :--- | :--- | :--- |
| Button press feedback | Emphasized decelerate | 150ms | Scale 0.96 → 1.0 |
| Sidebar open/close | cubic-bezier(0.2, 0, 0, 1) | 300ms | Translate-X from -100% |
| Modal open | Emphasized | 250ms | Scale 0.95 → 1.0, fade in backdrop |
| BTS step reveal | Ease-out | 200ms each | Staggered with 400ms gaps |
| MCQ option selection | Spring (overdamped) | 200ms | Border color transition |
| Quiz feedback expand | Ease-out | 250ms | Height from 0 → auto |
| Chip hover | Ease | 150ms | Subtle glow border |
| Chat scroll-to-bottom | Smooth (CSS scroll-behavior) | Native | After every new message |

#### 4.1.5 Accessibility Audit Checklist

- [ ] All interactive elements have visible focus indicators (2px solid green outline)
- [ ] Color contrast meets WCAG 2.2 AA minimum (4.5:1 for body text, 3:1 for large text)
- [ ] Dark theme green accent (#4CAF50) on dark surfaces (#0A0A0A) passes APCA Lc 60+
- [ ] All icon buttons have `aria-label` attributes
- [ ] Modals and drawers trap focus when open
- [ ] Keyboard navigation: Tab, Shift+Tab, Enter, Escape all work
- [ ] Reduced-motion media query respected for all animations
- [ ] Screen reader announces MCQ results (correct/incorrect)

### 4.2 Information Architecture (Before Building)

Map out the complete IA of the platform:

```
Interaction & Design System AI
├── Home / Dashboard
│   ├── Greeting & Tasks List
│   ├── Suggestion Chips
│   └── Input Bar
├── AI Chat Thread (dynamic view)
│   ├── User Message Bubble
│   ├── Behind-the-Scenes Reasoning Card
│   │   ├── Step 1: Intent Deconstruction
│   │   ├── Step 2: Heuristic Cross-Reference (Sources)
│   │   ├── Step 3: Cognitive Metrics Calculation
│   │   └── Step 4: Widget Synthesis
│   └── Response Widget (one of):
│       ├── MCQ Card (Modal vs Drawer, Tabs vs Segments, etc.)
│       ├── Hierarchy Builder (chained nodes + evaluate)
│       ├── Free-text AI Response (Gemini/Groq)
│       └── Comprehensive Design Quiz
├── Sidebar
│   ├── User Session History (MongoDB + localStorage)
│   ├── Curated Design Challenges
│   └── Starred/Favorited Sessions
├── Settings Modal
│   ├── Built-in UX Master Engine
│   ├── Google Gemini 2.0 Flash (API Key)
│   └── Groq LPU (API Key)
├── Dropdown Menu
│   ├── Duplicate Session
│   ├── AI Engine Settings
│   ├── Small Text Toggle
│   ├── Full Width Toggle
│   ├── Time Toggle
│   └── View Shortcuts
└── (Future) Whiteboard Canvas
    ├── Drawing Tools
    ├── Shape Primitives
    ├── Text & Sticky Notes
    └── Export / Share
```

### 4.3 User Flow Diagrams

Design these core user flows before development:

1. **First-Time User Flow:** Land → See greeting → Browse task cards → Click task → View BTS reasoning → Answer MCQ → Get feedback → Try next challenge
2. **Returning User Flow:** Land → Open sidebar → Resume previous session → Continue quiz chain
3. **AI Chat Flow:** Type question → View BTS steps → Read AI response → Follow-up question
4. **Hierarchy Builder Flow:** Click flow challenge → Build tree → Add child nodes → Evaluate → View cognitive load score → Save to MongoDB
5. **Settings Flow:** Open settings → Select AI provider → Enter API key → Save → Next prompt uses new provider

---

## 5. Tech Stack — Detailed Breakdown

### 5.1 Frontend

| Technology | What It Is | Why We Use It | Version |
| :--- | :--- | :--- | :--- |
| **HTML5** | Standard markup language for web content. Defines the semantic structure of every page — headers, sections, buttons, inputs, and ARIA-accessible landmarks. | Forms the skeleton of the entire app shell: topbar, sidebar, chat thread, input bar, modals. HTML5 semantic elements (`<header>`, `<main>`, `<aside>`, `<section>`) improve accessibility and SEO. | HTML Living Standard |
| **CSS3 (Vanilla)** | Cascading Style Sheets — the language that controls visual presentation: layout, colors, typography, animations, and responsive design. | We use vanilla CSS with **CSS Custom Properties** (variables) as our design token system. This gives us full control over the dark theme, glassmorphism effects, and micro-animations without the overhead of a CSS framework. We avoid TailwindCSS deliberately to maintain a clean, designer-friendly codebase. | CSS3 (Custom Properties, Grid, Flexbox, Animations) |
| **JavaScript (ES6+ / Vanilla)** | The programming language of the web browser. Handles all interactivity: event listeners, DOM manipulation, API calls, state management, and dynamic rendering. | All app logic — chat pipeline, quiz interactions, hierarchy builder, sidebar navigation, settings modal — is written in vanilla JS. We use no framework (no React, Vue, Angular) to keep complexity low and eliminate build-step overhead. ES Modules (`import/export`) enable modular architecture. | ES2020+ (Modules, async/await, template literals, destructuring) |
| **Google Fonts** | Free, CDN-hosted font service by Google providing high-quality typefaces. | We load three font families: **Inter** (primary sans-serif for body/UI), **DM Serif Text** (display serif for headings), and **JetBrains Mono** (monospace for code/metrics). Fonts are preconnected for minimal render-blocking. | Via `fonts.googleapis.com` CDN |
| **Google Material Symbols Outlined** | Google's latest icon font system with 2,500+ variable icons supporting adjustable weight, fill, grade, and optical size. | Every icon in the app (menu, add, quiz, animation, close, etc.) uses Material Symbols. This ensures consistent, scalable iconography without managing individual SVG files. Zero-emoji policy enforced. | Material Symbols Outlined (variable font) |
| **CSS Custom Properties (Design Tokens)** | CSS variables (`--variable-name`) defined on `:root` that act as a centralized theming system. | All colors, spacings, radii, shadows, and font families are tokenized in `src/design-system/tokens.css`. Any component references these tokens rather than hardcoding values, enabling theme-wide changes from a single file. | Native CSS (no preprocessor) |

### 5.2 Backend

| Technology | What It Is | Why We Use It | Version |
| :--- | :--- | :--- | :--- |
| **Node.js** | A JavaScript runtime that executes server-side code. Built on Chrome's V8 engine. | Allows us to use the same language (JavaScript) on both frontend and backend, simplifying the development workflow for a designer-developer. Handles API routing, database connections, and static file serving. | Node.js 18+ LTS |
| **Express.js** | A minimal, un-opinionated web framework for Node.js that provides HTTP routing, middleware, and static serving. | Powers our REST API endpoints (`/api/sessions`, `/api/flows`, `/api/quizzes`, `/api/db-status`). Express is lightweight, well-documented, and the most widely used Node.js framework — making it easy to learn and maintain. | Express 4.19.x |
| **dotenv** | A zero-dependency module that loads environment variables from a `.env` file into `process.env`. | Stores sensitive credentials (MongoDB connection URI, API keys) outside of source code. The `.env` file is git-ignored, preventing accidental exposure of secrets. | dotenv 16.4.x |
| **CORS (cors middleware)** | Cross-Origin Resource Sharing middleware for Express. | Allows the frontend (served from one origin) to make API calls to the backend without browser security blocking. Essential for local development and when frontend/backend are on different domains. | cors 2.8.x |

### 5.3 Database

| Technology | What It Is | Why We Use It | Details |
| :--- | :--- | :--- | :--- |
| **MongoDB Atlas** | A fully managed, cloud-hosted NoSQL document database by MongoDB Inc. Data is stored as BSON (Binary JSON) documents in collections. | Perfect for this project because: **(1)** Data models (chat sessions, hierarchy flows, quiz results) are naturally JSON-shaped, matching how we structure state in JavaScript. **(2)** Flexible schema means we can evolve the data structure without migrations. **(3)** The M0 free tier provides 512MB storage — more than enough for a BTP project. | MongoDB Atlas M0 (Free), `mongodb` driver 6.8.x |
| **MongoDB Node.js Driver** | The official MongoDB driver for Node.js — handles connection pooling, DNS seed resolution, CRUD operations, and aggregation pipelines. | Provides direct, low-level access to MongoDB without the overhead of an ORM like Mongoose. For a project of this scale, the native driver is simpler and teaches you raw database operations. | `mongodb` 6.8.0 |

**Database Collections:**

| Collection | Purpose | Example Document |
| :--- | :--- | :--- |
| `chat_sessions` | Stores user chat session metadata (title, prompt, model, timestamp). | `{ id, title, prompt, model, timestamp, serverTimestamp }` |
| `hierarchy_flows` | Stores user-built information architecture trees with cognitive load scores. | `{ nodes: [{level, name}], metrics: {maxDepth, cognitiveLoad, nodeCount, hicksLawStatus}, serverTimestamp }` |
| `quiz_interactions` | Tracks MCQ answers for learning analytics. | `{ quizId, isCorrect, answeredAt, serverTimestamp }` |

### 5.4 AI / LLM Providers

| Provider | What It Is | Why We Use It | Cost |
| :--- | :--- | :--- | :--- |
| **Built-in UX Master Engine** | A local, offline heuristic engine coded directly into `app.js`. It uses keyword detection to route prompts to predefined interactive widgets (MCQ cards, hierarchy builder). No external API calls. | Provides **instant, unlimited, zero-cost** responses. Always available even without internet. Contains 100+ hardcoded design system heuristics and 5+ interactive widget types. | **Free / Unlimited** |
| **Google Gemini 2.0 Flash** | Google's multimodal AI model accessed via the Generative Language API. Fast, high-quality text generation with a 1M token context window. | When users want deeper, free-form AI reasoning beyond the built-in heuristics. The system prompt is specialized for interaction design architecture, cognitive science, and component selection. | **Free tier:** 1,500 requests/day via Google AI Studio |
| **Groq Cloud (Llama 3.3 70B)** | Groq's ultra-fast LPU (Language Processing Unit) hardware running open-source models like Llama 3.3 70B. Token generation at 500+ tokens/second. | When users want near-instant streaming responses. Groq's speed makes the AI feel conversational rather than waiting 3–5 seconds for a response. | **Free tier:** Generous developer limits |

### 5.5 Deployment & Infrastructure

| Technology | What It Is | Why We Use It | Cost |
| :--- | :--- | :--- | :--- |
| **Cloudflare Pages** | A JAMstack deployment platform that connects to GitHub and auto-deploys on every push. Content is distributed across 330+ global edge locations. | One-click deployment from GitHub. Automatic HTTPS, global CDN (sub-50ms TTFB worldwide), and zero server management. Perfect for hosting the static frontend. | **100% Free** |
| **Cloudflare Workers** | Serverless JavaScript functions running on Cloudflare's edge network. Each request executes in the nearest data center. | Acts as a **secure API proxy** — hides AI API keys from the browser. The frontend sends prompts to the Worker, which adds the secret key and forwards to Gemini/Groq. Eliminates client-side key exposure risk. | **100% Free** (100K requests/day) |
| **GitHub** | Version control and remote repository hosting. | Source of truth for all code. Connects to Cloudflare Pages for CI/CD. Branch-based workflow (main, feature/*, fix/*). | **Free** |

### 5.6 Development Tooling

| Tool | Purpose |
| :--- | :--- |
| **VS Code / Antigravity IDE** | Primary code editor with AI pair-programming assistance. |
| **Node.js `--watch` mode** | Hot-reload development server (auto-restarts on file changes). |
| **Git** | Version control with meaningful commit messages and branch strategy. |
| **Chrome DevTools** | Debugging, network inspection, accessibility audit, performance profiling. |
| **MongoDB Atlas Web UI** | Visual inspection of stored documents, index management, and monitoring. |
| **Google AI Studio** | Generate Gemini API keys, test prompts, monitor usage. |
| **Groq Console** | Generate Groq API keys, monitor token throughput. |

---

## 6. System Architecture

### 6.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ index.   │  │ styles.   │  │ tokens.  │  │    app.js    │   │
│  │ html     │  │ css       │  │ css      │  │ (1350 lines) │   │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │             │               │            │
│       └──────────────┴─────────────┴───────────────┘            │
│                            │                                    │
│              ┌─────────────┴─────────────┐                      │
│              │   Modular Core Modules    │                      │
│              │  ┌─────────────────────┐  │                      │
│              │  │ src/core/state.js   │  │                      │
│              │  │ src/core/api/       │  │                      │
│              │  │   dbClient.js       │  │                      │
│              │  └─────────────────────┘  │                      │
│              └───────────────────────────┘                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP REST API Calls
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS EXPRESS SERVER                        │
│                                                                 │
│  server.js ──▶ Express App (Port 3000)                          │
│  │                                                              │
│  ├── GET    /api/db-status      → Health check                  │
│  ├── GET    /api/sessions       → List chat sessions            │
│  ├── POST   /api/sessions       → Save new session              │
│  ├── DELETE /api/sessions/:id   → Delete session                │
│  ├── GET    /api/flows          → List hierarchy flows           │
│  ├── POST   /api/flows          → Save hierarchy + metrics      │
│  └── POST   /api/quizzes        → Save quiz interaction         │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │ MongoDB Driver
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│               MONGODB ATLAS (Cloud, Free M0)                    │
│                                                                 │
│  Database: design_system_ai                                     │
│  ├── Collection: chat_sessions                                  │
│  ├── Collection: hierarchy_flows                                │
│  └── Collection: quiz_interactions                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

              ┌──────────────────────────────────┐
              │      EXTERNAL AI PROVIDERS       │
              │                                  │
              │  ┌─────────────────────────────┐  │
              │  │ Google Gemini 2.0 Flash API │  │
              │  │ (1,500 free requests/day)   │  │
              │  └─────────────────────────────┘  │
              │  ┌─────────────────────────────┐  │
              │  │ Groq Cloud (Llama 3.3 70B)  │  │
              │  │ (Free developer tier)       │  │
              │  └─────────────────────────────┘  │
              │  ┌─────────────────────────────┐  │
              │  │ Built-in UX Heuristic Engine│  │
              │  │ (Offline, unlimited, free)   │  │
              │  └─────────────────────────────┘  │
              └──────────────────────────────────┘
```

### 6.2 Data Flow for a Typical Interaction

```
1. User types "Quiz me on Modals vs Drawers"
   │
2. ├── app.js creates a new session object
   │   └── Saved to localStorage AND POST /api/sessions (MongoDB)
   │
3. ├── View switches from Home → Chat Thread
   │   └── User message bubble rendered
   │
4. ├── Behind-the-Scenes reasoning card appears
   │   ├── Step 1: Intent deconstruction (300ms)
   │   ├── Step 2: Heuristic cross-reference (900ms)
   │   ├── Step 3: Cognitive metrics calculation (1700ms)
   │   └── Step 4: Widget synthesis (2400ms)
   │
5. ├── AI Response Widget rendered (based on ai engine mode):
   │   ├── Built-in → renderModalVsDrawerMCQWidget()
   │   ├── Gemini  → callGeminiAPI() + free-text response
   │   └── Groq    → callGroqAPI() + free-text response
   │
6. ├── User selects MCQ answer
   │   ├── Instant visual feedback (correct green / incorrect red)
   │   ├── Explanation card revealed
   │   └── POST /api/quizzes (MongoDB) — saves quiz interaction
   │
7. └── User clicks "Next Design Challenge"
       └── Cycles to next topic in the challenge rotation
```

---

## 7. Feature Roadmap & Phases

### Phase 1: Foundation (COMPLETED)

> *Status: All items built and functional in the current codebase.*

- [x] **App Shell & Layout** — Topbar, sidebar, main content area, overlay system
- [x] **Dark Theme Design System** — CSS Custom Properties token system in `tokens.css`
- [x] **Home / Dashboard View** — Greeting, task cards, suggestion chips
- [x] **AI Chat Thread** — View switching, user bubbles, dynamic message feed
- [x] **Behind-the-Scenes Reasoning Card** — 4-step staggered reveal with progress counter
- [x] **Built-in UX Master Engine** — Keyword-based routing to 5+ interactive widgets
- [x] **MCQ Quiz Cards** — Modals vs Drawers, Tabs vs Segments, Animation Easing, Loading Indicators
- [x] **Hierarchy Flow Builder** — Chainable node tree with add/delete/evaluate
- [x] **Cognitive Load Scorer** — Miller's Law, Hick's Law, depth analysis
- [x] **Google Gemini 2.0 Flash Integration** — Live API with design-specialized system prompt
- [x] **Groq Cloud Integration** — Llama 3.3 70B with sub-second inference
- [x] **AI Provider Settings Modal** — Switch between Built-in, Gemini, Groq with API key storage
- [x] **MongoDB Atlas Persistence** — Chat sessions, hierarchy flows, quiz interactions saved to cloud
- [x] **Session History** — Sidebar with recent chats, delete, resume
- [x] **Curated Design Challenges** — Pre-built sidebar entries for key topics
- [x] **Dropdown Options Menu** — Small text, full width, time toggle, shortcuts
- [x] **Keyboard Accessibility** — Escape to close, Enter to send, Tab navigation
- [x] **Responsive Input Bar** — Dynamic mic/send/stop states, auto-resize textarea

---

### Phase 2: Enhanced Learning Experience (NEXT)

- [ ] **Expanded Quiz Bank** — 50+ scenario-based MCQs across 10+ design system topics
- [ ] **Quiz Score Tracking** — Persistent score dashboard showing mastery level per topic
- [ ] **Streak & Gamification** — Daily learning streaks, badges, topic completion percentages
- [ ] **Learning Progress Sidebar** — Visual progress bars per module (e.g., "Modals: 4/6 correct")
- [ ] **Adaptive Difficulty** — AI adjusts MCQ complexity based on user's historical performance
- [ ] **Bookmarked / Starred Explanations** — Save particularly useful AI explanations for reference
- [ ] **Improved Markdown Rendering** — Full CommonMark support for AI responses (lists, code blocks, tables)
- [ ] **Search Across Sessions** — Full-text search through past conversations and quiz history

---

### Phase 3: Whiteboarding Canvas (FUTURE)

- [ ] **Infinite Canvas** — Pan, zoom, scroll with mouse/trackpad/touch
- [ ] **Drawing Primitives** — Rectangles, circles, lines, arrows, freehand
- [ ] **Text & Sticky Notes** — Inline text editing on canvas
- [ ] **Component Stencils** — Drag-and-drop wireframe primitives (buttons, inputs, cards, navbars)
- [ ] **Connector Lines** — Auto-routing arrows between shapes (for user flow mapping)
- [ ] **Layer Management** — Z-index control, grouping, locking
- [ ] **Export** — PNG, SVG, PDF export of canvas content
- [ ] **AI-Assisted Layout** — Ask AI to critique or suggest improvements to canvas wireframes

---

### Phase 4: Collaboration & Community (FUTURE)

- [ ] **User Authentication** — Google/GitHub OAuth via Supabase or Cloudflare Access
- [ ] **User Profiles** — Learning history, achievement badges, preferred topics
- [ ] **Community Challenges** — Users publish design questions for others to solve
- [ ] **Leaderboard** — Ranked by quiz accuracy, streak length, challenges completed
- [ ] **Real-time Collaboration** — Multiple users on the same whiteboard canvas (WebSocket/Supabase Realtime)
- [ ] **Design System Gallery** — Users share their custom design token sets

---

### Phase 5: Advanced AI Features (FUTURE)

- [ ] **RAG-Powered Design Assistant** — Feed Material Design 3, Apple HIG, and NNGroup docs into a vector database for citation-accurate AI responses
- [ ] **Design Review AI** — Upload Figma screenshots and get AI-powered design critique
- [ ] **Component Code Generator** — AI generates HTML/CSS/React component code from text descriptions
- [ ] **Voice-Powered Interaction** — Web Speech API for voice-to-text prompts and text-to-speech AI responses
- [ ] **Cloudflare Workers AI** — On-edge LLM inference using Llama 3, DeepSeek, or Mistral without third-party API keys

---

## 8. Current Project Status — What's Already Built

### 8.1 File Inventory

| File / Directory | Purpose | Lines / Size |
| :--- | :--- | :--- |
| `index.html` | Master app shell with all view containers | 443 lines |
| `app.js` | Core engine — chat pipeline, quiz widgets, hierarchy builder, AI providers, sidebar, settings | 1,350 lines |
| `styles.css` | Full visual styling for all components and views | ~38 KB |
| `src/design-system/tokens.css` | CSS Custom Property design tokens | 45 lines |
| `src/core/state.js` | Centralized reactive state store (ES Module) | 30 lines |
| `src/core/api/dbClient.js` | MongoDB REST API fetch wrappers | ~50 lines |
| `server.js` | Express application entry point | 53 lines |
| `server/config/db.js` | MongoDB Atlas connection with DNS fallback | ~30 lines |
| `server/routes/sessions.routes.js` | Chat session CRUD endpoints | 53 lines |
| `server/routes/flows.routes.js` | Hierarchy flow save/retrieve endpoints | ~35 lines |
| `server/routes/quizzes.routes.js` | Quiz interaction logging endpoint | ~20 lines |
| `ARCHITECTURE.md` | Architecture documentation | 171 lines |
| `TECH_STACK_GUIDE_FOR_DESIGNERS.md` | Designer-friendly tech stack reference | 120 lines |

### 8.2 Feature Completion Matrix

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Dark theme UI with design tokens | Complete | Figma-accurate dark theme |
| Chat AI with 3 provider modes | Complete | Built-in + Gemini + Groq |
| 5 Interactive quiz widget types | Complete | Modals, Tabs, Animation, Indicators, Comprehensive |
| Hierarchy flow builder with chaining | Complete | Add/delete/evaluate nodes |
| Cognitive load scoring engine | Complete | Miller's Law, Hick's Law, depth analysis |
| MongoDB Atlas cloud persistence | Complete | Sessions, flows, quizzes |
| Session history with CRUD | Complete | Create, read, delete, resume |
| Settings modal with API key management | Complete | Secure localStorage storage |
| Behind-the-scenes reasoning transparency | Complete | 4-step staggered UI |
| Expanded quiz bank (50+ questions) | Not Started | Phase 2 |
| Score tracking & gamification | Not Started | Phase 2 |
| Whiteboarding canvas | Not Started | Phase 3 |
| User authentication | Not Started | Phase 4 |
| RAG-powered AI | Not Started | Phase 5 |

---

## 9. Deliverables & Evaluation Criteria

### 9.1 BTP Deliverables

| Deliverable | Format | Description |
| :--- | :--- | :--- |
| **Working Prototype** | Live web application | Deployed on Cloudflare Pages with all Phase 1 features functional |
| **Source Code** | GitHub repository | Clean, documented, modular codebase with meaningful commit history |
| **Design System (Figma)** | Figma file | Complete component library, design tokens, all screen designs |
| **Architecture Document** | Markdown (`ARCHITECTURE.md`) | Technical architecture, directory structure, coding standards |
| **Tech Stack Guide** | Markdown (`TECH_STACK_GUIDE_FOR_DESIGNERS.md`) | Designer-friendly explanation of every technology used |
| **Project Roadmap** | Markdown (`BTP_PROJECT_ROADMAP.md`) | This document — brief, research, design prerequisites, tech stack, phases |
| **BTP Report / Thesis** | PDF / Document | Academic write-up covering problem statement, literature review, methodology, implementation, results, and future scope |
| **Presentation Deck** | Slides | Visual walkthrough of the project for thesis defense |

### 9.2 Evaluation Criteria

| Criterion | Weight | What Evaluators Look For |
| :--- | :--- | :--- |
| **Problem Relevance** | 15% | Is the problem real and well-defined? Does the solution address a genuine gap? |
| **Design Quality** | 25% | Visual polish, design system consistency, interaction quality, accessibility. |
| **Technical Implementation** | 25% | Code quality, architecture, API integration, database design, error handling. |
| **AI Integration** | 15% | Effective use of LLMs, prompt engineering, multi-provider architecture. |
| **Research Depth** | 10% | Literature review quality, cognitive science grounding, competitive analysis. |
| **Innovation & Future Scope** | 10% | Creativity, whiteboard vision, community features, scalability thinking. |

---

## 10. Timeline & Milestones

> **Note:** Adjust this timeline based on your academic semester schedule.

| Phase | Duration | Milestone | Deliverable |
| :--- | :--- | :--- | :--- |
| **Research & Literature Review** | Weeks 1–3 | Complete all research areas from Section 3. Document findings. | Research notes, annotated bibliography |
| **Design System & Figma** | Weeks 2–4 | Design tokens, component library, all screen designs in Figma. | Figma file with complete design system |
| **Phase 1: Foundation** | Weeks 1–8 | Already completed. All core features functional. | Working prototype, source code |
| **Phase 2: Enhanced Learning** | Weeks 9–12 | Expanded quiz bank, score tracking, gamification, improved markdown rendering. | Updated prototype |
| **Documentation & Report** | Weeks 10–14 | Architecture doc, tech stack guide, roadmap, BTP thesis report. | All markdown docs + academic report |
| **Phase 3: Whiteboard** *(if time)* | Weeks 13–16 | Basic infinite canvas with drawing primitives. | Whiteboard feature demo |
| **Final Presentation** | Week 15–16 | Presentation deck, live demo, thesis defense. | Slides + live deployment |

---

## 11. Future Scope & Vision

### 11.1 Short-Term (Next Semester)
- **Expanded Content Library:** 100+ MCQs across typography, color theory, responsive design, accessibility, and design ethics.
- **Adaptive AI Tutor:** AI that remembers your weak areas and prioritizes questions on those topics.
- **Design System Component Sandbox:** Live preview of UI components with adjustable props (radius, color, elevation).

### 11.2 Medium-Term (6–12 Months)
- **Whiteboarding Canvas:** Full-featured drawing board with wireframe stencils, user flow mapping, and AI layout critique.
- **User Accounts & Profiles:** OAuth login, persistent learning history across devices.
- **Community Challenges:** Crowdsourced design questions with voting and discussion.

### 11.3 Long-Term Vision (1–2 Years)
- **Design System as a Service:** Users create, share, and remix custom design token sets.
- **AI Design Review:** Upload Figma files or screenshots for automated accessibility and usability audits.
- **Multi-Language Support:** Internationalized content for global design education.
- **Mobile App:** React Native or Flutter companion app for learning on the go.
- **Enterprise Version:** Team-based design system training with manager dashboards and analytics.

---

## 12. References & Resources

### Academic References
- Miller, G. A. (1956). *The Magical Number Seven, Plus or Minus Two.* Psychological Review.
- Hick, W. E. (1952). *On the Rate of Gain of Information.* Quarterly Journal of Experimental Psychology.
- Fitts, P. M. (1954). *The Information Capacity of the Human Motor System.* Journal of Experimental Psychology.
- Sweller, J. (1988). *Cognitive Load During Problem Solving.* Cognitive Science.
- Nielsen, J. (1993). *Usability Engineering.* Academic Press.
- Iqbal, S. T., & Horvitz, E. (2007). *Disruption and Recovery of Computing Tasks.* CHI '07.

### Design System Resources
- [Material Design 3](https://m3.material.io) — Google's component and motion system
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) — iOS/macOS design standards
- [Laws of UX](https://lawsofux.com) — Collection of UX laws with examples
- [Nielsen Norman Group](https://www.nngroup.com) — UX research and articles
- [Ant Design](https://ant.design) — Enterprise-grade component library
- [Radix Primitives](https://www.radix-ui.com) — Unstyled accessible components

### Technology Documentation
- [Node.js Documentation](https://nodejs.org/docs/latest-v18.x/api/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Groq API Documentation](https://console.groq.com/docs)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [MDN Web Docs](https://developer.mozilla.org) — HTML, CSS, JavaScript reference

### Design Tools
- [Figma](https://www.figma.com) — UI/UX design and prototyping
- [Google AI Studio](https://aistudio.google.com) — Gemini API key generation
- [Groq Console](https://console.groq.com) — Groq API key management
- [Huetone](https://huetone.ardov.me) — Accessible color palette generator
- [APCA Contrast Calculator](https://www.myndex.com/APCA/) — Perceptual contrast testing

---

> **This document is the single source of truth for the BTP project roadmap. Update it as the project evolves.**
