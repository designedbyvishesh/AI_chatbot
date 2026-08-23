/* ═══════════════════════════════════════════════
   Equity Trading Chat — App Logic
   ═══════════════════════════════════════════════ */

let isProcessing = false;
let processingIntervals = [];

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTaskInteractions();
  initTextarea();
  initChipInteractions();
  initMicAndSendButton();
  initSidebar();
  initDropdownMenu();
  initSidebarTabs();
  initDropdownToggles();
  initBehindScenesToggle();
  initNewChatButtons();
  initChatHistoryClicks();
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

/* ─── Task Toggle ─── */
function initTaskInteractions() {
  const tasks = document.querySelectorAll('.task-item');

  tasks.forEach(task => {
    task.addEventListener('click', () => {
      const checkbox = task.querySelector('.task-item__checkbox');
      const isDone = checkbox.classList.contains('task-item__checkbox--done');

      if (isDone) {
        checkbox.classList.remove('task-item__checkbox--done');
        task.classList.remove('task-item--completed');
        checkbox.innerHTML = '';
      } else {
        checkbox.classList.add('task-item__checkbox--done');
        task.classList.add('task-item--completed');
        checkbox.innerHTML = '<span class="material-symbols-outlined">check</span>';

        task.style.background = 'rgba(76, 175, 80, 0.06)';
        setTimeout(() => {
          task.style.background = '';
        }, 400);
      }
    });
  });
}

/* ─── Textarea & Mic <-> Send <-> Stop Button ─── */
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
      // Voice toggle
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

/* ─── Send Prompt & Trigger AI Analyzing (Page 2 Flow) ─── */
function sendPrompt(promptText) {
  isProcessing = true;

  // 1. Switch Views: Hide tasks section, show chat section
  const tasksSection = document.getElementById('tasks-section');
  const chatSection = document.getElementById('chat-section');
  const content = document.getElementById('main-content');
  const userMsgText = document.getElementById('user-message-text');
  const textarea = document.getElementById('screener-input');
  const progressBox = document.getElementById('input-progress');
  const progressVal = document.getElementById('progress-value');
  const statusLabel = document.getElementById('status-label');

  if (tasksSection) tasksSection.style.display = 'none';
  if (chatSection) chatSection.style.display = 'flex';
  if (content) content.classList.add('chat-mode');
  if (userMsgText) userMsgText.textContent = promptText;
  if (statusLabel) statusLabel.textContent = 'Analyzing';

  // 2. Input Bar in Processing State
  if (textarea) {
    textarea.value = '';
    textarea.placeholder = 'In process...';
    textarea.style.height = 'auto';
  }
  if (progressBox) progressBox.style.display = 'flex';
  if (progressVal) progressVal.textContent = '12.40%';

  updateActionButtonState();

  // 3. Reset behind-the-scenes steps & start progressive execution
  runBehindTheScenesAnimation();
}

function runBehindTheScenesAnimation() {
  clearAllTimers();

  const steps = [
    { id: 'bts-step-1', delay: 400, progress: '18.25%' },
    { id: 'bts-step-2', delay: 1200, progress: '32.10%' },
    { id: 'bts-step-3', delay: 2200, progress: '52.75%' },
    { id: 'bts-step-4', delay: 3800, progress: '64.30%' },
    { id: 'bts-step-5', delay: 4900, progress: '75.56%' },
    { id: 'bts-step-6', delay: 6000, progress: '84.20%' },
    { id: 'bts-step-7', delay: 7100, progress: '91.80%' },
    { id: 'bts-step-8', delay: 8200, progress: '96.50%' }
  ];

  // Initially hide all steps
  for (let i = 1; i <= 8; i++) {
    const stepEl = document.getElementById(`bts-step-${i}`);
    if (stepEl) {
      stepEl.style.display = 'none';
    }
  }

  // Stagger display of steps
  steps.forEach((step, idx) => {
    const timer = setTimeout(() => {
      const stepEl = document.getElementById(step.id);
      const progressVal = document.getElementById('progress-value');
      if (stepEl) {
        stepEl.style.display = 'flex';
        // Auto scroll chat to view
        const chatSection = document.getElementById('chat-section');
        if (chatSection) {
          chatSection.scrollTop = chatSection.scrollHeight;
        }
      }
      if (progressVal) {
        progressVal.textContent = step.progress;
      }
    }, step.delay);

    processingIntervals.push(timer);
  });
}

function stopProcessing() {
  clearAllTimers();
  isProcessing = false;

  const textarea = document.getElementById('screener-input');
  const progressBox = document.getElementById('input-progress');
  const statusLabel = document.getElementById('status-label');

  if (textarea) textarea.placeholder = 'Ask Screener..';
  if (progressBox) progressBox.style.display = 'none';
  if (statusLabel) statusLabel.textContent = 'Prompting';

  // Stop active spinning step
  const activeStep = document.getElementById('bts-step-8');
  if (activeStep) {
    const icon = activeStep.querySelector('.bts-step__icon');
    if (icon) icon.classList.remove('bts-step__icon--spinning');
  }

  updateActionButtonState();
}

function clearAllTimers() {
  processingIntervals.forEach(t => clearTimeout(t));
  processingIntervals = [];
}

/* ─── Collapsible Behind the Scenes ─── */
function initBehindScenesToggle() {
  const toggleBtn = document.getElementById('behind-scenes-toggle');
  const card = document.getElementById('behind-scenes-card');

  if (!toggleBtn || !card) return;

  toggleBtn.addEventListener('click', () => {
    const isCollapsed = card.classList.toggle('collapsed');
    toggleBtn.setAttribute('aria-expanded', !isCollapsed);
  });
}

/* ─── New Chat & Reset View ─── */
function initNewChatButtons() {
  const topNewChatBtn = document.getElementById('new-chat-btn');
  const sidebarNewChatBtn = document.getElementById('sidebar-new-chat');

  function resetToMorningTasks() {
    stopProcessing();
    const tasksSection = document.getElementById('tasks-section');
    const chatSection = document.getElementById('chat-section');
    const content = document.getElementById('main-content');
    const textarea = document.getElementById('screener-input');

    if (tasksSection) tasksSection.style.display = 'flex';
    if (chatSection) chatSection.style.display = 'none';
    if (content) content.classList.remove('chat-mode');
    if (textarea) {
      textarea.value = '';
      textarea.placeholder = 'Ask Screener..';
      textarea.style.height = 'auto';
    }
    updateActionButtonState();
    if (window._closeSidebar) window._closeSidebar();
  }

  if (topNewChatBtn) topNewChatBtn.addEventListener('click', resetToMorningTasks);
  if (sidebarNewChatBtn) sidebarNewChatBtn.addEventListener('click', resetToMorningTasks);
}

/* ─── Chat History Item Clicks ─── */
function initChatHistoryClicks() {
  const chatItems = document.querySelectorAll('.sidebar__chat-item');

  chatItems.forEach(item => {
    item.addEventListener('click', () => {
      const title = item.querySelector('.sidebar__chat-title');
      const text = title ? title.textContent : 'Show me top profitable companies';
      sendPrompt(text);
      if (window._closeSidebar) window._closeSidebar();
    });
  });
}

/* ─── Suggestion Chip Interactions ─── */
function initChipInteractions() {
  const chips = document.querySelectorAll('.chip');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const label = chip.querySelector('.chip__label');
      if (label) {
        const text = label.textContent.trim();
        if (text === 'Evening Tasks') {
          sendPrompt('Show my evening trading tasks and portfolio overview');
        } else if (text === 'Recommendations') {
          sendPrompt('Give me personalized stock recommendations for today');
        } else if (text === 'View Watchlist') {
          sendPrompt('Display my active equity watchlist and alerts');
        } else {
          sendPrompt('More trading insights and market sentiment analysis');
        }
      }

      chip.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.3)';
      setTimeout(() => {
        chip.style.boxShadow = '';
      }, 400);
    });
  });
}

/* ─── Left Sidebar ─── */
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
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      closeDropdown();
    }
  });

  window._closeSidebar = closeSidebar;
}

/* ─── Sidebar Tabs ─── */
function initSidebarTabs() {
  const tabs = document.querySelectorAll('.sidebar__tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('sidebar__tab--active'));
      tab.classList.add('sidebar__tab--active');
    });
  });
}

/* ─── Right Dropdown Menu ─── */
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

/* ─── Dropdown Toggles: Full Width (Page 4) & others ─── */
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

      // Handle Full Width toggle (Page 4)
      if (item.id === 'dropdown-full-width') {
        const content = document.getElementById('main-content');
        if (content) {
          if (!isOn) {
            content.classList.add('full-width');
          } else {
            content.classList.remove('full-width');
          }
        }
      }

      // Handle Small text toggle
      if (item.id === 'dropdown-small-text') {
        document.body.style.fontSize = !isOn ? '14px' : '';
      }

      // Handle Time toggle
      if (item.id === 'dropdown-time') {
        const timeEl = document.getElementById('current-time');
        if (timeEl) {
          timeEl.style.display = !isOn ? 'inline-block' : 'none';
        }
      }
    });
  });
}
