/* ═══════════════════════════════════════════════════════════════════════════
   AGILE WHITEBOARD SESSION LOGIC & STATE MANAGEMENT (REDESIGNED)
   Connected to Express / MongoDB Backend Storage & LocalStorage Fallback.
   Supports Agile Homepage (Growth Stats, Streak Matrix, Past Sessions) and
   Current/Past Session Views with Light-Theme AI Canvas.
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
  const defaultPastSessions = [
    {
      id: 'w13-past',
      title: 'W13 - beauty and care',
      prompt: 'Design an e-commerce subscription box and personalization flow for beauty and skincare routines.',
      difficulty: 'Normal',
      category: 'Beauty & Personal Care',
      duration: '45 min',
      recordedTime: '- 44:12',
      dateLabel: 'today',
      timestamp: Date.now(),
      notes: [
        'Say the words clearly',
        'Take pauses over fillers works',
        'Finish first sentence then go to another'
      ],
      chatHistory: [
        {
          type: 'system',
          label: 'Here is your prompt...',
          text: 'Design an e-commerce subscription box and personalization flow for beauty and skincare routines.',
          time: '11:00 AM'
        }
      ]
    },
    {
      id: 'w12-past',
      title: 'W12 - SaaS',
      prompt: 'Design a developer dashboard for real-time error logging and incident response management.',
      difficulty: 'Difficult',
      category: 'SaaS',
      duration: '60 min',
      recordedTime: '- 58:40',
      dateLabel: 'Aug 1',
      timestamp: Date.now() - 86400000 * 37,
      notes: [
        'Focus on key user journeys',
        'Keep visual hierarchy clean'
      ],
      chatHistory: []
    },
    {
      id: 'w11-past',
      title: 'W11 - EdTech',
      prompt: 'Design an interactive mobile learning interface for high school STEM students.',
      difficulty: 'Difficult',
      category: 'EdTech',
      duration: '45 min',
      recordedTime: '- 42:15',
      dateLabel: 'Jul 29',
      timestamp: Date.now() - 86400000 * 40,
      notes: [
        'Pace presentation evenly'
      ],
      chatHistory: []
    },
    {
      id: 'w10-past',
      title: 'W10 - Sci-Fi',
      prompt: 'Design a holographic heads-up display interface for space station maintenance engineers.',
      difficulty: 'Normal',
      category: 'Random',
      duration: '30 min',
      recordedTime: '- 29:10',
      dateLabel: 'July 5',
      timestamp: Date.now() - 86400000 * 64,
      notes: [
        'Clear typography'
      ],
      chatHistory: []
    },
    {
      id: 'w9-past',
      title: 'W9 - Fintech',
      prompt: 'Design a cross-border micro-investment mobile application for emerging markets.',
      difficulty: 'Normal',
      category: 'FinTech',
      duration: '30 min',
      recordedTime: '- 28:45',
      dateLabel: 'July 5',
      timestamp: Date.now() - 86400000 * 64,
      notes: [],
      chatHistory: []
    }
  ];

  // Global Session State
  const sessionState = {
    mode: 'homepage', // 'homepage' | 'session' | 'history'
    activeSessionId: null,
    answers: {
      difficulty: 'Normal',
      category: 'Random',
      muteNotification: 'Yes',
      duration: '45 min',
    },
    notes: [
      'Say the words clearly',
      'Take pauses over fillers works',
      'Finish first sentence then go to another'
    ],
    pastSessions: defaultPastSessions
  };

  // Questions Data
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
    initNavigationListeners();
    initHeaderSaveButton();
    loadSessionsFromAPI();
  });

  /* ═══════════════════════════════════════════════════════════════════════════
     BACKEND & LOCALSTORAGE PERSISTENCE
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
          sessionState.pastSessions.forEach(s => mergedMap.set(s.id || s._id, s));
          data.sessions.forEach(s => mergedMap.set(s.id || s._id, s));
          sessionState.pastSessions = Array.from(mergedMap.values());
          persistSessionsToLocalStorage();
        }
      }
    } catch (e) {
      console.log('Using local storage for past sessions:', e);
    }
    renderHomepageData();
  }

  async function saveNewSessionToAPI(sessionPayload) {
    const existingIndex = sessionState.pastSessions.findIndex(s => (s.id === sessionPayload.id || s._id === sessionPayload.id));
    if (existingIndex >= 0) {
      sessionState.pastSessions[existingIndex] = sessionPayload;
    } else {
      sessionState.pastSessions.unshift(sessionPayload);
    }
    sessionState.activeSessionId = sessionPayload.id;
    persistSessionsToLocalStorage();
    renderHomepageData();

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

  /* ═══════════════════════════════════════════════════════════════════════════
     HOMEPAGE VIEW LOGIC & RENDERING (Image 1)
     ═══════════════════════════════════════════════════════════════════════════ */
  function renderHomepageData() {
    renderStatsAndStreak();
    renderHomepageSessionList();
  }

  function renderStatsAndStreak() {
    // 1. Total Session Count
    const totalEl = document.getElementById('stat-total-sessions');
    const totalCount = Math.max(93, sessionState.pastSessions.length);
    if (totalEl) totalEl.textContent = totalCount;

    // 2. Streak Calendar Matrix (16 cols x 4 rows)
    const streakMatrix = document.getElementById('agile-streak-matrix');
    if (streakMatrix) {
      let matrixHTML = '';
      // Create 16 columns of 4 blocks each
      for (let col = 0; col < 16; col++) {
        matrixHTML += `<div class="agile-streak-col">`;
        for (let row = 0; row < 4; row++) {
          // Deterministic pattern: mock active days + current session days
          const idx = col * 4 + row;
          const isActive = (idx % 3 === 0 || idx % 7 === 1 || idx % 5 === 2 || idx > 50);
          matrixHTML += `<div class="agile-streak-block ${isActive ? 'agile-streak-block--active' : ''}"></div>`;
        }
        matrixHTML += `</div>`;
      }
      streakMatrix.innerHTML = matrixHTML;
    }

    // 3. Lowest Time Taken per category
    const lowestEl = document.getElementById('stat-lowest-times');
    if (lowestEl) {
      lowestEl.innerHTML = `
        <span style="font-size: 24px; font-weight: 600; color: #fff;">${totalCount}</span> <span style="font-size: 12px; color: rgba(255,255,255,0.6);">/30 mins</span> &nbsp;
        <span style="font-size: 24px; font-weight: 600; color: #fff;">${totalCount}</span> <span style="font-size: 12px; color: rgba(255,255,255,0.6);">/45 mins</span> &nbsp;
        <span style="font-size: 24px; font-weight: 600; color: #fff;">${totalCount}</span> <span style="font-size: 12px; color: rgba(255,255,255,0.6);">/60 mins</span>
      `;
    }
  }

  function renderHomepageSessionList() {
    const listContainer = document.getElementById('agile-homepage-session-list');
    if (!listContainer) return;

    listContainer.innerHTML = sessionState.pastSessions.map(session => {
      const title = session.title || 'Agile Session';
      const duration = session.duration || '45 min';
      const diff = session.difficulty || 'Normal';
      const date = session.dateLabel || 'today';

      return `
        <div class="agile-home-session-row" data-session-id="${session.id || session._id}">
          <div class="agile-home-session-info">
            <div class="agile-home-session-title">${title}</div>
            <div class="agile-home-session-meta">${duration} - ${diff}</div>
          </div>
          <div class="agile-home-session-date">${date}</div>
        </div>
      `;
    }).join('');

    // Attach click listeners to past session rows
    const rows = listContainer.querySelectorAll('.agile-home-session-row');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-session-id');
        const sessionObj = sessionState.pastSessions.find(s => (s.id === id || s._id === id)) || sessionState.pastSessions[0];
        openSessionView(sessionObj);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     VIEW SWITCHING & NAVIGATION
     ═══════════════════════════════════════════════════════════════════════════ */
  function initNavigationListeners() {
    // Big Start Session CTA Bar
    const startCta = document.getElementById('agile-start-new-session-cta');
    if (startCta) {
      startCta.addEventListener('click', () => {
        startNewSession();
      });
    }

    // In-panel Back to Homepage Arrow
    const backBtn = document.getElementById('agile-back-to-home-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        openHomepageView();
      });
    }
  }

  function openHomepageView() {
    sessionState.mode = 'homepage';
    const homeView = document.getElementById('agile-homepage-view');
    const sessionView = document.getElementById('agile-session-view');
    const topbar = document.getElementById('topbar');

    if (topbar) topbar.style.display = 'flex';
    if (homeView && sessionView) {
      sessionView.style.display = 'none';
      homeView.style.display = 'block';
    }
    renderHomepageData();
  }

  function startNewSession() {
    sessionState.mode = 'session';
    sessionState.activeSessionId = `agile-${Date.now()}`;
    sessionState.answers = { difficulty: 'Normal', category: 'Random', muteNotification: 'Yes', duration: '45 min' };

    const homeView = document.getElementById('agile-homepage-view');
    const sessionView = document.getElementById('agile-session-view');
    const topbar = document.getElementById('topbar');

    if (topbar) topbar.style.display = 'none';
    if (homeView && sessionView) {
      homeView.style.display = 'none';
      sessionView.style.display = 'flex';
    }

    // Reset Title
    const titleEl = document.getElementById('session-title');
    if (titleEl) titleEl.textContent = 'W1';

    // Mount fresh RecordingTimer instance
    mountRecorderWidget();

    // Render step 1 of questions feed
    initPrePromptingQuestions();
  }

  function openSessionView(session) {
    sessionState.mode = 'history';
    sessionState.activeSessionId = session.id || session._id;

    const homeView = document.getElementById('agile-homepage-view');
    const sessionView = document.getElementById('agile-session-view');
    const topbar = document.getElementById('topbar');

    if (topbar) topbar.style.display = 'none';
    if (homeView && sessionView) {
      homeView.style.display = 'none';
      sessionView.style.display = 'flex';
    }

    // Set Title
    const titleEl = document.getElementById('session-title');
    if (titleEl) titleEl.textContent = session.title || 'W1';

    // Set Notes
    const notesInput = document.getElementById('agile-notes-input');
    if (notesInput && session.notes) {
      notesInput.value = session.notes.join('\n');
    }

    // Mount RecordingTimer for playback
    mountRecorderWidget();
    if (window.AgileRecorderInstance) {
      window.AgileRecorderInstance.setDuration(2700);
    }

    // Render Past Session Messages in Right Canvas Frame
    const feed = document.getElementById('agile-questions-feed');
    if (feed) {
      if (session.chatHistory && session.chatHistory.length > 0) {
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
      } else {
        feed.innerHTML = `
          <div class="agile-chat-msg agile-chat-msg--system">
            <div class="agile-chat-sublabel">Here is your prompt...</div>
            <div class="agile-chat-prompt-body">${session.prompt || 'Design an interactive session...'}</div>
            <div class="agile-chat-timestamp">${getFormattedISTTime()}</div>
          </div>
        `;
      }
    }
  }

  function mountRecorderWidget() {
    const container = document.getElementById('agile-recorder-container');
    if (!container) return;
    container.innerHTML = '';
    if (typeof RecordingTimer === 'function') {
      window.AgileRecorderInstance = new RecordingTimer('#agile-recorder-container', {
        onSave: (payload) => {
          console.log('Audio Recording Saved:', payload);
        }
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PRE-PROMPTING QUESTIONS & AI CHAT
     ═══════════════════════════════════════════════════════════════════════════ */
  function initPrePromptingQuestions() {
    const feed = document.getElementById('agile-questions-feed');
    if (!feed) return;
    feed.innerHTML = '';
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

    const titleEl = document.getElementById('session-title');
    const timerDisplayEl = window.AgileRecorderInstance ? window.AgileRecorderInstance.dom.timerDisplay.textContent : '- 00:00';
    const newSessionPayload = {
      id: sessionState.activeSessionId || `agile-${Date.now()}`,
      title: titleEl ? titleEl.textContent.trim() : 'W1',
      prompt: promptText,
      answers: sessionState.answers,
      difficulty: sessionState.answers.difficulty || 'Normal',
      category: sessionState.answers.category || 'Random',
      duration: sessionState.answers.duration || 'No',
      recordedTime: sessionState.answers.duration === 'No' ? '- 00:00' : timerDisplayEl,
      dateLabel: 'today',
      timestamp: Date.now(),
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

    // AUTO-START RECORDING IMMEDIATELY ON DONE
    if (window.AgileRecorderInstance && sessionState.answers.duration && sessionState.answers.duration !== 'No') {
      window.AgileRecorderInstance.startRecording();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PERMANENT SAVE SESSION BUTTON HANDLER
     ═══════════════════════════════════════════════════════════════════════════ */
  function initHeaderSaveButton() {
    const saveBtn = document.getElementById('save-session-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', async () => {
      saveBtn.style.opacity = '0.7';

      let audioUrl = null;
      if (window.AgileRecorderInstance) {
        if (window.AgileRecorderInstance.saveSession) {
          window.AgileRecorderInstance.saveSession();
        }
        if (window.AgileRecorderInstance.getAudioDataUrl) {
          audioUrl = await window.AgileRecorderInstance.getAudioDataUrl();
        }
      }

      saveBtn.style.opacity = '1';

      const titleEl = document.getElementById('session-title');
      const notesInput = document.getElementById('agile-notes-input');
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
        duration: sessionState.answers.duration || 'No',
        recordedTime: window.AgileRecorderInstance ? window.AgileRecorderInstance.dom.timerDisplay.textContent : '- 00:00',
        dateLabel: 'today',
        timestamp: Date.now(),
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

      saveBtn.innerHTML = `<span class="material-symbols-outlined">check</span><span>Saved ✓</span>`;
      setTimeout(() => {
        saveBtn.innerHTML = `<span class="material-symbols-outlined">save</span><span>Save the session</span>`;
      }, 2000);
    });
  }

})();
