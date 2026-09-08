/* ═══════════════════════════════════════════════════════════════════════════
   AGILE WHITEBOARD SESSION LOGIC & STATE MANAGEMENT
   Connected to Express / MongoDB Backend Storage & LocalStorage Fallback
   Handles Pre-Prompting Questions Sequence, History Drawer, Past Session Views,
   Auto-Recording on Done, Real IST Timestamps, and Editable Taken Notes.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  const API_BASE = '/api/agile-sessions';
  const STORAGE_KEY = 'AGILE_SAVED_SESSIONS';

  // Real IST Time Helper
  function getFormattedISTTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  // Default Mock Past Session Fallback
  const defaultPastSession = {
    id: 'w1-past',
    title: 'W1',
    prompt: 'Design an Airport traveler app that help users in finding you have to make it f...',
    difficulty: 'Normal',
    category: 'Random',
    duration: '45 min',
    recordedTime: '- 44:06',
    notes: [
      'Say the words clearly',
      'Take pauses over fillers works',
      'Finish first sentence then go to another'
    ],
    chatHistory: [
      {
        type: 'system',
        label: 'Here is your prompt...',
        text: 'Design a mobile and kiosk ecosystem for travelers navigating severe flight disruptions (multi-hour delays, cancellations, and gate changes) across a busy international airport hub.',
        time: '01:06 PM'
      },
      {
        type: 'user',
        text: "Since this is an issue and why both kiosk didn't it gonna have less impact over the effort, is a question coming in my mind i want to remove this since it add more mo...",
        time: '02:06 PM'
      },
      {
        type: 'ai',
        text: 'No, want to see how you gonna solve for this too.',
        time: '02:20 PM'
      },
      {
        type: 'user',
        text: 'Lets talk about the target audience since this is international airport, various audience is there including families, solo and physical aided people, need to design...',
        time: '03:00 PM'
      },
      {
        type: 'ai',
        text: 'Correct, go ahead.',
        time: '03:05 PM'
      }
    ]
  };

  // Session State Data
  const sessionState = {
    mode: 'ongoing', // 'ongoing' | 'history'
    activeSessionId: null,
    answers: {
      difficulty: 'Normal',
      category: 'Random',
      muteNotification: 'Yes',
      duration: '45 min',
    },
    currentQuestionIndex: 1, // 1 to 5
    notes: [
      'Say the words clearly',
      'Take pauses over fillers works',
      'Finish first sentence then go to another'
    ],
    pastSessions: [defaultPastSession]
  };

  // Questions Data (No default pre-selections!)
  const QUESTIONS = [
    {
      id: 1,
      title: 'How difficult you wanna try:',
      key: 'difficulty',
      type: 'pills',
      options: ['Normal', 'Difficult']
    },
    {
      id: 2,
      title: 'Select the category:',
      key: 'category',
      type: 'pills',
      options: [
        'Random', 'Beauty & Personal Care', 'E-commerce', 'Consumer Services',
        'EdTech', 'SaaS', 'Food & Beverage', 'Travel', 'FinTech',
        'Home Services', 'Logistics', 'Payment', 'B2B Services', 'Healthtech', 'Real Estate'
      ]
    },
    {
      id: 3,
      title: 'Mute your notification:',
      key: 'muteNotification',
      type: 'pills',
      options: ['Yes', 'No']
    },
    {
      id: 4,
      title: 'Select the time and recording:',
      key: 'duration',
      type: 'time-picker',
      options: ['30 min', '45 min', '60 min', 'No']
    },
    {
      id: 5,
      title: 'Take 3 deep breaths, and let me know once done.',
      key: 'breaths',
      type: 'pills',
      options: ['Done']
    }
  ];

  document.addEventListener('DOMContentLoaded', () => {
    initSidebarDrawer();
    initPrePromptingQuestions();
    initHeaderSaveButton();
    loadSessionsFromAPI();
  });

  /* ═══════════════════════════════════════════════════════════════════════════
     BACKEND & LOCALSTORAGE PERSISTENCE (Dual Storage Engine)
     ═══════════════════════════════════════════════════════════════════════════ */
  function loadSessionsFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          sessionState.pastSessions = parsed;
        }
      }
    } catch (e) {
      console.log('LocalStorage load error:', e);
    }
  }

  function persistSessionsToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionState.pastSessions));
    } catch (e) {
      console.log('LocalStorage save error:', e);
    }
  }

  async function loadSessionsFromAPI() {
    loadSessionsFromLocalStorage();
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions) && data.sessions.length > 0) {
          const mergedMap = new Map();
          // Merge local and API sessions
          sessionState.pastSessions.forEach(s => mergedMap.set(s.id || s._id, s));
          data.sessions.forEach(s => mergedMap.set(s.id || s._id, s));
          sessionState.pastSessions = Array.from(mergedMap.values());
          persistSessionsToLocalStorage();
        }
      }
    } catch (e) {
      console.log('Using local storage for past sessions:', e);
    }
    renderSidebarSessionList();
  }

  async function saveNewSessionToAPI(sessionPayload) {
    // 1. Instantly update local state & LocalStorage
    const existingIndex = sessionState.pastSessions.findIndex(s => (s.id === sessionPayload.id || s._id === sessionPayload.id));
    if (existingIndex >= 0) {
      sessionState.pastSessions[existingIndex] = sessionPayload;
    } else {
      sessionState.pastSessions.unshift(sessionPayload);
    }
    sessionState.activeSessionId = sessionPayload.id;
    persistSessionsToLocalStorage();
    renderSidebarSessionList();

    // 2. Sync to MongoDB API backend
    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload)
      });
    } catch (e) {
      console.log('Backend API sync pending (saved in LocalStorage):', e);
    }
  }

  async function updateSessionInAPI(sessionId, updateData) {
    if (!sessionId) return;
    // 1. Instantly update local session object & LocalStorage
    const target = sessionState.pastSessions.find(s => (s.id === sessionId || s._id === sessionId));
    if (target) {
      Object.assign(target, updateData);
      persistSessionsToLocalStorage();
      renderSidebarSessionList();
    }

    // 2. Sync to MongoDB API backend
    try {
      await fetch(`${API_BASE}/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
    } catch (e) {
      console.log('Backend API update pending:', e);
    }
  }

  /* ── Sidebar Drawer ── */
  function initSidebarDrawer() {
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('sidebar-close-btn');

    if (!menuBtn || !sidebar || !overlay) return;

    function openSidebar() {
      sidebar.classList.add('sidebar--open');
      overlay.classList.add('overlay--open');
      renderSidebarSessionList(); // Refresh list on open
    }

    function closeSidebar() {
      sidebar.classList.remove('sidebar--open');
      overlay.classList.remove('overlay--open');
    }

    menuBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    renderSidebarSessionList();
  }

  function renderSidebarSessionList() {
    const sessionList = document.getElementById('user-session-list');
    if (!sessionList) return;

    let itemsHTML = `
      <div class="sidebar__session-item" id="sidebar-new-session-item" style="display:flex; align-items:center; gap:10px; padding:10px 12px; margin-bottom:8px; border-radius:8px; background:rgba(76, 175, 80, 0.1); border:1px solid rgba(76, 175, 80, 0.3); color:#81C784; cursor:pointer;">
        <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>
        <span style="font-size:13px; font-weight:600;">+ Start New Agile Session</span>
      </div>
    `;

    sessionState.pastSessions.forEach((s, idx) => {
      itemsHTML += `
        <div class="sidebar__session-item" data-session-id="${s.id || s._id}" style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; margin-bottom:4px; border-radius:8px; background:rgba(255,255,255,0.04); color:#e3e3e3; cursor:pointer; transition:background 0.2s ease;">
          <div style="display:flex; flex-direction:column; gap:2px; overflow:hidden;">
            <span style="font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.title || 'W' + (idx + 1)} - ${s.category || 'Agile Session'}</span>
            <span style="font-size:11px; color:rgba(255,255,255,0.5);">${s.duration || '45 min'} • ${s.difficulty || 'Normal'} • ${s.category || 'Random'}</span>
          </div>
          <span class="material-symbols-outlined" style="font-size:16px; color:rgba(255,255,255,0.4);">chevron_right</span>
        </div>
      `;
    });

    sessionList.innerHTML = itemsHTML;

    // Attach click handlers
    const newSessionBtn = document.getElementById('sidebar-new-session-item');
    if (newSessionBtn) {
      newSessionBtn.addEventListener('click', () => {
        closeSidebarDrawer();
        loadOngoingSessionView();
      });
    }

    const items = sessionList.querySelectorAll('.sidebar__session-item[data-session-id]');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-session-id');
        const sessionObj = sessionState.pastSessions.find(s => (s.id === id || s._id === id)) || sessionState.pastSessions[0];
        closeSidebarDrawer();
        loadPastSessionView(sessionObj);
      });
    });
  }

  function closeSidebarDrawer() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('sidebar--open');
    if (overlay) overlay.classList.remove('overlay--open');
  }

  /* ── Pre-Prompting Questions Render & Logic ── */
  function initPrePromptingQuestions() {
    const canvasSpace = document.getElementById('agile-canvas-space');
    if (!canvasSpace) return;

    let qContainer = document.getElementById('agile-questions-feed');
    if (!qContainer) {
      qContainer = document.createElement('div');
      qContainer.id = 'agile-questions-feed';
      qContainer.className = 'agile-questions-feed';
      canvasSpace.insertBefore(qContainer, canvasSpace.firstChild);
    }

    renderQuestionStep(1);
  }

  function renderQuestionStep(stepNum) {
    const feed = document.getElementById('agile-questions-feed');
    if (!feed) return;

    const qData = QUESTIONS.find(q => q.id === stepNum);
    if (!qData) return;

    if (document.getElementById(`agile-q-card-${qData.id}`)) return;

    const card = document.createElement('div');
    card.id = `agile-q-card-${qData.id}`;
    card.className = 'agile-q-card';

    let optionsHTML = '';
    if (qData.type === 'pills') {
      optionsHTML = `<div class="agile-q-pills-row">` +
        qData.options.map(opt => {
          return `<button class="agile-q-pill" data-key="${qData.key}" data-val="${opt}">${opt}</button>`;
        }).join('') +
        `</div>`;
    } else if (qData.type === 'time-picker') {
      optionsHTML = `
        <div class="agile-q-time-card">
          <div class="agile-q-dial-preview">
            <div class="agile-q-dial-circle">
              <span class="agile-q-dial-tick agile-q-dial-tick--1"></span>
              <span class="agile-q-dial-tick agile-q-dial-tick--2"></span>
              <span class="agile-q-dial-tick agile-q-dial-tick--3"></span>
              <div class="agile-q-dial-dot"></div>
            </div>
          </div>
          <div class="agile-q-time-grid">
            ${qData.options.map(opt => {
              return `<button class="agile-q-pill agile-q-pill--time" data-key="${qData.key}" data-val="${opt}">${opt}</button>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="agile-q-title">${qData.title}</div>
      ${optionsHTML}
    `;

    feed.appendChild(card);
    feed.scrollTop = feed.scrollHeight;

    const pills = card.querySelectorAll('.agile-q-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.getAttribute('data-val');
        const key = pill.getAttribute('data-key');
        sessionState.answers[key] = val;

        pills.forEach(p => p.classList.remove('agile-q-pill--selected'));
        pill.classList.add('agile-q-pill--selected');

        if (key === 'duration' && window.AgileRecorderInstance) {
          if (val === '30 min') window.AgileRecorderInstance.setDuration(1800);
          else if (val === '45 min') window.AgileRecorderInstance.setDuration(2700);
          else if (val === '60 min') window.AgileRecorderInstance.setDuration(3600);
          else if (val === 'No') window.AgileRecorderInstance.setDuration(0);
        }

        if (stepNum < QUESTIONS.length) {
          setTimeout(() => renderQuestionStep(stepNum + 1), 250);
        } else if (stepNum === 5 && val === 'Done') {
          setTimeout(completePrePromptingSequence, 300);
        }
      });
    });
  }

  /* ── Complete Questions, Show Prompt, Save to DB & LocalStorage, and AUTO-START RECORDING ── */
  function completePrePromptingSequence() {
    const feed = document.getElementById('agile-questions-feed');
    if (!feed) return;

    const realTime = getFormattedISTTime();
    const promptText = 'Design a mobile and kiosk ecosystem for travelers navigating severe flight disruptions (multi-hour delays, cancellations, and gate changes) across a busy international airport hub.';

    feed.innerHTML = `
      <div class="agile-chat-msg agile-chat-msg--system">
        <div class="agile-chat-sublabel">Here is your prompt...</div>
        <div class="agile-chat-prompt-body">${promptText}</div>
        <div class="agile-chat-timestamp">${realTime}</div>
      </div>
    `;

    // Save session payload to LocalStorage & MongoDB
    const titleEl = document.getElementById('session-title');
    const timerDisplayEl = window.AgileRecorderInstance ? window.AgileRecorderInstance.dom.timerDisplay.textContent : '- 00:00';
    const newSessionPayload = {
      id: `agile-${Date.now()}`,
      title: titleEl ? titleEl.textContent.trim() : 'W1',
      prompt: promptText,
      answers: sessionState.answers,
      difficulty: sessionState.answers.difficulty || 'Normal',
      category: sessionState.answers.category || 'Random',
      duration: sessionState.answers.duration || 'No',
      recordedTime: sessionState.answers.duration === 'No' ? '- 00:00' : timerDisplayEl,
      notes: sessionState.notes,
      chatHistory: [
        {
          type: 'system',
          label: 'Here is your prompt...',
          text: promptText,
          time: realTime
        }
      ]
    };

    saveNewSessionToAPI(newSessionPayload);

    // AUTO-START RECORDING IMMEDIATELY ON DONE (only if duration was selected and is NOT 'No')
    if (window.AgileRecorderInstance && sessionState.answers.duration && sessionState.answers.duration !== 'No') {
      window.AgileRecorderInstance.startRecording();
    }
  }

  /* ── Load Past Session View ── */
  function loadPastSessionView(session) {
    sessionState.mode = 'history';
    sessionState.activeSessionId = session.id || session._id;

    const panel = document.getElementById('agile-floating-panel');
    if (!panel) return;

    panel.innerHTML = `
      <!-- Session Title Header (W1 ✎) -->
      <div class="session-title-header">
        <div class="session-title-header__left">
          <h2 class="session-title-header__name" id="session-title" contenteditable="true" spellcheck="false">${session.title || 'W1'}</h2>
          <button class="session-title-header__edit-btn" id="edit-title-btn" aria-label="Edit title" title="Edit session title">
            <span class="material-symbols-outlined">edit</span>
          </button>
        </div>
        <button class="session-title-header__save-btn" id="save-session-btn" title="Save session">Save</button>
      </div>

      <!-- One-line prompt showcase (No view button) -->
      <div class="agile-prompt-showcase-line" title="${session.prompt || ''}">
        ${session.prompt || 'Design an Airport traveler app...'}
      </div>

      <!-- Difficulty Level -->
      <div class="agile-section">
        <div class="agile-section__label">Difficulty Level:</div>
        <div class="agile-history-pill">${session.difficulty || 'Normal'}</div>
      </div>

      <!-- Industry Category -->
      <div class="agile-section">
        <div class="agile-section__label">Industry Category:</div>
        <div class="agile-history-pill">${session.category || 'Random'}</div>
      </div>

      <!-- Session Recording and Time (EXACT SAME COMPONENT AS CURRENT SESSION) -->
      <div class="agile-section">
        <div class="agile-section__label">Session Recoding and Time:</div>
        <div class="agile-inner-card agile-inner-card--recorder">
          <div id="agile-history-recorder-container"></div>
        </div>
      </div>

      <!-- Taken Notes (Fill Container Height) -->
      <div class="agile-section agile-section--notes">
        <div class="agile-section__label-row">
          <span class="agile-section__label">Taken Notes:</span>
          <button class="agile-notes-save-btn" id="save-notes-btn" title="Save notes to history">Save</button>
        </div>
        <div class="agile-inner-card agile-inner-card--notes">
          <textarea class="agile-notes-input" id="history-notes-input">${(session.notes || []).map(n => '- ' + n).join('\n')}</textarea>
        </div>
      </div>
    `;

    // Instantiate exact same RecordingTimer widget for past session
    if (typeof RecordingTimer === 'function') {
      const historyRecorder = new RecordingTimer('#agile-history-recorder-container', {
        onSave: (payload) => { console.log('History Recording Saved:', payload); }
      });

      // Bind real audio playback to record button in past session mode
      historyRecorder.dom.recordBtn.onclick = (e) => {
        e.stopPropagation();
        historyRecorder.playRealAudio(session.audioUrl);
      };

      // Show -10 sec and +10 sec skip buttons on past session recorder
      setTimeout(() => {
        if (historyRecorder.showSkipControls) {
          historyRecorder.showSkipControls();
        }
      }, 50);
    }

    // Render Past Session Chat Messages in Right Canvas Space with Real IST Timestamps
    const feed = document.getElementById('agile-questions-feed');
    if (feed && session.chatHistory) {
      feed.innerHTML = session.chatHistory.map(msg => {
        if (msg.type === 'system') {
          return `
            <div class="agile-chat-msg agile-chat-msg--system">
              <div class="agile-chat-sublabel">${msg.label || 'Here is your prompt...'}</div>
              <div class="agile-chat-prompt-body">${msg.text}</div>
              <div class="agile-chat-timestamp">${msg.time || getFormattedISTTime()}</div>
            </div>
          `;
        } else if (msg.type === 'user') {
          return `
            <div class="agile-chat-msg agile-chat-msg--user">
              <div class="agile-chat-bubble">${msg.text}</div>
              <div class="agile-chat-timestamp">${msg.time || getFormattedISTTime()}</div>
            </div>
          `;
        } else {
          return `
            <div class="agile-chat-msg agile-chat-msg--ai">
              <div class="agile-chat-text">${msg.text}</div>
              <div class="agile-chat-timestamp">${msg.time || getFormattedISTTime()}</div>
            </div>
          `;
        }
      }).join('');
    }

    // Attach Notes Save Listener & backend sync
    const notesInput = document.getElementById('history-notes-input');
    const saveNotesBtn = document.getElementById('save-notes-btn');
    if (notesInput && saveNotesBtn) {
      notesInput.addEventListener('focus', () => {
        saveNotesBtn.classList.add('is-visible');
      });
      saveNotesBtn.addEventListener('click', () => {
        const raw = notesInput.value;
        const lines = raw.split('\n').map(l => l.replace(/^- /, '').trim()).filter(l => l.length > 0);
        session.notes = lines;
        sessionState.notes = lines;

        // Persist updated notes to LocalStorage & MongoDB backend
        updateSessionInAPI(sessionState.activeSessionId, { notes: lines });

        saveNotesBtn.classList.remove('is-visible');
        saveNotesBtn.textContent = 'Saved ✓';
        setTimeout(() => { saveNotesBtn.textContent = 'Save'; }, 2000);
      });
    }

    initHeaderSaveButton(); // Rebind header save button for history panel
  }

  /* ── Load Ongoing Session View ── */
  function loadOngoingSessionView() {
    window.location.reload();
  }

  /* ── Header Save Button Handler ── */
  function initHeaderSaveButton() {
    const saveBtn = document.getElementById('save-session-btn');
    if (!saveBtn) return;
    saveBtn.addEventListener('click', async () => {
      saveBtn.textContent = 'Saving...';

      // Timer stops ONLY when session is saved!
      let audioUrl = null;
      if (window.AgileRecorderInstance) {
        if (window.AgileRecorderInstance.saveSession) {
          window.AgileRecorderInstance.saveSession();
        }
        if (window.AgileRecorderInstance.getAudioDataUrl) {
          audioUrl = await window.AgileRecorderInstance.getAudioDataUrl();
        }
      }

      saveBtn.textContent = 'Saved ✓';

      // Extract current panel contents & save session
      const titleEl = document.getElementById('session-title');
      const notesInput = document.getElementById('agile-notes-input') || document.getElementById('history-notes-input');
      const currentTitle = titleEl ? titleEl.textContent.trim() : 'W1';
      const currentNotes = notesInput ? notesInput.value.split('\n').map(l => l.replace(/^- /, '').trim()).filter(l => l.length > 0) : sessionState.notes;

      if (!sessionState.activeSessionId) {
        sessionState.activeSessionId = `agile-${Date.now()}`;
      }

      const activePayload = {
        id: sessionState.activeSessionId,
        title: currentTitle,
        prompt: 'Design a mobile and kiosk ecosystem for travelers navigating severe flight disruptions across a busy international airport hub.',
        answers: sessionState.answers,
        difficulty: sessionState.answers.difficulty || 'Normal',
        category: sessionState.answers.category || 'Random',
        duration: sessionState.answers.duration || '45 min',
        recordedTime: '- 45:00',
        notes: currentNotes,
        audioUrl: audioUrl || undefined,
        chatHistory: [
          {
            type: 'system',
            label: 'Here is your prompt...',
            text: 'Design a mobile and kiosk ecosystem for travelers navigating severe flight disruptions across a busy international airport hub.',
            time: getFormattedISTTime()
          }
        ]
      };

      saveNewSessionToAPI(activePayload);

      setTimeout(() => {
        saveBtn.textContent = 'Save';
        saveBtn.classList.remove('is-visible');
      }, 2000);
    });
  }

  window.showSessionHeaderSaveBtn = function () {
    const saveBtn = document.getElementById('save-session-btn');
    if (saveBtn) saveBtn.classList.add('is-visible');
  };
})();
