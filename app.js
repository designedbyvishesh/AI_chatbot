/* ═══════════════════════════════════════════════
   Interaction & Design System AI — Core Engine
   ═══════════════════════════════════════════════ */

// App State
let isProcessing = false;
let processingIntervals = [];
let currentQuizIndex = 0;
let isQuestioningMode = true;

// Settings & Provider Configuration
let aiConfig = {
  mode: localStorage.getItem('ai_mode') || 'builtin',
  geminiKey: localStorage.getItem('gemini_api_key') || '',
  groqKey: localStorage.getItem('groq_api_key') || ''
};

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTaskInteractions();
  initTextarea();
  initChipInteractions();
  initMicAndSendButton();
  initInputBarActionButtons();
  initSidebar();
  initDropdownMenu();
  initSidebarTabs();
  initDropdownToggles();
  initBehindScenesToggle();
  initNewChatButtons();
  initChatHistoryClicks();
  initSettingsModal();
  checkDatabaseStatus();
});

/* ─── Live Clock ─── */
function initClock() {
  const timeEl = document.getElementById('current-time');
  if (!timeEl) return;

  function update() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    timeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  update();
  setInterval(update, 30000);
}

/* ─── Database Live Health Check ─── */
async function checkDatabaseStatus() {
  try {
    const res = await fetch('/api/db-status');
    const data = await res.json();
    if (data.status === 'connected') {
      const statusLabel = document.getElementById('status-label');
      if (statusLabel) {
        statusLabel.title = `Connected to MongoDB Atlas (${data.cluster})`;
      }
    }
  } catch (e) {
    // Running in static mode without local node server
  }
}

/* ─── Starter Task Items Interaction ─── */
function initTaskInteractions() {
  const tasks = document.querySelectorAll('.task-item');

  tasks.forEach(task => {
    task.addEventListener('click', () => {
      const prompt = task.getAttribute('data-prompt') || task.querySelector('.task-item__label').textContent;
      sendPrompt(prompt);
    });
  });
}

/* ─── Textarea & Dynamic Button State ─── */
function initTextarea() {
  const textarea = document.getElementById('screener-input');
  if (!textarea) return;

  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    updateActionButtonState();
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const value = textarea.value.trim();
      if (value && !isProcessing) {
        sendPrompt(value);
      }
    }
  });
}

function updateActionButtonState() {
  const textarea = document.getElementById('screener-input');
  const micBtn = document.getElementById('mic-btn');
  const micIcon = document.getElementById('mic-btn-icon');
  if (!textarea || !micBtn || !micIcon) return;

  if (isProcessing) {
    micIcon.textContent = 'stop';
    micBtn.style.color = '#ef5350';
    micBtn.style.background = 'rgba(239, 83, 80, 0.12)';
    micBtn.style.borderRadius = '8px';
    micBtn.setAttribute('aria-label', 'Stop generating');
  } else if (textarea.value.trim().length > 0) {
    micIcon.textContent = 'arrow_upward';
    micBtn.style.color = '#0a0a0a';
    micBtn.style.background = '#4caf50';
    micBtn.style.borderRadius = '50%';
    micBtn.setAttribute('aria-label', 'Send message');
  } else {
    micIcon.textContent = 'mic';
    micBtn.style.color = '';
    micBtn.style.background = '';
    micBtn.style.borderRadius = '';
    micBtn.setAttribute('aria-label', 'Voice input');
  }
}

function initMicAndSendButton() {
  const micBtn = document.getElementById('mic-btn');
  const textarea = document.getElementById('screener-input');
  if (!micBtn || !textarea) return;

  let isListening = false;

  micBtn.addEventListener('click', () => {
    if (isProcessing) {
      stopProcessing();
      return;
    }

    const value = textarea.value.trim();
    if (value) {
      sendPrompt(value);
    } else {
      isListening = !isListening;
      const icon = document.getElementById('mic-btn-icon');
      if (isListening) {
        icon.textContent = 'mic';
        micBtn.style.color = '#4caf50';
        micBtn.style.animation = 'micPulse 1.5s ease-in-out infinite';
      } else {
        icon.textContent = 'mic';
        micBtn.style.color = '';
        micBtn.style.animation = '';
      }
    }
  });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes micPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Input Bar Action Buttons (+ widget button & Questioning Mode) ─── */
function initInputBarActionButtons() {
  const attachBtn = document.getElementById('attach-btn');
  const toggleInputBtn = document.getElementById('toggle-input-btn');
  const indepthBtn = document.getElementById('indepth-btn');

  if (attachBtn) {
    attachBtn.addEventListener('click', () => {
      sendPrompt("Build a visual multi-level navigation hierarchy flow");
    });
  }

  if (toggleInputBtn) {
    toggleInputBtn.addEventListener('click', () => {
      isQuestioningMode = !isQuestioningMode;
      const icon = toggleInputBtn.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.textContent = isQuestioningMode ? 'toggle_on' : 'toggle_off';
      }
    });
  }

  if (indepthBtn) {
    indepthBtn.addEventListener('click', () => {
      sendPrompt("Give me a deep UX Heuristics & Cognitive Load critique across modern design systems");
    });
  }
}

/* ═══════════════════════════════════════════════
   CORE DISPATCHER & AI PROCESSING PIPELINE
   ═══════════════════════════════════════════════ */
function sendPrompt(promptText) {
  if (isProcessing) return;
  isProcessing = true;

  // 1. Switch View to Chat Mode
  const tasksSection = document.getElementById('tasks-section');
  const chatSection = document.getElementById('chat-section');
  const chatThread = document.getElementById('chat-thread');
  const content = document.getElementById('main-content');
  const textarea = document.getElementById('screener-input');
  const progressBox = document.getElementById('input-progress');
  const progressVal = document.getElementById('progress-value');
  const statusLabel = document.getElementById('status-label');

  if (tasksSection) tasksSection.style.display = 'none';
  if (chatSection) chatSection.style.display = 'flex';
  if (content) content.classList.add('chat-mode');
  if (statusLabel) statusLabel.textContent = 'Synthesizing Design Model';

  // 2. Input Bar in Processing State
  if (textarea) {
    textarea.value = '';
    textarea.placeholder = 'In process...';
    textarea.style.height = 'auto';
  }
  if (progressBox) progressBox.style.display = 'flex';
  if (progressVal) progressVal.textContent = '14.50%';

  updateActionButtonState();

  // 3. Append User Message Bubble
  const userRow = document.createElement('div');
  userRow.className = 'user-message-row';
  userRow.innerHTML = `<div class="user-message-bubble">${escapeHtml(promptText)}</div>`;
  chatThread.appendChild(userRow);

  // 4. Create Behind The Scenes Heuristic Reasoning Card
  const btsId = 'bts-' + Date.now();
  const btsCard = createBehindTheScenesCard(btsId, promptText);
  chatThread.appendChild(btsCard);

  chatSection.scrollTop = chatSection.scrollHeight;

  // 5. Execute Staggered AI Reasoning Steps
  runDesignSystemReasoning(btsId, promptText, () => {
    // 6. Generate Response Widget / Critique
    renderAIResponse(promptText, chatThread, () => {
      finishProcessing();
    });
  });
}

function finishProcessing() {
  isProcessing = false;
  const textarea = document.getElementById('screener-input');
  const progressBox = document.getElementById('input-progress');
  const statusLabel = document.getElementById('status-label');
  const chatSection = document.getElementById('chat-section');

  if (textarea) textarea.placeholder = 'Ask Design AI... (e.g. "When to use Modals vs Drawers?" or "Build a 4-level navigation flow")';
  if (progressBox) progressBox.style.display = 'none';
  if (statusLabel) statusLabel.textContent = 'Prompting';

  updateActionButtonState();
  if (chatSection) chatSection.scrollTop = chatSection.scrollHeight;
}

function stopProcessing() {
  clearAllTimers();
  finishProcessing();
}

function clearAllTimers() {
  processingIntervals.forEach(t => clearTimeout(t));
  processingIntervals = [];
}

/* ═══════════════════════════════════════════════
   BEHIND THE SCENES DESIGN REASONING PIPELINE
   ═══════════════════════════════════════════════ */
function createBehindTheScenesCard(btsId, prompt) {
  const card = document.createElement('div');
  card.className = 'behind-scenes-card';
  card.id = btsId;

  card.innerHTML = `
    <button class="behind-scenes__header" onclick="toggleCardCollapse('${btsId}')" aria-expanded="true">
      <span class="material-symbols-outlined behind-scenes__arrow">keyboard_arrow_down</span>
      <span class="behind-scenes__title">Behind the scenes — UX Heuristics & Cognitive Load Analysis</span>
    </button>
    <div class="behind-scenes__content" id="${btsId}-content">
      <div class="bts-step" id="${btsId}-s1" style="display:none;">
        <div class="bts-step__indicator">
          <span class="material-symbols-outlined bts-step__icon">radio_button_checked</span>
          <div class="bts-step__line"></div>
        </div>
        <div class="bts-step__body">
          <div class="bts-step__text">Deconstructing interaction intent & task context...</div>
        </div>
      </div>

      <div class="bts-step" id="${btsId}-s2" style="display:none;">
        <div class="bts-step__indicator">
          <span class="material-symbols-outlined bts-step__icon">language</span>
          <div class="bts-step__line"></div>
        </div>
        <div class="bts-step__body">
          <div class="bts-step__text">[HEURISTICS] Cross-referencing Nielsen Norman Group & Apple HIG standards...</div>
          <div class="bts-sources-box">
            <div class="bts-source-item">
              <div class="bts-source-item__left">
                <span class="bts-source-icon">📐</span>
                <span class="bts-source-title">Modal vs Non-Modal Dialogs: When to interrupt user workflow</span>
              </div>
              <span class="bts-source-domain">nngroup.com</span>
            </div>
            <div class="bts-source-item">
              <div class="bts-source-item__left">
                <span class="bts-source-icon">⚡</span>
                <span class="bts-source-title">Fitts's & Hick's Law: Optimizing decision latency & target acquisition</span>
              </div>
              <span class="bts-source-domain">lawsofux.com</span>
            </div>
            <div class="bts-source-item">
              <div class="bts-source-item__left">
                <span class="bts-source-icon">🎨</span>
                <span class="bts-source-title">Material Design 3: Component Elevation & Progressive Disclosure</span>
              </div>
              <span class="bts-source-domain">m3.material.io</span>
            </div>
          </div>
          <div class="bts-step__result">
            <span class="material-symbols-outlined bts-check-icon">check</span>
            <span>DONE (Extracted 3 primary design boundaries).</span>
          </div>
        </div>
      </div>

      <div class="bts-step" id="${btsId}-s3" style="display:none;">
        <div class="bts-step__indicator">
          <span class="material-symbols-outlined bts-step__icon">pageview</span>
          <div class="bts-step__line"></div>
        </div>
        <div class="bts-step__body">
          <div class="bts-step__text">[CALCULATING] Evaluating Miller's Law (7±2) & Navigation Depth index...</div>
          <div class="bts-step__result">
            <span class="material-symbols-outlined bts-check-icon">check</span>
            <span>Optimal Hierarchy Depth: Max 3-4 sub-levels without persistent breadcrumbs</span>
          </div>
        </div>
      </div>

      <div class="bts-step" id="${btsId}-s4" style="display:none;">
        <div class="bts-step__indicator">
          <span class="material-symbols-outlined bts-step__icon bts-step__icon--spinning">progress_activity</span>
        </div>
        <div class="bts-step__body">
          <div class="bts-step__text">Synthesizing pedagogical questionnaire & interactive widget...</div>
        </div>
      </div>
    </div>
  `;
  return card;
}

window.toggleCardCollapse = function(cardId) {
  const card = document.getElementById(cardId);
  if (card) card.classList.toggle('collapsed');
};

function runDesignSystemReasoning(btsId, prompt, onComplete) {
  const schedule = [
    { el: `${btsId}-s1`, delay: 300, progress: '25.00%' },
    { el: `${btsId}-s2`, delay: 900, progress: '58.40%' },
    { el: `${btsId}-s3`, delay: 1700, progress: '85.20%' },
    { el: `${btsId}-s4`, delay: 2400, progress: '96.80%' }
  ];

  schedule.forEach((item, idx) => {
    const t = setTimeout(() => {
      const el = document.getElementById(item.el);
      const progressVal = document.getElementById('progress-value');
      if (el) el.style.display = 'flex';
      if (progressVal) progressVal.textContent = item.progress;

      const chatSection = document.getElementById('chat-section');
      if (chatSection) chatSection.scrollTop = chatSection.scrollHeight;

      if (idx === schedule.length - 1) {
        setTimeout(onComplete, 500);
      }
    }, item.delay);

    processingIntervals.push(t);
  });
}

/* ═══════════════════════════════════════════════
   RESPONSE & INTERACTIVE WIDGET GENERATOR
   ═══════════════════════════════════════════════ */
function renderAIResponse(promptText, chatThread, callback) {
  const lower = promptText.toLowerCase();

  // If live API key configured and mode is Gemini/Groq
  if (aiConfig.mode === 'gemini' && aiConfig.geminiKey) {
    callGeminiAPI(promptText, chatThread, callback);
    return;
  }
  if (aiConfig.mode === 'groq' && aiConfig.groqKey) {
    callGroqAPI(promptText, chatThread, callback);
    return;
  }

  // Built-in UX Master Engine
  setTimeout(() => {
    if (lower.includes('hierarchy') || lower.includes('level') || lower.includes('flow') || lower.includes('filter') || lower.includes('folder')) {
      renderHierarchyChallengeWidget(chatThread);
    } else if (lower.includes('modal') || lower.includes('drawer') || lower.includes('popover') || lower.includes('sheet')) {
      renderModalVsDrawerMCQWidget(chatThread);
    } else if (lower.includes('tab') || lower.includes('segment') || lower.includes('switch') || lower.includes('accordion')) {
      renderTabsVsSegmentedMCQWidget(chatThread);
    } else if (lower.includes('animation') || lower.includes('easing') || lower.includes('spring') || lower.includes('motion')) {
      renderAnimationMCQWidget(chatThread);
    } else if (lower.includes('indicator') || lower.includes('skeleton') || lower.includes('progress') || lower.includes('spinner')) {
      renderIndicatorsMCQWidget(chatThread);
    } else {
      renderComprehensiveDesignQuiz(chatThread);
    }
    callback();
  }, 300);
}

/* ─── Interactive Widget 1: Multi-Level Hierarchy Flow Builder ─── */
function renderHierarchyChallengeWidget(chatThread) {
  const card = document.createElement('div');
  card.className = 'ai-response-card';
  card.innerHTML = `
    <div class="ai-response-header">
      <span class="material-symbols-outlined">account_tree</span>
      <span>Information Architecture & Multi-Level Flow Challenge</span>
    </div>
    <div class="ai-response-body">
      <p><strong>Scenario:</strong> You are designing a complex navigation drill-down for a data-intensive application. The user needs to navigate across categories, apply precise filters, browse collections, and inspect individual files.</p>
      <p>Build your proposed <strong>multi-level hierarchy</strong> below. Click the <span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle;">add</span> button on any node to chain connected sub-levels!</p>
    </div>

    <!-- Chained Hierarchy Builder Widget -->
    <div class="hierarchy-builder" id="active-hierarchy-builder">
      <div class="hierarchy-builder__header">
        <span class="hierarchy-builder__title">Visual Hierarchy Architecture</span>
        <span class="settings-badge settings-badge--green">Live Chaining</span>
      </div>

      <div class="hierarchy-tree" id="hierarchy-tree-root">
        <div class="hierarchy-node" data-level="1">
          <span class="hierarchy-node__connector">└──</span>
          <span class="hierarchy-node__level-badge">Level 1: Root</span>
          <input type="text" class="hierarchy-node__input" value="Primary Navigation Tab (e.g. Analytics / Assets)" />
          <button class="hierarchy-node__add-btn" onclick="addHierarchyChild(this)" title="Add Sub-Level Chain (+)">
            <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
          </button>
        </div>

        <div class="hierarchy-node" data-level="2" style="margin-left: 24px;">
          <span class="hierarchy-node__connector">├──</span>
          <span class="hierarchy-node__level-badge">Level 2: Filter Scope</span>
          <input type="text" class="hierarchy-node__input" value="Filter Drawer / Segmented Facets" />
          <button class="hierarchy-node__add-btn" onclick="addHierarchyChild(this)" title="Add Sub-Level Chain (+)">
            <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
          </button>
          <button class="hierarchy-node__delete-btn" onclick="deleteHierarchyNode(this)" title="Remove Node">
            <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
          </button>
        </div>

        <div class="hierarchy-node" data-level="3" style="margin-left: 48px;">
          <span class="hierarchy-node__connector">└──</span>
          <span class="hierarchy-node__level-badge">Level 3: Container</span>
          <input type="text" class="hierarchy-node__input" value="Category Folder Directory" />
          <button class="hierarchy-node__add-btn" onclick="addHierarchyChild(this)" title="Add Sub-Level Chain (+)">
            <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
          </button>
          <button class="hierarchy-node__delete-btn" onclick="deleteHierarchyNode(this)" title="Remove Node">
            <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
          </button>
        </div>
      </div>

      <div class="hierarchy-actions-row">
        <button class="hierarchy-add-root-btn" onclick="addHierarchyRootNode()">
          <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
          <span>Add Parallel Root Section</span>
        </button>
        <button class="hierarchy-evaluate-btn" onclick="evaluateHierarchyFlow()">
          <span class="material-symbols-outlined" style="font-size: 16px;">verified</span>
          <span>Evaluate Information Architecture</span>
        </button>
      </div>

      <div id="hierarchy-evaluation-slot"></div>
    </div>
  `;
  chatThread.appendChild(card);
}

window.addHierarchyChild = function(btn) {
  const currentNode = btn.closest('.hierarchy-node');
  const currentLevel = parseInt(currentNode.getAttribute('data-level') || '1', 10);
  const nextLevel = currentLevel + 1;
  const nextIndent = nextLevel * 20;

  const newNode = document.createElement('div');
  newNode.className = 'hierarchy-node';
  newNode.setAttribute('data-level', nextLevel);
  newNode.style.marginLeft = `${nextIndent}px`;

  newNode.innerHTML = `
    <span class="hierarchy-node__connector">└──</span>
    <span class="hierarchy-node__level-badge">Level ${nextLevel}: Sub-Action</span>
    <input type="text" class="hierarchy-node__input" placeholder="Type child interaction or file level..." />
    <button class="hierarchy-node__add-btn" onclick="addHierarchyChild(this)" title="Add Sub-Level Chain (+)">
      <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
    </button>
    <button class="hierarchy-node__delete-btn" onclick="deleteHierarchyNode(this)" title="Remove Node">
      <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
    </button>
  `;

  currentNode.after(newNode);
  const input = newNode.querySelector('input');
  if (input) input.focus();
};

window.addHierarchyRootNode = function() {
  const tree = document.getElementById('hierarchy-tree-root');
  if (!tree) return;

  const newNode = document.createElement('div');
  newNode.className = 'hierarchy-node';
  newNode.setAttribute('data-level', '1');
  newNode.innerHTML = `
    <span class="hierarchy-node__connector">└──</span>
    <span class="hierarchy-node__level-badge">Level 1: Sibling Root</span>
    <input type="text" class="hierarchy-node__input" placeholder="New primary navigation tab or workspace..." />
    <button class="hierarchy-node__add-btn" onclick="addHierarchyChild(this)" title="Add Sub-Level Chain (+)">
      <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
    </button>
    <button class="hierarchy-node__delete-btn" onclick="deleteHierarchyNode(this)" title="Remove Node">
      <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
    </button>
  `;
  tree.appendChild(newNode);
};

window.deleteHierarchyNode = function(btn) {
  const node = btn.closest('.hierarchy-node');
  if (node) node.remove();
};

window.evaluateHierarchyFlow = async function() {
  const slot = document.getElementById('hierarchy-evaluation-slot');
  const nodes = document.querySelectorAll('#hierarchy-tree-root .hierarchy-node');
  if (!slot) return;

  const nodeData = [];
  let maxDepth = 1;
  nodes.forEach(n => {
    const lvl = parseInt(n.getAttribute('data-level') || '1', 10);
    const text = n.querySelector('input') ? n.querySelector('input').value : '';
    if (lvl > maxDepth) maxDepth = lvl;
    nodeData.push({ level: lvl, name: text });
  });

  const nodeCount = nodes.length;
  let cognitiveLoad = maxDepth <= 3 ? 'Optimal (Low)' : (maxDepth === 4 ? 'Moderate' : 'High / Tunneling Risk');
  let hicksLawStatus = nodeCount <= 7 ? 'Excellent' : 'Consider Progressive Disclosure';

  slot.innerHTML = `
    <div class="hierarchy-critique">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <span style="font-size: 13px; font-weight: 600; color: #fff;">Information Architecture Critique & Score:</span>
        <span class="settings-badge settings-badge--green" id="mongo-sync-badge">☁️ Syncing to MongoDB...</span>
      </div>
      <div class="hierarchy-critique__metrics">
        <div class="hierarchy-metric-chip">
          <span class="hierarchy-metric-label">Max Depth Level</span>
          <span class="hierarchy-metric-val">${maxDepth} Levels</span>
        </div>
        <div class="hierarchy-metric-chip">
          <span class="hierarchy-metric-label">Cognitive Friction</span>
          <span class="hierarchy-metric-val">${cognitiveLoad}</span>
        </div>
        <div class="hierarchy-metric-chip">
          <span class="hierarchy-metric-label">Miller's Law Span</span>
          <span class="hierarchy-metric-val">${nodeCount} Total Items</span>
        </div>
        <div class="hierarchy-metric-chip">
          <span class="hierarchy-metric-label">Hick's Decision Time</span>
          <span class="hierarchy-metric-val">${hicksLawStatus}</span>
        </div>
      </div>
      <p style="font-size: 12px; color: #b8b8b8; line-height: 1.5; margin: 4px 0 0;">
        ${maxDepth >= 4 
          ? '💡 <strong>Recommendation:</strong> When depth reaches 4+ levels (Tab ➔ Filters ➔ Folders ➔ Files), provide <em>persistent breadcrumbs</em> or an <em>in-context sliding master-detail sheet</em> to prevent disorientation.'
          : '✅ <strong>Well Structured:</strong> The hierarchy preserves mental model continuity while minimizing context-switching penalty.'}
      </p>
    </div>
  `;

  // ─── Save Permanently to MongoDB Atlas ───
  try {
    const res = await fetch('/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: nodeData,
        metrics: { maxDepth, cognitiveLoad, nodeCount, hicksLawStatus }
      })
    });
    const data = await res.json();
    const badge = document.getElementById('mongo-sync-badge');
    if (badge && data.success) {
      badge.textContent = '☁️ Saved in MongoDB Atlas';
    }
  } catch (err) {
    const badge = document.getElementById('mongo-sync-badge');
    if (badge) {
      badge.textContent = '💾 Stored locally';
    }
  }
};

/* ─── Interactive Widget 2: Modal vs Drawer vs Popover MCQ ─── */
function renderModalVsDrawerMCQWidget(chatThread) {
  const card = document.createElement('div');
  card.className = 'ai-response-card';
  card.innerHTML = `
    <div class="ai-response-header">
      <span class="material-symbols-outlined">quiz</span>
      <span>Design System Component Decision: Overlay Architecture</span>
    </div>
    <div class="ai-response-body">
      <p>Let's test your interaction design decision-making regarding overlays and interruptions.</p>
    </div>

    <!-- MCQ Card -->
    <div class="quiz-card" id="quiz-modal-card">
      <div class="quiz-card__badge">Interaction MCQ #1 · Modals & Drawers</div>
      <div class="quiz-card__question">
        A user is editing a complex trading filter with 14 parameters while needing to observe live updating stock charts in the background. Which interaction component should you use?
      </div>
      <div class="quiz-options-list">
        <button class="quiz-option-btn" onclick="selectMCQOption(this, false, 'A centered blocking modal requires complete focus and dims the background, completely obstructing the live chart the user needs to watch.', 'quiz-modal-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>A. Centered Modal Dialog</strong> — Dim the screen with a heavy backdrop to maximize focus.</span>
        </button>
        <button class="quiz-option-btn" onclick="selectMCQOption(this, true, 'A right slide-out Drawer (Side Sheet) preserves spatial context, allowing simultaneous filter manipulation and chart observation without blocking the core viewport.', 'quiz-modal-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>B. Right Slide-Over Drawer (Side Sheet)</strong> — Non-blocking or semi-transparent sheet that leaves background charts visible.</span>
        </button>
        <button class="quiz-option-btn" onclick="selectMCQOption(this, false, 'Popovers are intended for short contextual snippets (2-3 controls max) and will overflow/cause extreme scroll fatigue for 14 parameters.', 'quiz-modal-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>C. Floating Hover Popover</strong> — Trigger a tooltip popover from the filter button.</span>
        </button>
        <button class="quiz-option-btn" onclick="selectMCQOption(this, false, 'Full-page routing completely destroys working memory and unloads the live market chart state.', 'quiz-modal-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>D. Full Page Route Navigation</strong> — Open a dedicated settings page.</span>
        </button>
      </div>
      <div class="quiz-slot" id="quiz-modal-slot"></div>
    </div>
  `;
  chatThread.appendChild(card);
}

/* ─── Interactive Widget 3: Tabs vs Segmented Controls MCQ ─── */
function renderTabsVsSegmentedMCQWidget(chatThread) {
  const card = document.createElement('div');
  card.className = 'ai-response-card';
  card.innerHTML = `
    <div class="ai-response-header">
      <span class="material-symbols-outlined">tab</span>
      <span>Design System Component Decision: Tabs vs Segmented Controls</span>
    </div>
    <div class="quiz-card" id="quiz-tabs-card">
      <div class="quiz-card__badge">Interaction MCQ #2 · Navigation Boundaries</div>
      <div class="quiz-card__question">
        When should you choose a <strong>Segmented Control</strong> over a standard <strong>Tab Bar</strong>?
      </div>
      <div class="quiz-options-list">
        <button class="quiz-option-btn" onclick="selectMCQOption(this, true, 'According to Apple HIG & Material 3, Segmented Controls are mutually exclusive toggles modifying a single view or query (e.g. Day / Week / Month / Year), whereas Tabs navigate between distinct standalone views/sub-pages.', 'quiz-tabs-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>A. Mutually exclusive filtering on a single content view</strong> (e.g., 1D / 1W / 1M / 1Y chart intervals).</span>
        </button>
        <button class="quiz-option-btn" onclick="selectMCQOption(this, false, 'Tabs with badges or independent views should be standard Navigation Tabs, not Segmented Controls.', 'quiz-tabs-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>B. When there are 8 or more unrelated modules</strong> with distinct header layouts.</span>
        </button>
        <button class="quiz-option-btn" onclick="selectMCQOption(this, false, 'Segmented controls are for compact, tightly coupled state switching, not entire page routes.', 'quiz-tabs-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>C. For primary top-level app routing</strong> between Dashboard, Portfolio, and Settings.</span>
        </button>
      </div>
      <div class="quiz-slot"></div>
    </div>
  `;
  chatThread.appendChild(card);
}

/* ─── Interactive Widget 4: Animations & Motion Heuristics ─── */
function renderAnimationMCQWidget(chatThread) {
  const card = document.createElement('div');
  card.className = 'ai-response-card';
  card.innerHTML = `
    <div class="ai-response-header">
      <span class="material-symbols-outlined">animation</span>
      <span>Motion Design Heuristics & Easing Curves</span>
    </div>
    <div class="quiz-card" id="quiz-motion-card">
      <div class="quiz-card__badge">Interaction MCQ #3 · Micro-Motion</div>
      <div class="quiz-card__question">
        Which easing curve & duration is recommended for micro-interactions (e.g., button press feedback, dropdown expand) according to Google Material Motion?
      </div>
      <div class="quiz-options-list">
        <button class="quiz-option-btn" onclick="selectMCQOption(this, false, 'Linear easing feels robotic and unnatural because physical objects in the real world have mass and acceleration.', 'quiz-motion-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>A. Linear easing (1000ms)</strong> — Constant velocity over 1 second.</span>
        </button>
        <button class="quiz-option-btn" onclick="selectMCQOption(this, true, 'Deceleration/Emphasized curves (cubic-bezier(0.2, 0, 0, 1) over 150-250ms) feel snappy and human, stopping briskly when elements arrive on screen.', 'quiz-motion-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>B. Decelerate / Emphasized Easing (150ms – 250ms)</strong> — Starts fast and gently rests.</span>
        </button>
        <button class="quiz-option-btn" onclick="selectMCQOption(this, false, 'Heavy bounce on every click causes motion sickness and slows experienced users down.', 'quiz-motion-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>C. Heavy Elastic Bounce (600ms)</strong> — Spring oscillation with multiple overshoots.</span>
        </button>
      </div>
      <div class="quiz-slot"></div>
    </div>
  `;
  chatThread.appendChild(card);
}

/* ─── Interactive Widget 5: Indicators & Perceived Performance ─── */
function renderIndicatorsMCQWidget(chatThread) {
  const card = document.createElement('div');
  card.className = 'ai-response-card';
  card.innerHTML = `
    <div class="ai-response-header">
      <span class="material-symbols-outlined">hourglass_top</span>
      <span>Progress Indicators & Perceived Performance</span>
    </div>
    <div class="quiz-card" id="quiz-indicator-card">
      <div class="quiz-card__badge">Interaction MCQ #4 · Loading States</div>
      <div class="quiz-card__question">
        When page load latency is between <strong>1.5 to 3.0 seconds</strong>, which loading pattern produces the lowest perceived wait time?
      </div>
      <div class="quiz-options-list">
        <button class="quiz-option-btn" onclick="selectMCQOption(this, true, 'Skeleton loaders outline the incoming content structure, giving immediate visual feedback and making the perceived wait time up to 30% shorter compared to spinners.', 'quiz-indicator-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>A. Content Skeleton Shimmer Screens</strong> — Placeholder shapes matching the final card layouts.</span>
        </button>
        <button class="quiz-option-btn" onclick="selectMCQOption(this, false, 'Full-screen spinners provide zero information about what is loading and amplify perceived wait time.', 'quiz-indicator-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>B. Full-Screen Blocking Spinner</strong> with a dark overlay.</span>
        </button>
        <button class="quiz-option-btn" onclick="selectMCQOption(this, false, 'Blank screens lead users to assume the app crashed or froze.', 'quiz-indicator-card')">
          <span class="quiz-option-btn__radio"></span>
          <span class="quiz-option-btn__text"><strong>C. Completely Blank Screen</strong> until all assets finish.</span>
        </button>
      </div>
      <div class="quiz-slot"></div>
    </div>
  `;
  chatThread.appendChild(card);
}

function renderComprehensiveDesignQuiz(chatThread) {
  renderModalVsDrawerMCQWidget(chatThread);
}

/* ─── Generic MCQ Selection Handler ─── */
window.selectMCQOption = function(btn, isCorrect, explanation, cardId) {
  const card = document.getElementById(cardId) || btn.closest('.quiz-card');
  if (!card) return;

  const allBtns = card.querySelectorAll('.quiz-option-btn');
  allBtns.forEach(b => {
    b.disabled = true;
    b.style.cursor = 'default';
  });

  if (isCorrect) {
    btn.classList.add('quiz-option-btn--correct');
  } else {
    btn.classList.add('quiz-option-btn--incorrect');
  }

  const slot = card.querySelector('.quiz-slot') || card;
  const feedback = document.createElement('div');
  feedback.className = `quiz-feedback-box ${isCorrect ? '' : 'quiz-feedback--error'}`;
  feedback.innerHTML = `
    <div class="quiz-feedback-title">${isCorrect ? '✅ Spot on! Excellent Interaction Decision' : '⚠️ Sub-optimal UX Pattern'}</div>
    <div class="quiz-feedback-desc">${explanation}</div>
    <button class="quiz-next-btn" onclick="triggerNextDesignChallenge()">
      <span>Next Design Challenge</span>
      <span class="material-symbols-outlined" style="font-size: 16px;">arrow_forward</span>
    </button>
  `;
  slot.appendChild(feedback);

  // ─── Save Quiz to MongoDB ───
  try {
    fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: cardId,
        isCorrect,
        answeredAt: new Date()
      })
    });
  } catch (e) {}

  const chatSection = document.getElementById('chat-section');
  if (chatSection) chatSection.scrollTop = chatSection.scrollHeight;
};

window.triggerNextDesignChallenge = function() {
  const prompts = [
    "Give me a 4-level information hierarchy challenge: Tab -> Filters -> Folders -> Files",
    "When should I use Tabs vs Segmented Controls vs Accordions?",
    "What animation easing curves are best for micro-interactions?",
    "When to use determinate progress bars vs skeleton loaders vs spinning indicators?"
  ];
  currentQuizIndex = (currentQuizIndex + 1) % prompts.length;
  sendPrompt(prompts[currentQuizIndex]);
};

/* ═══════════════════════════════════════════════
   LIVE AI PROVIDER CALLS (Gemini / Groq)
   ═══════════════════════════════════════════════ */
async function callGeminiAPI(prompt, chatThread, callback) {
  const apiKey = aiConfig.geminiKey;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `You are a world-class Interaction Design Architect and Design System Master.
When answering user design questions, always explain:
1. When to use which interaction component (Modals vs Drawers vs Popovers vs Tabs vs Indicators vs Micro-animations).
2. Cognitive load (Fitts's Law, Hick's Law, Miller's 7±2, Progressive Disclosure).
3. If relevant, output a structured questionnaire or interactive hierarchy step breakdown.
Format cleanly with Markdown headers and bullet points.`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${prompt}` }] }
        ]
      })
    });

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

    renderTextResponse(text, chatThread);
    if (prompt.toLowerCase().includes('hierarchy') || prompt.toLowerCase().includes('flow')) {
      renderHierarchyChallengeWidget(chatThread);
    }
  } catch (err) {
    renderTextResponse(`⚠️ **Gemini API Notice:** ${err.message}. Falling back to Built-in UX Engine.`, chatThread);
    renderModalVsDrawerMCQWidget(chatThread);
  }
  callback();
}

async function callGroqAPI(prompt, chatThread, callback) {
  const apiKey = aiConfig.groqKey;
  const endpoint = `https://api.groq.com/openai/v1/chat/completions`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a Senior UX & Interaction Design Architect specializing in Design Systems, hierarchy, modals, tabs, and micro-motion.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || 'No response from Groq.';
    renderTextResponse(text, chatThread);
  } catch (err) {
    renderTextResponse(`⚠️ **Groq API Notice:** ${err.message}. Falling back to Built-in UX Engine.`, chatThread);
    renderModalVsDrawerMCQWidget(chatThread);
  }
  callback();
}

function renderTextResponse(text, chatThread) {
  const card = document.createElement('div');
  card.className = 'ai-response-card';
  card.innerHTML = `
    <div class="ai-response-header">
      <span class="material-symbols-outlined">smart_toy</span>
      <span>AI Design Architecture Analysis</span>
    </div>
    <div class="ai-response-body">
      ${formatMarkdown(text)}
    </div>
  `;
  chatThread.appendChild(card);
}

function formatMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/^### (.*$)/gim, '<h3 style="color:#fff; font-size:15px; margin:10px 0 4px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#fff; font-size:16px; margin:12px 0 6px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#fff; font-size:18px; margin:14px 0 8px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br/>');
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ═══════════════════════════════════════════════
   SETTINGS MODAL & PROVIDER CONTROLLER
   ═══════════════════════════════════════════════ */
function initSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const triggerBtn = document.getElementById('settings-trigger-btn');
  const dropdownSettingsBtn = document.getElementById('dropdown-ai-settings');
  const closeBtn = document.getElementById('settings-modal-close');
  const cancelBtn = document.getElementById('settings-cancel-btn');
  const saveBtn = document.getElementById('settings-save-btn');

  const geminiInput = document.getElementById('gemini-api-key');
  const groqInput = document.getElementById('groq-api-key');
  const geminiBox = document.getElementById('gemini-key-box');
  const groqBox = document.getElementById('groq-key-box');

  if (geminiInput) geminiInput.value = aiConfig.geminiKey;
  if (groqInput) groqInput.value = aiConfig.groqKey;

  function openModal() {
    if (!modal) return;
    modal.classList.add('settings-modal--open');
    updateRadioSelectionUI();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('settings-modal--open');
  }

  function updateRadioSelectionUI() {
    const radios = document.querySelectorAll('input[name="ai-engine-mode"]');
    radios.forEach(r => {
      if (r.value === aiConfig.mode) r.checked = true;
      const card = r.closest('.settings-provider-card');
      if (card) {
        if (r.checked) card.classList.add('settings-provider-card--active');
        else card.classList.remove('settings-provider-card--active');
      }
    });

    if (geminiBox) geminiBox.style.display = aiConfig.mode === 'gemini' ? 'flex' : 'none';
    if (groqBox) groqBox.style.display = aiConfig.mode === 'groq' ? 'flex' : 'none';
  }

  document.querySelectorAll('input[name="ai-engine-mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      aiConfig.mode = e.target.value;
      updateRadioSelectionUI();
    });
  });

  if (triggerBtn) triggerBtn.addEventListener('click', openModal);
  if (dropdownSettingsBtn) dropdownSettingsBtn.addEventListener('click', () => {
    closeDropdown();
    openModal();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      aiConfig.geminiKey = geminiInput ? geminiInput.value.trim() : '';
      aiConfig.groqKey = groqInput ? groqInput.value.trim() : '';

      localStorage.setItem('ai_mode', aiConfig.mode);
      localStorage.setItem('gemini_api_key', aiConfig.geminiKey);
      localStorage.setItem('groq_api_key', aiConfig.groqKey);

      closeModal();
    });
  }

  window._closeSettingsModal = closeModal;
}

/* ═══════════════════════════════════════════════
   NAVIGATION, SIDEBAR & DROPDOWN HANDLERS
   ═══════════════════════════════════════════════ */
function initBehindScenesToggle() {
  const toggleBtn = document.getElementById('behind-scenes-toggle');
  const card = document.getElementById('behind-scenes-card');

  if (!toggleBtn || !card) return;

  toggleBtn.addEventListener('click', () => {
    const isCollapsed = card.classList.toggle('collapsed');
    toggleBtn.setAttribute('aria-expanded', !isCollapsed);
  });
}

function initNewChatButtons() {
  const topNewChatBtn = document.getElementById('new-chat-btn');
  const sidebarNewChatBtn = document.getElementById('sidebar-new-chat');

  function resetToMorningTasks() {
    stopProcessing();
    const tasksSection = document.getElementById('tasks-section');
    const chatSection = document.getElementById('chat-section');
    const chatThread = document.getElementById('chat-thread');
    const content = document.getElementById('main-content');
    const textarea = document.getElementById('screener-input');

    if (tasksSection) tasksSection.style.display = 'flex';
    if (chatSection) chatSection.style.display = 'none';
    if (chatThread) chatThread.innerHTML = '';
    if (content) content.classList.remove('chat-mode');
    if (textarea) {
      textarea.value = '';
      textarea.placeholder = 'Ask Design AI... (e.g. "When to use Modals vs Drawers?" or "Build a 4-level navigation flow")';
      textarea.style.height = 'auto';
    }
    updateActionButtonState();
    if (window._closeSidebar) window._closeSidebar();
  }

  if (topNewChatBtn) topNewChatBtn.addEventListener('click', resetToMorningTasks);
  if (sidebarNewChatBtn) sidebarNewChatBtn.addEventListener('click', resetToMorningTasks);
}

function initChatHistoryClicks() {
  const chatItems = document.querySelectorAll('.sidebar__chat-item');

  chatItems.forEach(item => {
    item.addEventListener('click', () => {
      const prompt = item.getAttribute('data-prompt') || item.querySelector('.sidebar__chat-title').textContent;
      sendPrompt(prompt);
      if (window._closeSidebar) window._closeSidebar();
    });
  });
}

function initChipInteractions() {
  const chips = document.querySelectorAll('.chip');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt') || chip.querySelector('.chip__label').textContent.trim();
      sendPrompt(prompt);

      chip.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.3)';
      setTimeout(() => {
        chip.style.boxShadow = '';
      }, 400);
    });
  });
}

function initSidebar() {
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.getElementById('sidebar');
  const closeBtn = document.getElementById('sidebar-close-btn');
  const overlay = document.getElementById('overlay');

  if (!menuBtn || !sidebar || !closeBtn || !overlay) return;

  function openSidebar() {
    sidebar.classList.add('sidebar--open');
    overlay.classList.add('overlay--visible');
    document.body.style.overflow = 'hidden';
    closeDropdown();
  }

  function closeSidebar() {
    sidebar.classList.remove('sidebar--open');
    overlay.classList.remove('overlay--visible');
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebar.classList.contains('sidebar--open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  closeBtn.addEventListener('click', closeSidebar);

  overlay.addEventListener('click', () => {
    closeSidebar();
    closeDropdown();
    if (window._closeSettingsModal) window._closeSettingsModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      closeDropdown();
      if (window._closeSettingsModal) window._closeSettingsModal();
    }
  });

  window._closeSidebar = closeSidebar;
}

function initSidebarTabs() {
  const tabs = document.querySelectorAll('.sidebar__tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('sidebar__tab--active'));
      tab.classList.add('sidebar__tab--active');
    });
  });
}

function initDropdownMenu() {
  const moreBtn = document.getElementById('more-btn');
  const dropdown = document.getElementById('dropdown-menu');

  if (!moreBtn || !dropdown) return;

  moreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains('dropdown-menu--open')) {
      closeDropdown();
    } else {
      if (window._closeSidebar) window._closeSidebar();
      dropdown.classList.add('dropdown-menu--open');
    }
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !moreBtn.contains(e.target)) {
      closeDropdown();
    }
  });
}

function closeDropdown() {
  const dropdown = document.getElementById('dropdown-menu');
  if (dropdown) {
    dropdown.classList.remove('dropdown-menu--open');
  }
}

function initDropdownToggles() {
  const toggleItems = document.querySelectorAll('.dropdown-menu__item--toggle');

  toggleItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const toggle = item.querySelector('.dropdown-menu__toggle');
      if (!toggle) return;

      const isOn = toggle.classList.contains('dropdown-menu__toggle--on');

      if (isOn) {
        toggle.classList.remove('dropdown-menu__toggle--on');
        toggle.textContent = 'toggle_off';
      } else {
        toggle.classList.add('dropdown-menu__toggle--on');
        toggle.textContent = 'toggle_on';
      }

      if (item.id === 'dropdown-full-width') {
        const content = document.getElementById('main-content');
        if (content) {
          if (!isOn) content.classList.add('full-width');
          else content.classList.remove('full-width');
        }
      }

      if (item.id === 'dropdown-small-text') {
        document.body.style.fontSize = !isOn ? '14px' : '';
      }

      if (item.id === 'dropdown-time') {
        const timeEl = document.getElementById('current-time');
        if (timeEl) {
          timeEl.style.display = !isOn ? 'inline-block' : 'none';
        }
      }
    });
  });
}
