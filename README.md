# AI-Native Design System & Agile Whiteboard Canvas Platform

[![Repository](https://img.shields.io/badge/GitHub-AI__chatbot-181717?style=for-the-badge&logo=github)](https://github.com/designedbyvishesh/AI_chatbot)
[![Tech Stack](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/cloud/atlas)
[![AI Powered](https://img.shields.io/badge/AI-Groq--Engine-FF6C37?style=for-the-badge)](https://groq.com/)

> **Product Link**: Explore the full source code and latest updates on GitHub at [**AI_chatbot on GitHub**](https://github.com/designedbyvishesh/AI_chatbot).

An interactive, AI-native design education and whiteboard prototyping platform built to help product designers, UX architects, and design educators master cognitive design laws (Fitts's Law, Hick's Law, Miller's 7±2 Law), information architecture, component decisions (Modals vs. Drawers vs. Popovers), and Agile practice workflows.

---

## 🌟 Key Features

### 🎨 1. Agile Whiteboard & Infinite 2D Canvas (`agile.html`)
* **Figma-Style Infinite Canvas**: Pan, zoom (0.2x – 5.0x), trackpad gesture navigation, and interactive 2D grid background.
* **Shape Primitives**: Draw corner-anchored circles, rectangles, lines, freehand paths, and auto-expanding text nodes.
* **Marquee Drag Selection**: 
  * Move tool (`V` shortcut) drag selection marquee with exact `1.5px` `#009B1A` green border and translucent `rgba(0, 255, 43, 0.05)` green fill.
  * Multi-shape selection and group movement.
* **8-Handle Resizing System**: Interactive 8-control handle bounding box for precision corner and edge resizing with dynamic cursor feedback (`nwse-resize`, `nesw-resize`, `ns-resize`, `ew-resize`).
* **Auto-Expanding Text Nodes**: Text nodes initialized at 400px width, expanding up to 720px max before wrapping lines down, complete with double-click inline textarea editing.
* **Spatial AI Prompting**: Embeds AI chat prompt streams directly into the 2D infinite canvas synchronized with whiteboard elements.
* **Integrated Stepper Onboarding**: Stepper question sequence featuring synchronized progress bar fill animation (`0.45s cubic-bezier(0.16, 1, 0.3, 1)`).

### 🎙️ 2. Audio Recorder & Dual-Timer Component
* **Real-time Canvas Waveform**: Audio amplitude visualizer rendered on an HTML5 canvas.
* **Dual-Timer System**: Count-down timer with +10s / -10s extenders, overtime count-up indicator (`#56D364`), and low-profile idle display (`#ffffff69`) when inactive.
* **Recording Export**: Audio WebM recording export and session history persistence.

### 🤖 3. Conversational AI Design Tutor & Quiz Platform (`index.html`)
* **AI Design Tutor**: Server-side Groq LLM integration (`qwen-2.5-32b` / `llama3-70b-8192`) providing contextual UX critiques, hierarchy feedback, and design system guidance.
* **Interactive Quiz Engine**: Heuristic MCQs, cognitive science law challenges, and score evaluation.
* **Dynamic Sidebar Session History**: Persistent chat sessions stored in MongoDB Atlas with instant load, delete, and local storage fallback.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla JavaScript (ES6+ Native Modules), Vanilla CSS3 (CSS Custom Properties, Glassmorphism) |
| **Icons & Typography** | Google Fonts (Inter, JetBrains Mono), Google Material Symbols Outlined |
| **Backend API** | Node.js, Express.js, CORS, Dotenv |
| **Database** | MongoDB Atlas (Native MongoDB Node.js Driver) with LocalStorage fallback |
| **AI Integration** | Groq Server-side API with fallback heuristic reasoning engines |

---

## 📁 Repository Structure

```text
AI_chatbot/
├── index.html                  # Main AI Tutor & Quiz Engine application shell
├── agile.html                  # Agile Whiteboard Infinite 2D Canvas workspace
├── app.js                      # Main frontend logic for AI Tutor & Quiz Engine
├── agile-session.js            # Canvas rendering engine, marquee selection, & spatial AI
├── recording-timer.js          # Audio recorder widget & dual-timer component
├── styles.css                  # Master layout styles for AI Tutor & Quiz views
├── agile.css                   # Custom design system styles & whiteboard canvas CSS
├── recording-timer.css         # Styling for audio recorder & timer widget
├── tokens.css                  # Reusable design system tokens (colors, typography, radii)
│
├── server.js                   # Node.js / Express entry point & static file server
├── server/                     # Backend API routes & database config
│   ├── config/
│   │   └── db.js               # MongoDB Atlas connection setup
│   └── routes/
│       ├── sessions.routes.js  # /api/sessions endpoints
│       ├── agile-sessions.routes.js # /api/agile-sessions endpoints
│       ├── flows.routes.js     # /api/flows endpoints
│       ├── quizzes.routes.js   # /api/quizzes endpoints
│       └── chat.routes.js      # /api/chat Groq AI endpoints
│
├── ARCHITECTURE.md             # Detailed technical architecture guide
└── BTP_PROJECT_ROADMAP.md      # Phased project roadmap & education research
```

---

## 🚀 Quick Start Guide

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* [npm](https://www.npmjs.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/designedbyvishesh/AI_chatbot.git
cd AI_chatbot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string
GROQ_API_KEY=your_groq_api_key
```
*(Note: If MongoDB or Groq keys are omitted, the application automatically uses built-in LocalStorage fallback and heuristic AI responses).*

### 4. Run the Application
Start the server in development mode:
```bash
npm run dev
```
Or start in production mode:
```bash
npm start
```

### 5. Access the Views
* **AI Design Tutor & Quiz Hub**: Open [`http://localhost:3000`](http://localhost:3000)
* **Agile Whiteboard & 2D Canvas**: Open [`http://localhost:3000/agile.html`](http://localhost:3000/agile.html)

---

## 🔗 Product Link & Repository

Find the official project repository on GitHub:
👉 [**https://github.com/designedbyvishesh/AI_chatbot**](https://github.com/designedbyvishesh/AI_chatbot)

---

## 📜 License & Author

Created by **Vishesh Katiyar**. Developed for interactive design education and AI-assisted UX prototyping.
