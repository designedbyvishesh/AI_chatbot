/* ═══════════════════════════════════════════════════════════════════════════
   AGILE WHITEBOARD SESSION LOGIC & STATE MANAGEMENT
   Connected to Express / MongoDB Backend Storage & LocalStorage Fallback.
   Supports Agile Homepage (Growth Stats, Streak Matrix, Past Sessions) and
   Current/Past Session Views with Light-Theme AI Canvas.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  const API_BASE = '/api/agile-sessions';
  const STORAGE_KEY = 'AGILE_SAVED_SESSIONS';

  // Helper: DOM Element Selector by ID
  const getEl = (id) => document.getElementById(id);

  // Formatted IST Time Helper
  function getFormattedISTTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  // Default Fallback Mock Past Sessions
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
      chatCards: [
        {
          id: 1,
          x: 100,
          y: 100,
          aiText: 'Design an e-commerce subscription box and personalization flow for beauty and skincare routines.',
          time: '11:00 AM'
        }
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
      notes: ['Focus on key user journeys', 'Keep visual hierarchy clean'],
      chatCards: [
        {
          id: 2,
          x: 100,
          y: 100,
          aiText: 'Design a developer dashboard for real-time error logging and incident response management.',
          time: '02:30 PM'
        }
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
      notes: ['Pace presentation evenly'],
      chatCards: [
        {
          id: 3,
          x: 100,
          y: 100,
          aiText: 'Design an interactive mobile learning interface for high school STEM students.',
          time: '10:15 AM'
        }
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
      notes: ['Clear typography'],
      chatCards: [
        {
          id: 4,
          x: 100,
          y: 100,
          aiText: 'Design a holographic heads-up display interface for space station maintenance engineers.',
          time: '04:20 PM'
        }
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
      chatCards: [
        {
          id: 5,
          x: 100,
          y: 100,
          aiText: 'Design a cross-border micro-investment mobile application for emerging markets.',
          time: '09:45 AM'
        }
      ],
      chatHistory: []
    }
  ];

  // Global Session State
  const sessionState = {
    mode: 'homepage', // 'homepage' | 'session' | 'history'
    activeSessionId: null,
    totalSessionsCompleted: null,
    isCanvasLocked: false,
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

  // Pre-prompting Questions Data
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
    initNotesTabs();
    initDeleteModalListeners();
    initMoreOptionsDropdown();
    initFavoriteButtonListener();
    loadSessionsFromAPI();
    initHybridCanvasEngine();
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
      const storedTotal = localStorage.getItem('AGILE_TOTAL_SESSIONS_COMPLETED');
      if (storedTotal !== null && storedTotal !== undefined) {
        sessionState.totalSessionsCompleted = parseInt(storedTotal, 10);
      } else {
        sessionState.totalSessionsCompleted = sessionState.pastSessions ? sessionState.pastSessions.length : 0;
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
    const currentLen = sessionState.pastSessions ? sessionState.pastSessions.length : 0;
    sessionState.totalSessionsCompleted = Math.max(sessionState.totalSessionsCompleted || 0, currentLen);
    renderHomepageData();
    hideHomepageLoader();
  }

  function hideHomepageLoader() {
    const loader = getEl('agile-home-page-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('is-hidden');
      }, 1200);
    }
  }

  async function saveNewSessionToAPI(sessionPayload) {
    const existingIndex = sessionState.pastSessions.findIndex(s => (s.id === sessionPayload.id || s._id === sessionPayload.id));
    if (existingIndex >= 0) {
      sessionState.pastSessions[existingIndex] = sessionPayload;
    } else {
      sessionState.pastSessions.unshift(sessionPayload);
    }
    sessionState.activeSessionId = sessionPayload.id;

    const currentLen = sessionState.pastSessions.length;
    sessionState.totalSessionsCompleted = Math.max((sessionState.totalSessionsCompleted || 0) + (existingIndex >= 0 ? 0 : 1), currentLen);
    localStorage.setItem('AGILE_TOTAL_SESSIONS_COMPLETED', sessionState.totalSessionsCompleted.toString());

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
     HOMEPAGE VIEW LOGIC & RENDERING
     ═══════════════════════════════════════════════════════════════════════════ */
  function renderHomepageData() {
    renderStatsAndStreak();
    renderHomepageSessionList();
  }

  function getLocalDateKey(d) {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function computeStreakData(pastSessions) {
    const activeDates = new Set();

    pastSessions.forEach(s => {
      let d;
      if (s.timestamp) {
        d = new Date(s.timestamp);
      } else if (s.dateLabel === 'today') {
        d = new Date();
      } else if (s.dateLabel === 'yesterday') {
        d = new Date(Date.now() - 86400000);
      } else {
        d = new Date();
      }
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        activeDates.add(getLocalDateKey(d));
      }
    });

    const sortedDates = Array.from(activeDates)
      .map(k => new Date(k + 'T00:00:00'))
      .sort((a, b) => a - b);

    let maxStreak = 0;
    let currentRun = 0;
    let prevTime = null;

    sortedDates.forEach(d => {
      if (prevTime === null) {
        currentRun = 1;
      } else {
        const diffDays = Math.round((d.getTime() - prevTime) / 86400000);
        if (diffDays === 1) {
          currentRun++;
        } else if (diffDays > 1) {
          currentRun = 1;
        }
      }
      prevTime = d.getTime();
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    });

    return { activeDates, maxStreak };
  }

  function renderStatsAndStreak() {
    // 1. Total Session Count (Uses preserved totalSessionsCompleted so deletion doesn't reduce total count)
    const totalEl = getEl('stat-total-sessions');
    const currentLen = sessionState.pastSessions ? sessionState.pastSessions.length : 0;
    if (sessionState.totalSessionsCompleted === null || sessionState.totalSessionsCompleted === undefined) {
      sessionState.totalSessionsCompleted = currentLen;
    }
    sessionState.totalSessionsCompleted = Math.max(sessionState.totalSessionsCompleted, currentLen);
    localStorage.setItem('AGILE_TOTAL_SESSIONS_COMPLETED', sessionState.totalSessionsCompleted.toString());

    const totalCount = sessionState.totalSessionsCompleted;
    if (totalEl) totalEl.textContent = totalCount;

    // 2. Streak Computation & Longest Streak Display
    const { activeDates, maxStreak } = computeStreakData(sessionState.pastSessions || []);

    const longestEl = getEl('stat-longest-streak');
    if (longestEl) {
      longestEl.textContent = `Longest - ${maxStreak} day${maxStreak === 1 ? '' : 's'}`;
    }

    // Dynamic Months Header
    const monthsEl = getEl('agile-streak-months');
    if (monthsEl) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const curMonthIndex = new Date().getMonth();
      const m1 = monthNames[(curMonthIndex - 3 + 12) % 12];
      const m2 = monthNames[(curMonthIndex - 2 + 12) % 12];
      const m3 = monthNames[(curMonthIndex - 1 + 12) % 12];
      const m4 = monthNames[curMonthIndex];
      monthsEl.innerHTML = `<span>${m1}</span><span>${m2}</span><span>${m3}</span><span>${m4}</span>`;
    }

    // Streak Calendar Matrix (16 cols x 4 rows = 64 days ending today)
    const streakMatrix = getEl('agile-streak-matrix');
    if (streakMatrix) {
      let matrixHTML = '';
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dayKeys = [];
      for (let i = 63; i >= 0; i--) {
        const dayDate = new Date(today.getTime() - i * 86400000);
        dayKeys.push(getLocalDateKey(dayDate));
      }

      for (let col = 0; col < 16; col++) {
        matrixHTML += `<div class="agile-streak-col">`;
        for (let row = 0; row < 4; row++) {
          const idx = col * 4 + row;
          const dayKey = dayKeys[idx];
          const isActive = activeDates.has(dayKey);
          matrixHTML += `<div class="agile-streak-block ${isActive ? 'agile-streak-block--active' : ''}" title="${dayKey}"></div>`;
        }
        matrixHTML += `</div>`;
      }
      streakMatrix.innerHTML = matrixHTML;
    }

    // 3. Lowest Time Taken per category
    const lowestEl = getEl('stat-lowest-times');
    if (lowestEl) {
      lowestEl.innerHTML = `
        <span style="font-size: 24px; font-weight: 600; color: #fff;">${totalCount}</span> <span style="font-size: 12px; color: rgba(255,255,255,0.6);">/30 mins</span> &nbsp;
        <span style="font-size: 24px; font-weight: 600; color: #fff;">${totalCount}</span> <span style="font-size: 12px; color: rgba(255,255,255,0.6);">/45 mins</span> &nbsp;
        <span style="font-size: 24px; font-weight: 600; color: #fff;">${totalCount}</span> <span style="font-size: 12px; color: rgba(255,255,255,0.6);">/60 mins</span>
      `;
    }
  }

  function renderHomepageSessionList() {
    const listContainer = getEl('agile-homepage-session-list');
    if (!listContainer) return;

    if (!sessionState.pastSessions || sessionState.pastSessions.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: rgba(255, 255, 255, 0.4); font-size: 14px;">
          No past sessions available.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = sessionState.pastSessions.map(session => {
      const sessionId = session.id || session._id;
      const title = session.title || 'Agile Session';
      const duration = session.duration || '45 min';
      const diff = session.difficulty || 'Normal';
      const date = session.dateLabel || 'today';
      const isFav = !!session.isFavorite;

      const starHTML = isFav ? `
        <span class="agile-home-session-star-wrap" title="Favorited session" style="display: inline-flex; align-items: center; justify-content: center; margin-right: 2px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#8C8C8C" stroke="none" style="filter: none;">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </span>
      ` : '';

      return `
        <div class="agile-home-session-row" data-session-id="${sessionId}">
          <div class="agile-home-session-info">
            <div class="agile-home-session-title">${title}</div>
            <div class="agile-home-session-meta">${duration} - ${diff}</div>
          </div>
          <div class="agile-home-session-right">
            ${starHTML}
            <div class="agile-home-session-date">${date}</div>
            <button class="agile-session-delete-btn" aria-label="Delete Session" data-session-id="${sessionId}" title="Delete session">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    const rows = listContainer.querySelectorAll('.agile-home-session-row');
    rows.forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.agile-session-delete-btn')) return;
        const id = row.getAttribute('data-session-id');
        const sessionObj = sessionState.pastSessions.find(s => (s.id === id || s._id === id)) || sessionState.pastSessions[0];
        openSessionView(sessionObj);
      });
    });

    const deleteBtns = listContainer.querySelectorAll('.agile-session-delete-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.getAttribute('data-session-id');
        openDeleteModal(id);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DELETE PAST SESSION MODAL LOGIC
     ═══════════════════════════════════════════════════════════════════════════ */
  let pendingDeleteSessionId = null;

  function openDeleteModal(sessionId) {
    pendingDeleteSessionId = sessionId;
    const sessionObj = sessionState.pastSessions.find(s => (s.id === sessionId || s._id === sessionId));
    const modalOverlay = getEl('agile-delete-modal-overlay');
    const sessionNameEl = getEl('delete-modal-session-name');

    if (sessionNameEl && sessionObj) {
      sessionNameEl.textContent = `"${sessionObj.title || 'Untitled Session'}"`;
    }
    if (modalOverlay) {
      modalOverlay.style.display = 'flex';
    }
  }

  function closeDeleteModal() {
    pendingDeleteSessionId = null;
    const modalOverlay = getEl('agile-delete-modal-overlay');
    if (modalOverlay) {
      modalOverlay.style.display = 'none';
    }
  }

  async function confirmDeleteSession() {
    if (!pendingDeleteSessionId) return;
    const sessionId = pendingDeleteSessionId;

    // 1. Preserve total sessions completed metric in state and storage
    const currentLen = sessionState.pastSessions ? sessionState.pastSessions.length : 0;
    sessionState.totalSessionsCompleted = Math.max(sessionState.totalSessionsCompleted || 0, currentLen);
    localStorage.setItem('AGILE_TOTAL_SESSIONS_COMPLETED', sessionState.totalSessionsCompleted.toString());

    // 2. Remove target session from memory state
    sessionState.pastSessions = sessionState.pastSessions.filter(s => (s.id !== sessionId && s._id !== sessionId));

    // 3. Save updated past sessions to LocalStorage
    persistSessionsToLocalStorage();

    // 4. Close confirmation popup modal
    closeDeleteModal();

    // 5. If user is currently viewing session details or if the deleted session was active, redirect to homepage
    if (sessionState.mode !== 'homepage' || sessionState.activeSessionId === sessionId) {
      openHomepageView();
    } else {
      renderHomepageData();
    }

    // 6. Delete from backend database storage API
    try {
      await fetch(`${API_BASE}/${sessionId}`, { method: 'DELETE' });
    } catch (e) {
      console.log('Backend API delete fallback:', e);
    }
  }

  function initDeleteModalListeners() {
    const cancelBtn = getEl('delete-modal-cancel-btn');
    const confirmBtn = getEl('delete-modal-confirm-btn');
    const overlay = getEl('agile-delete-modal-overlay');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeDeleteModal);
    }
    if (confirmBtn) {
      confirmBtn.addEventListener('click', confirmDeleteSession);
    }
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeDeleteModal();
        }
      });
    }
  }

  function initMoreOptionsDropdown() {
    const moreBtn = getEl('agile-more-options-btn');
    const dropdown = getEl('agile-more-options-dropdown');
    const deleteBtn = getEl('agile-dropdown-delete-btn');

    if (moreBtn && dropdown) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = dropdown.style.display === 'none';
        dropdown.style.display = isHidden ? 'block' : 'none';
      });

      document.addEventListener('click', (e) => {
        if (!moreBtn.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown) dropdown.style.display = 'none';
        const targetId = sessionState.activeSessionId || (sessionState.pastSessions[0] && sessionState.pastSessions[0].id);
        if (targetId) {
          openDeleteModal(targetId);
        }
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FAVORITE SESSION LOGIC & STATE PERSISTENCE
     ═══════════════════════════════════════════════════════════════════════════ */
  function initFavoriteButtonListener() {
    const favBtn = getEl('agile-favorite-session-btn');
    if (favBtn) {
      favBtn.addEventListener('click', toggleFavoriteActiveSession);
    }
  }

  function toggleFavoriteActiveSession() {
    const activeId = sessionState.activeSessionId;
    if (!activeId) return;

    const sessionObj = sessionState.pastSessions.find(s => (s.id === activeId || s._id === activeId));
    if (sessionObj) {
      sessionObj.isFavorite = !sessionObj.isFavorite;
      updateFavoriteButtonUI(sessionObj.isFavorite);
      persistSessionsToLocalStorage();
      renderHomepageData();

      try {
        fetch(`${API_BASE}/${activeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFavorite: sessionObj.isFavorite })
        });
      } catch (e) {
        console.log('Backend API favorite sync fallback:', e);
      }
    }
  }

  function updateFavoriteButtonUI(isFav) {
    const starIcon = getEl('agile-favorite-star-icon');
    const favBtn = getEl('agile-favorite-session-btn');
    if (starIcon) {
      if (isFav) {
        starIcon.classList.add('is-favorite');
        starIcon.style.color = '#FFD700';
        starIcon.style.fontVariationSettings = "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24";
      } else {
        starIcon.classList.remove('is-favorite');
        starIcon.style.color = 'rgba(255, 255, 255, 0.4)';
        starIcon.style.fontVariationSettings = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
      }
    }
    if (favBtn) {
      favBtn.setAttribute('title', isFav ? 'Favorited' : 'Mark it favorite');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     VIEW SWITCHING & NAVIGATION
     ═══════════════════════════════════════════════════════════════════════════ */
  function triggerViewTransition(viewEl) {
    if (!viewEl) return;
    viewEl.style.animation = 'none';
    void viewEl.offsetWidth;
    viewEl.style.animation = 'agileViewTransition 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  }

  function initNavigationListeners() {
    const startCta = getEl('agile-start-new-session-cta');
    if (startCta) startCta.addEventListener('click', startNewSession);

    const backBtn = getEl('agile-back-to-home-btn');
    if (backBtn) backBtn.addEventListener('click', openHomepageView);
  }

  function openHomepageView() {
    sessionState.mode = 'homepage';
    sessionState.isCanvasLocked = false;
    const canvasFrame = document.querySelector('.agile-right-canvas-frame');
    if (canvasFrame) canvasFrame.classList.remove('is-canvas-locked');

    const homeView = getEl('agile-homepage-view');
    const sessionView = getEl('agile-session-view');
    const topbar = getEl('topbar');

    if (topbar) topbar.style.display = 'flex';
    if (homeView && sessionView) {
      sessionView.style.display = 'none';
      homeView.style.display = 'flex';
      triggerViewTransition(homeView);
    }
    renderHomepageData();
  }

  function startNewSession() {
    sessionState.mode = 'session';
    sessionState.activeSessionId = `agile-${Date.now()}`;
    sessionState.answers = { difficulty: 'Normal', category: 'Random', muteNotification: 'Yes', duration: '45 min' };

    // Lock canvas while mandatory questions are active
    sessionState.isCanvasLocked = true;
    const canvasFrame = document.querySelector('.agile-right-canvas-frame');
    if (canvasFrame) canvasFrame.classList.add('is-canvas-locked');

    if (window.AgileEngineState) {
      window.AgileEngineState.translate = { x: 0, y: 0 };
      window.AgileEngineState.scale = 1.0;
    }

    // Hide bottom prompt bar initially until mandatory questions are completed
    const promptWrapper = getEl('agile-prompt-wrapper');
    if (promptWrapper) {
      promptWrapper.classList.add('is-hidden');
      promptWrapper.style.display = 'none';
    }

    // Reset Spatial Cards and Vector Shapes on 2D Canvas for New Session
    if (window.AgileSpatialCards) {
      window.AgileSpatialCards.length = 0;
    }
    if (window.AgileCanvasShapes) {
      window.AgileCanvasShapes.length = 0;
    }
    window.renderAgileCanvas && window.renderAgileCanvas();

    // Show questions feed overlay for pre-prompting setup
    const feed = getEl('agile-questions-feed');
    if (feed) {
      feed.style.display = 'flex';
      feed.innerHTML = '';
    }

    const homeView = getEl('agile-homepage-view');
    const sessionView = getEl('agile-session-view');
    const topbar = getEl('topbar');

    if (topbar) topbar.style.display = 'none';
    if (homeView && sessionView) {
      homeView.style.display = 'none';
      sessionView.style.display = 'flex';
      triggerViewTransition(sessionView);
    }

    const currentLeft = getEl('left-panel-layout-current');
    const pastLeft = getEl('left-panel-layout-past');
    if (currentLeft) currentLeft.style.display = 'flex';
    if (pastLeft) pastLeft.style.display = 'none';

    const titleEl = getEl('session-title');
    if (titleEl) titleEl.textContent = 'W1';

    const notesInputCurrent = getEl('agile-notes-input-current');
    if (notesInputCurrent) notesInputCurrent.value = '';

    mountRecorderWidget();
    initPrePromptingQuestions();
    if (window.resizeHybridCanvas) window.resizeHybridCanvas();
  }

  function openSessionView(session) {
    sessionState.mode = 'history';
    sessionState.activeSessionId = session.id || session._id;
    sessionState.isCanvasLocked = false;
    const canvasFrame = document.querySelector('.agile-right-canvas-frame');
    if (canvasFrame) canvasFrame.classList.remove('is-canvas-locked');

    updateFavoriteButtonUI(!!session.isFavorite);

    const homeView = getEl('agile-homepage-view');
    const sessionView = getEl('agile-session-view');
    const topbar = getEl('topbar');

    if (topbar) topbar.style.display = 'none';
    if (homeView && sessionView) {
      homeView.style.display = 'none';
      sessionView.style.display = 'flex';
      triggerViewTransition(sessionView);
    }

    const currentLeft = getEl('left-panel-layout-current');
    const pastLeft = getEl('left-panel-layout-past');
    if (currentLeft) currentLeft.style.display = 'none';
    if (pastLeft) pastLeft.style.display = 'flex';

    const titleEl = getEl('session-title');
    if (titleEl) titleEl.textContent = session.title || 'W1';

    const diffEl = getEl('meta-difficulty-val');
    const catEl = getEl('meta-industry-val');
    if (diffEl) diffEl.textContent = session.difficulty || (session.answers && session.answers.difficulty) || 'Normal';
    if (catEl) catEl.textContent = session.category || (session.answers && session.answers.category) || 'Random';

    const notesInputPast = getEl('agile-notes-input-past');
    if (notesInputPast && session.notes) {
      notesInputPast.value = session.notes.join('\n');
    }

    mountRecorderWidget();
    if (window.AgileRecorderInstance) {
      window.AgileRecorderInstance.setDuration(2700);
      if (typeof window.AgileRecorderInstance.showSkipControls === 'function') {
        window.AgileRecorderInstance.showSkipControls();
      }
    }

    // Hide pre-prompting questions feed
    const feed = getEl('agile-questions-feed');
    if (feed) feed.style.display = 'none';

    // REMOVE bottom interaction capsule bar completely from past sessions
    const promptWrapper = getEl('agile-prompt-wrapper');
    if (promptWrapper) {
      promptWrapper.classList.add('is-hidden');
      promptWrapper.style.display = 'none';
    }

    // Restore vector shapes for past session
    if (window.AgileCanvasShapes) {
      window.AgileCanvasShapes.length = 0;
      if (session.shapes && session.shapes.length > 0) {
        session.shapes.forEach(s => window.AgileCanvasShapes.push(JSON.parse(JSON.stringify(s))));
      }
    }

    // Load past session history & AI chats directly into 2D Spatial Cards
    if (window.AgileSpatialCards) {
      window.AgileSpatialCards.length = 0;
      if (session.chatCards && session.chatCards.length > 0) {
        session.chatCards.forEach(card => {
          window.AgileSpatialCards.push(JSON.parse(JSON.stringify(card)));
        });
      } else if (session.chatHistory && session.chatHistory.length > 0) {
        let currentY = 100;
        session.chatHistory.forEach(msg => {
          window.AgileSpatialCards.push({
            id: Date.now() + Math.random(),
            x: 100,
            y: currentY,
            userText: msg.type === 'user' ? msg.text : undefined,
            aiText: msg.type !== 'user' ? msg.text : undefined,
            time: msg.time || getFormattedISTTime()
          });
          currentY += 160;
        });
      } else {
        window.AgileSpatialCards.push({
          id: Date.now(),
          x: 100,
          y: 100,
          aiText: session.prompt || 'Design an interactive session...',
          time: getFormattedISTTime()
        });
      }
      window.renderAgileCanvas && window.renderAgileCanvas();
    }

    if (window.resizeHybridCanvas) window.resizeHybridCanvas();
  }

  function mountRecorderWidget() {
    const isPast = sessionState.mode === 'history';
    const containerId = isPast ? 'agile-recorder-container-past' : 'agile-recorder-container-current';
    const container = getEl(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (typeof RecordingTimer === 'function') {
      window.AgileRecorderInstance = new RecordingTimer(`#${containerId}`, {
        onSave: (payload) => {
          console.log('Audio Recording Saved:', payload);
        }
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PRE-PROMPTING QUESTIONS & AI CHAT
     ═══════════════════════════════════════════════════════════════════════════ */
  /* ═══════════════════════════════════════════════════════════════════════════
     PRE-PROMPTING QUESTIONS & AI CHAT (Centered Stepper with 1.5s Initial Delay)
     ═══════════════════════════════════════════════════════════════════════════ */
  function initPrePromptingQuestions() {
    const feed = getEl('agile-questions-feed');
    if (!feed) return;
    feed.style.display = 'flex';
    feed.innerHTML = `
      <div id="agile-stepper-card" class="agile-stepper-card">
        <div class="agile-stepper-header">
          <img src="assets/Logo_White_BG.svg" alt="Logo" class="agile-stepper-icon" width="42" height="42" />
          <div class="agile-stepper-progress-track">
            <div id="agile-stepper-progress-fill" class="agile-stepper-progress-fill" style="width: 0%;"></div>
          </div>
          <div class="agile-stepper-subcopy">Select an option below to customize your challenge.</div>
        </div>
        <div id="agile-stepper-questions" class="agile-stepper-questions"></div>
      </div>
    `;

    // Delay first question appearance by 1.5 seconds as requested
    setTimeout(() => {
      renderQuestionStep(1);
    }, 1500);
  }

  function renderQuestionStep(stepNum) {
    const questionsContainer = getEl('agile-stepper-questions');
    if (!questionsContainer) return;

    const qData = QUESTIONS.find(q => q.id === stepNum);
    if (!qData || getEl(`agile-q-card-${qData.id}`)) return;

    // Update rounded corner progress bar fill width
    const progressFill = getEl('agile-stepper-progress-fill');
    if (progressFill) {
      const pct = Math.min(100, Math.round((stepNum / QUESTIONS.length) * 100));
      progressFill.style.width = `${pct}%`;
    }

    const card = document.createElement('div');
    card.id = `agile-q-card-${qData.id}`;
    card.className = 'agile-q-card';

    let optionsHTML = '';
    if (qData.type === 'pills') {
      optionsHTML = `<div class="agile-q-pills-row">` +
        qData.options.map(opt => `<button class="agile-q-pill" data-key="${qData.key}" data-val="${opt}">${opt}</button>`).join('') +
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
            ${qData.options.map(opt => `<button class="agile-q-pill agile-q-pill--time" data-key="${qData.key}" data-val="${opt}">${opt}</button>`).join('')}
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="agile-q-title">${qData.title}</div>
      ${optionsHTML}
    `;

    questionsContainer.appendChild(card);

    // Smooth scroll inside stepper card as questions reveal
    const stepperCard = getEl('agile-stepper-card');
    if (stepperCard) {
      stepperCard.scrollTo({ top: stepperCard.scrollHeight, behavior: 'smooth' });
    }

    const pills = card.querySelectorAll('.agile-q-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.getAttribute('data-val');
        const key = pill.getAttribute('data-key');
        sessionState.answers[key] = val;

        pills.forEach(p => p.classList.remove('agile-q-pill--selected'));
        pill.classList.add('agile-q-pill--selected');

        if (key === 'difficulty') {
          const diffEl = getEl('meta-difficulty-val');
          if (diffEl) diffEl.textContent = val;
        }
        if (key === 'category') {
          const catEl = getEl('meta-industry-val');
          if (catEl) catEl.textContent = val;
        }

        if (key === 'duration' && window.AgileRecorderInstance) {
          if (val === '30 min') window.AgileRecorderInstance.setDuration(1800);
          else if (val === '45 min') window.AgileRecorderInstance.setDuration(2700);
          else if (val === '60 min') window.AgileRecorderInstance.setDuration(3600);
          else if (val === 'No') window.AgileRecorderInstance.setDuration(0);
        }

        if (stepNum < QUESTIONS.length) {
          setTimeout(() => renderQuestionStep(stepNum + 1), 300);
        } else if (stepNum === 5 && val === 'Done') {
          setTimeout(completePrePromptingSequence, 350);
        }
      });
    });
  }

  function completePrePromptingSequence() {
    const feed = getEl('agile-questions-feed');
    if (feed) feed.style.display = 'none';

    // Unlock canvas after mandatory questions are completed
    sessionState.isCanvasLocked = false;
    const canvasFrame = document.querySelector('.agile-right-canvas-frame');
    if (canvasFrame) canvasFrame.classList.remove('is-canvas-locked');

    if (window.AgileEngineState) {
      window.AgileEngineState.translate = { x: 0, y: 0 };
      window.AgileEngineState.scale = 1.0;
    }

    // 1. Reveal bottom prompt bar with sequential 2-stage entrance animation:
    // Stage 1: Mode buttons (Scribble ~ & Rabbit 🐰) appear first on the bottom left.
    // Stage 2: Default AI mode button (Rabbit 🐰) expands/opens the AI chat input bar.
    const promptWrapper = getEl('agile-prompt-wrapper');
    const hybridBar = getEl('agile-hybrid-bar');

    if (promptWrapper && hybridBar) {
      hybridBar.classList.remove('is-expanding-bar', 'mode-chat', 'mode-whiteboard');
      hybridBar.classList.add('is-entering-toggle');

      promptWrapper.style.display = 'flex';
      void promptWrapper.offsetWidth; // Force CSS reflow for transition
      promptWrapper.classList.remove('is-hidden');

      // Stage 2: After 400ms delay, open/expand AI Chat input bar from the AI mode pill
      setTimeout(() => {
        hybridBar.classList.remove('is-entering-toggle');
        hybridBar.classList.add('is-expanding-bar');

        setTimeout(() => {
          hybridBar.classList.remove('is-expanding-bar');
          hybridBar.classList.add('mode-chat');
        }, 450);
      }, 400);
    }

    // 2. Instantiate Generated Challenge Prompt as FIRST Spatial Chat Node on 2D Infinite Canvas
    const realTime = getFormattedISTTime();
    const promptText = 'Design a mobile and kiosk ecosystem for travelers navigating severe flight disruptions (multi-hour delays, cancellations, and gate changes) across a busy international airport hub.';

    if (window.AgileSpatialCards) {
      window.AgileSpatialCards.length = 0;
      window.AgileSpatialCards.push({
        id: Date.now(),
        x: 100,
        y: 100,
        aiText: promptText,
        time: realTime
      });
      window.renderAgileCanvas && window.renderAgileCanvas();
    }

    if (window.AgileRecorderInstance && sessionState.answers.duration && sessionState.answers.duration !== 'No') {
      window.AgileRecorderInstance.startRecording();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PERMANENT SAVE SESSION BUTTON HANDLER
     ═══════════════════════════════════════════════════════════════════════════ */
  function initHeaderSaveButton() {
    const saveBtn = getEl('save-session-btn');
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

      const titleEl = getEl('session-title');
      const notesInputId = sessionState.mode === 'history' ? 'agile-notes-input-past' : 'agile-notes-input-current';
      const notesInput = getEl(notesInputId);
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
        chatCards: window.AgileSpatialCards ? JSON.parse(JSON.stringify(window.AgileSpatialCards)) : [],
        shapes: window.AgileCanvasShapes ? JSON.parse(JSON.stringify(window.AgileCanvasShapes)) : [],
        chatHistory: window.AgileSpatialCards ? window.AgileSpatialCards.map(c => ({
          type: c.userText ? 'user' : 'ai',
          text: c.userText || c.aiText || c.text,
          time: c.time
        })) : []
      };

      saveNewSessionToAPI(activePayload);

      saveBtn.innerHTML = `<span class="material-symbols-outlined">check</span><span>Saved ✓</span>`;
      setTimeout(() => {
        saveBtn.innerHTML = `<span class="material-symbols-outlined">save</span><span>Save the session</span>`;
      }, 2000);
    });
  }

  function initNotesTabs() {
    const tabTakenBtn = getEl('tab-btn-taken-notes');
    const tabLessonsBtn = getEl('tab-btn-lessons');
    const panelTaken = getEl('tab-panel-taken-notes');
    const panelLessons = getEl('tab-panel-lessons');

    if (!tabTakenBtn || !tabLessonsBtn || !panelTaken || !panelLessons) return;

    tabTakenBtn.addEventListener('click', () => {
      tabTakenBtn.classList.add('active');
      tabLessonsBtn.classList.remove('active');
      panelTaken.style.display = 'flex';
      panelLessons.style.display = 'none';
    });

    tabLessonsBtn.addEventListener('click', () => {
      tabLessonsBtn.classList.add('active');
      tabTakenBtn.classList.remove('active');
      panelTaken.style.display = 'none';
      panelLessons.style.display = 'block';
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     INTERLEAVED HYBRID INFINITE 2D CANVAS ENGINE
     Alternates between freeform Whiteboard mode and Spatial AI Chat Stream.
     ═══════════════════════════════════════════════════════════════════════════ */
  function initHybridCanvasEngine() {
    const canvasEl = getEl('agile-hybrid-canvas');
    const overlayEl = getEl('agile-hybrid-overlay');
    const barEl = getEl('agile-hybrid-bar');
    const scribbleBtn = getEl('mode-btn-scribble');
    const rabbitBtn = getEl('mode-btn-rabbit');
    const sectionChat = getEl('bar-section-chat');
    const sectionWhiteboard = getEl('bar-section-whiteboard');
    const promptInput = getEl('agile-prompt-input');
    const sendBtn = getEl('agile-prompt-send-btn');

    if (!canvasEl) return;

    const ctx = canvasEl.getContext('2d');

    // Engine State
    const engineState = {
      mode: 'chat', // 'chat' | 'whiteboard'
      tool: 'text', // 'text' | 'rectangle' | 'circle' | 'line' | 'hand' | 'move'
      color: '#111111',
      scale: 1.0,
      translate: { x: 0, y: 0 },
      isDrawing: false,
      isPanning: false,
      panStart: { x: 0, y: 0 },
      startPoint: null,
      currentPoint: null,
      freehandPoints: [],
      shapes: [],
      chatCards: [],
      // Figma-Style Selection & Resizing State
      selectedShapeId: null,
      selectedShapeIds: [],
      isSelectingArea: false,
      selectionStart: null,
      selectionCurrent: null,
      isMovingShape: false,
      isResizingShape: false,
      resizeHandle: null,
      dragStartCanvas: null,
      shapeInitialState: null,
      shapeInitialStates: {}
    };

    // Helper: Multi-line text wrapping for canvas text nodes
    function wrapTextLines(context, text, maxWidth) {
      if (!text) return [];
      const lines = [];
      const paragraphs = text.split('\n');
      paragraphs.forEach((p) => {
        if (!p) {
          lines.push('');
          return;
        }
        const words = p.split(' ');
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine + ' ' + word;
          const metrics = context.measureText(testLine);
          if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);
      });
      return lines;
    }

    // Helper: Get Shape Bounding Box
    function getShapeBounds(shape) {
      if (!shape) return { x: 0, y: 0, width: 0, height: 0 };
      if (shape.type === 'rect') {
        return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
      } else if (shape.type === 'circle') {
        return { x: shape.cx - shape.r, y: shape.cy - shape.r, width: shape.r * 2, height: shape.r * 2 };
      } else if (shape.type === 'line') {
        const x = Math.min(shape.x1, shape.x2);
        const y = Math.min(shape.y1, shape.y2);
        const w = Math.abs(shape.x2 - shape.x1);
        const h = Math.abs(shape.y2 - shape.y1);
        return { x, y, width: Math.max(w, 8), height: Math.max(h, 8) };
      } else if (shape.type === 'text') {
        ctx.save();
        ctx.font = '500 16px Inter, sans-serif';
        const maxW = Math.min(shape.width || 400, 720);
        const lines = wrapTextLines(ctx, shape.text || '', maxW);
        let maxLineW = 0;
        lines.forEach((l) => {
          const m = ctx.measureText(l);
          if (m.width > maxLineW) maxLineW = m.width;
        });
        ctx.restore();
        const finalW = Math.max(100, Math.min(720, Math.max(maxLineW + 16, shape.width || 400)));
        const finalH = Math.max(30, lines.length * 22 + 10);
        return { x: shape.x, y: shape.y, width: finalW, height: finalH };
      } else if (shape.type === 'path' && shape.points && shape.points.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shape.points.forEach(pt => {
          minX = Math.min(minX, pt.x);
          minY = Math.min(minY, pt.y);
          maxX = Math.max(maxX, pt.x);
          maxY = Math.max(maxY, pt.y);
        });
        return { x: minX - 4, y: minY - 4, width: Math.max(8, maxX - minX + 8), height: Math.max(8, maxY - minY + 8) };
      }
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Helper: Combined bounding box for multi-selected shapes
    function getCombinedBounds(shapes) {
      if (!shapes || shapes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      shapes.forEach(s => {
        const b = getShapeBounds(s);
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width);
        maxY = Math.max(maxY, b.y + b.height);
      });
      return { x: minX, y: minY, width: Math.max(8, maxX - minX), height: Math.max(8, maxY - minY) };
    }

    // Helper: Test bounding box overlap (for marquee selection box)
    function boundsOverlap(b1, b2) {
      return !(
        b1.x + b1.width < b2.x ||
        b2.x + b2.width < b1.x ||
        b1.y + b1.height < b2.y ||
        b2.y + b2.height < b1.y
      );
    }

    // Helper: Distance from point (px, py) to line segment (x1, y1)-(x2, y2)
    function distToSegment(px, py, x1, y1, x2, y2) {
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      if (l2 === 0) return Math.hypot(px - x1, py - y1);
      let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = x1 + t * (x2 - x1);
      const projY = y1 + t * (y2 - y1);
      return Math.hypot(px - projX, py - projY);
    }

    // Helper: Hit Test Shape Border Stroke (Topmost shape first)
    function hitTestShapeBorder(cx, cy, threshold = 8 / engineState.scale) {
      for (let i = engineState.shapes.length - 1; i >= 0; i--) {
        const shape = engineState.shapes[i];
        if (shape.type === 'rect') {
          const x = shape.x, y = shape.y, w = shape.width, h = shape.height;
          const d1 = distToSegment(cx, cy, x, y, x + w, y);
          const d2 = distToSegment(cx, cy, x + w, y, x + w, y + h);
          const d3 = distToSegment(cx, cy, x + w, y + h, x, y + h);
          const d4 = distToSegment(cx, cy, x, y + h, x, y);
          if (Math.min(d1, d2, d3, d4) <= threshold) return shape;
        } else if (shape.type === 'circle') {
          const dist = Math.hypot(cx - shape.cx, cy - shape.cy);
          if (Math.abs(dist - shape.r) <= threshold) return shape;
        } else if (shape.type === 'line') {
          if (distToSegment(cx, cy, shape.x1, shape.y1, shape.x2, shape.y2) <= threshold) return shape;
        } else if (shape.type === 'text') {
          const bounds = getShapeBounds(shape);
          const x = bounds.x, y = bounds.y, w = bounds.width, h = bounds.height;
          const d1 = distToSegment(cx, cy, x, y, x + w, y);
          const d2 = distToSegment(cx, cy, x + w, y, x + w, y + h);
          const d3 = distToSegment(cx, cy, x + w, y + h, x, y + h);
          const d4 = distToSegment(cx, cy, x, y, x, y + h);
          if (Math.min(d1, d2, d3, d4) <= threshold + 4) return shape;
        } else if (shape.type === 'path' && shape.points && shape.points.length > 1) {
          for (let j = 0; j < shape.points.length - 1; j++) {
            const p1 = shape.points[j], p2 = shape.points[j + 1];
            if (distToSegment(cx, cy, p1.x, p1.y, p2.x, p2.y) <= threshold) return shape;
          }
        }
      }
      return null;
    }

    // Helper: Hit Test Shape Bounding Box (Topmost shape first)
    function hitTestShape(cx, cy) {
      for (let i = engineState.shapes.length - 1; i >= 0; i--) {
        const shape = engineState.shapes[i];
        const bounds = getShapeBounds(shape);
        const padding = 6;
        if (
          cx >= bounds.x - padding &&
          cx <= bounds.x + bounds.width + padding &&
          cy >= bounds.y - padding &&
          cy <= bounds.y + bounds.height + padding
        ) {
          return shape;
        }
      }
      return null;
    }

    // Helper: Get 8 Resize Handles for Selected Shape(s)
    function getResizeHandles(shape) {
      if (shape.type === 'line') {
        return [
          { handle: 'p1', x: shape.x1, y: shape.y1 },
          { handle: 'p2', x: shape.x2, y: shape.y2 }
        ];
      }
      const bounds = getShapeBounds(shape);
      const x = bounds.x;
      const y = bounds.y;
      const w = bounds.width;
      const h = bounds.height;
      return [
        { handle: 'tl', x: x, y: y },
        { handle: 'tr', x: x + w, y: y },
        { handle: 'bl', x: x, y: y + h },
        { handle: 'br', x: x + w, y: y + h },
        { handle: 't', x: x + w / 2, y: y },
        { handle: 'b', x: x + w / 2, y: y + h },
        { handle: 'l', x: x, y: y + h / 2 },
        { handle: 'r', x: x + w, y: y + h / 2 }
      ];
    }

    // Helper: Hit Test Resize Handle
    function hitTestResizeHandle(cx, cy, shape) {
      if (!shape) return null;
      const handles = getResizeHandles(shape);
      const threshold = 12 / engineState.scale;
      for (let h of handles) {
        const dist = Math.hypot(cx - h.x, cy - h.y);
        if (dist <= threshold) {
          return h.handle;
        }
      }
      return null;
    }

    // Helper: Render Selection Bounding Box & 8 Handles for Single or Multi-Selected Shapes
    function renderSelectionOverlay(shapesOrShape) {
      const selectedShapes = Array.isArray(shapesOrShape) ? shapesOrShape : [shapesOrShape];
      if (!selectedShapes || selectedShapes.length === 0) return;

      ctx.save();
      const bounds = selectedShapes.length === 1 ? getShapeBounds(selectedShapes[0]) : getCombinedBounds(selectedShapes);

      // Draw bounding box outline (#009B1A)
      ctx.strokeStyle = '#009B1A';
      ctx.lineWidth = 1.8 / engineState.scale;
      ctx.setLineDash([4 / engineState.scale, 4 / engineState.scale]);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.setLineDash([]);

      // Draw 8 handles
      const dummyShape = { type: 'rect', x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
      const handles = getResizeHandles(dummyShape);
      const handleSize = 8 / engineState.scale;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#009B1A';
      ctx.lineWidth = 1.5 / engineState.scale;

      handles.forEach(h => {
        ctx.beginPath();
        ctx.rect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
    }

    // Expose engine state cards and shapes arrays globally for session manager
    window.AgileSpatialCards = engineState.chatCards;
    window.AgileCanvasShapes = engineState.shapes;

    // Fixed Bounded Canvas Extent [-100,000px, +100,000px]
    const CANVAS_BOUNDS = { minX: -100000, maxX: 100000, minY: -100000, maxY: 100000 };

    function clampTranslation() {
      const rect = canvasEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const vWidth = rect.width / engineState.scale;
      const vHeight = rect.height / engineState.scale;

      const minTx = -(CANVAS_BOUNDS.maxX - vWidth) * engineState.scale;
      const maxTx = -CANVAS_BOUNDS.minX * engineState.scale;
      const minTy = -(CANVAS_BOUNDS.maxY - vHeight) * engineState.scale;
      const maxTy = -CANVAS_BOUNDS.minY * engineState.scale;

      engineState.translate.x = Math.max(minTx, Math.min(maxTx, engineState.translate.x));
      engineState.translate.y = Math.max(minTy, Math.min(maxTy, engineState.translate.y));
    }

    /* ── 1. Device Pixel Ratio & Canvas Resize Buffer ── */
    function resizeCanvasBuffer() {
      const parent = canvasEl.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;

      canvasEl.width = rect.width * dpr;
      canvasEl.height = rect.height * dpr;
      canvasEl.style.width = rect.width + 'px';
      canvasEl.style.height = rect.height + 'px';

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      renderCanvas();
    }

    window.resizeHybridCanvas = resizeCanvasBuffer;
    window.addEventListener('resize', resizeCanvasBuffer);
    if (window.ResizeObserver && canvasEl.parentElement) {
      const observer = new ResizeObserver(() => resizeCanvasBuffer());
      observer.observe(canvasEl.parentElement);
    }
    setTimeout(resizeCanvasBuffer, 50);

    /* ── 2. Screen-to-Canvas Coordinate Matrix Transform ── */
    function screenToCanvasCoordinates(px, py) {
      const rect = canvasEl.getBoundingClientRect();
      const screenX = px - rect.left;
      const screenY = py - rect.top;
      return {
        x: (screenX - engineState.translate.x) / engineState.scale,
        y: (screenY - engineState.translate.y) / engineState.scale
      };
    }

    function canvasToScreenCoordinates(cx, cy) {
      return {
        x: cx * engineState.scale + engineState.translate.x,
        y: cy * engineState.scale + engineState.translate.y
      };
    }

    /* ── 3. Calculate Global Y_max Axis-Aligned Bounding Box (AABB) ── */
    function calculateCanvasYMax() {
      let maxY = 100; // Default top padding (100px margin from top)

      // Check vector shapes
      engineState.shapes.forEach((shape) => {
        if (shape.type === 'rect') {
          maxY = Math.max(maxY, shape.y + shape.height);
        } else if (shape.type === 'circle') {
          maxY = Math.max(maxY, shape.cy + shape.r);
        } else if (shape.type === 'line') {
          maxY = Math.max(maxY, shape.y1, shape.y2);
        } else if (shape.type === 'text') {
          maxY = Math.max(maxY, shape.y + 40);
        } else if (shape.type === 'path' && shape.points) {
          shape.points.forEach((pt) => {
            maxY = Math.max(maxY, pt.y);
          });
        }
      });

      // Check spatial chat cards
      engineState.chatCards.forEach((card) => {
        const cardEl = document.getElementById(`spatial-card-${card.id}`);
        let cardH = 0;
        if (cardEl && cardEl.offsetHeight > 0) {
          cardH = cardEl.offsetHeight;
          card.height = cardH;
        } else if (card.height && card.height > 0) {
          cardH = card.height;
        } else {
          const userLen = (card.userText || '').length;
          const aiLen = (card.aiText || card.text || '').length;
          cardH = Math.max(140, Math.ceil((userLen + aiLen) / 45) * 22 + 80);
          card.height = cardH;
        }
        const cardBottom = card.y + cardH;
        maxY = Math.max(maxY, cardBottom);
      });

      return maxY;
    }

    /* ── 4. Smooth Catmull-Rom Path Rendering ── */
    function drawSmoothedPath(context, points, color) {
      if (points.length < 2) return;
      context.beginPath();
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.lineCap = 'round';
      context.lineJoin = 'round';

      context.moveTo(points[0].x, points[0].y);

      if (points.length === 2) {
        context.lineTo(points[1].x, points[1].y);
        context.stroke();
        return;
      }

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
      context.stroke();
    }

    /* ── 5. Main Canvas Rendering Loop ── */
    function renderCanvas() {
      clampTranslation();
      const rect = canvasEl.getBoundingClientRect();
      ctx.save();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Apply Canvas Matrix Transform (Translation & Zoom)
      ctx.translate(engineState.translate.x, engineState.translate.y);
      ctx.scale(engineState.scale, engineState.scale);

      // Render Infinite Grid Points Background
      const gridSpacing = 30;
      const startX = Math.floor(-engineState.translate.x / engineState.scale / gridSpacing) * gridSpacing - gridSpacing;
      const startY = Math.floor(-engineState.translate.y / engineState.scale / gridSpacing) * gridSpacing - gridSpacing;
      const endX = startX + rect.width / engineState.scale + gridSpacing * 2;
      const endY = startY + rect.height / engineState.scale + gridSpacing * 2;

      ctx.fillStyle = '#e5e7eb';
      for (let gx = startX; gx < endX; gx += gridSpacing) {
        for (let gy = startY; gy < endY; gy += gridSpacing) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render Finalized Shapes
      engineState.shapes.forEach((shape) => {
        ctx.strokeStyle = shape.color || '#111111';
        ctx.fillStyle = shape.color || '#111111';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (shape.type === 'path' && shape.points) {
          drawSmoothedPath(ctx, shape.points, shape.color || '#111111');
        } else if (shape.type === 'rect') {
          ctx.beginPath();
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === 'circle') {
          ctx.beginPath();
          ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shape.type === 'line') {
          ctx.beginPath();
          ctx.moveTo(shape.x1, shape.y1);
          ctx.lineTo(shape.x2, shape.y2);
          ctx.stroke();
        } else if (shape.type === 'text') {
          ctx.font = '500 16px Inter, sans-serif';
          const maxW = Math.min(shape.width || 400, 720);
          const lines = wrapTextLines(ctx, shape.text, maxW);
          const lineHeight = 22;
          lines.forEach((line, idx) => {
            ctx.fillText(line, shape.x, shape.y + 16 + idx * lineHeight);
          });
        }
      });

      // Render In-Progress Active Shape
      if (engineState.isDrawing && engineState.startPoint && engineState.currentPoint) {
        ctx.strokeStyle = engineState.color;
        ctx.lineWidth = 2.5;

        if (engineState.tool === 'rectangle') {
          const x = Math.min(engineState.startPoint.x, engineState.currentPoint.x);
          const y = Math.min(engineState.startPoint.y, engineState.currentPoint.y);
          const w = Math.abs(engineState.currentPoint.x - engineState.startPoint.x);
          const h = Math.abs(engineState.currentPoint.y - engineState.startPoint.y);
          ctx.strokeRect(x, y, w, h);
        } else if (engineState.tool === 'circle') {
          const x1 = engineState.startPoint.x;
          const y1 = engineState.startPoint.y;
          const x2 = engineState.currentPoint.x;
          const y2 = engineState.currentPoint.y;
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2;
          const rx = Math.abs(x2 - x1) / 2;
          const ry = Math.abs(y2 - y1) / 2;
          const radius = Math.max(rx, ry);
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (engineState.tool === 'line') {
          ctx.beginPath();
          ctx.moveTo(engineState.startPoint.x, engineState.startPoint.y);
          ctx.lineTo(engineState.currentPoint.x, engineState.currentPoint.y);
          ctx.stroke();
        } else if (engineState.freehandPoints.length > 0) {
          drawSmoothedPath(ctx, engineState.freehandPoints, engineState.color);
        }
      }

      // Render Marquee Selection Box (Stroke 1.5px #009B1A, Fill rgba(0, 255, 43, 0.05))
      if (engineState.isSelectingArea && engineState.selectionStart && engineState.selectionCurrent) {
        const x = Math.min(engineState.selectionStart.x, engineState.selectionCurrent.x);
        const y = Math.min(engineState.selectionStart.y, engineState.selectionCurrent.y);
        const w = Math.abs(engineState.selectionCurrent.x - engineState.selectionStart.x);
        const h = Math.abs(engineState.selectionCurrent.y - engineState.selectionStart.y);

        ctx.save();
        ctx.strokeStyle = '#009B1A';
        ctx.lineWidth = 1.5 / engineState.scale;
        ctx.fillStyle = 'rgba(0, 255, 43, 0.05)';
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Render Selection Overlay Box & Handles for Selected Shape(s)
      if (engineState.selectedShapeIds && engineState.selectedShapeIds.length > 0) {
        const selectedShapes = engineState.shapes.filter(s => engineState.selectedShapeIds.includes(s.id));
        if (selectedShapes.length > 0) {
          renderSelectionOverlay(selectedShapes);
        }
      } else if (engineState.selectedShapeId) {
        const selectedShape = engineState.shapes.find(s => s.id === engineState.selectedShapeId);
        if (selectedShape) {
          renderSelectionOverlay(selectedShape);
        }
      }

      ctx.restore();
      syncSpatialChatOverlayPosition();
      updateCustomCanvasScrollbars();
    }

    // Expose render trigger globally
    window.renderAgileCanvas = renderCanvas;

    /* ── 6. Sync Spatial Overlay Items Position (Image 2 Design: Synced on 2D Infinite Canvas) ── */
    function syncSpatialChatOverlayPosition() {
      if (!overlayEl) return;

      // Remove orphaned spatial nodes from DOM when cards are reset or cleared
      const activeIds = new Set(engineState.chatCards.map((c) => `spatial-card-${c.id}`));
      Array.from(overlayEl.querySelectorAll('.agile-spatial-chat-node')).forEach((node) => {
        if (!activeIds.has(node.id)) {
          node.remove();
        }
      });

      engineState.chatCards.forEach((card) => {
        let cardEl = document.getElementById(`spatial-card-${card.id}`);
        if (!cardEl) {
          cardEl = document.createElement('div');
          cardEl.id = `spatial-card-${card.id}`;
          cardEl.className = 'agile-spatial-chat-node';
          const userHtml = card.userText ? `
            <div class="agile-chat-msg agile-chat-msg--user" style="align-self: flex-end; display: flex; flex-direction: column; align-items: flex-end;">
              <div class="agile-chat-bubble">${card.userText}</div>
              <div class="agile-chat-timestamp">${card.time || getFormattedISTTime()}</div>
            </div>
          ` : '';
          const aiHtml = card.isLoading ? `
            <div class="agile-chat-msg agile-chat-msg--ai" style="align-self: flex-start; display: flex; flex-direction: column; align-items: flex-start;">
              <div class="agile-chat-ai-loading">
                <div class="agile-bunny-loader agile-bunny-loader--chat">
                  <img src="assets/hidden_Bunny_SVG.svg" class="agile-bunny-loader__img" alt="AI fetching..." />
                </div>
              </div>
            </div>
          ` : ((card.aiText || card.text) ? `
            <div class="agile-chat-msg agile-chat-msg--ai" style="align-self: flex-start; display: flex; flex-direction: column; align-items: flex-start;">
              <div class="agile-chat-prompt-body">${card.aiText || card.text}</div>
              <div class="agile-chat-timestamp">${card.time || getFormattedISTTime()}</div>
            </div>
          ` : '');
          cardEl.innerHTML = userHtml + aiHtml;
          overlayEl.appendChild(cardEl);
        } else {
          // Keep innerHTML updated dynamically when loading completes
          const userHtml = card.userText ? `
            <div class="agile-chat-msg agile-chat-msg--user" style="align-self: flex-end; display: flex; flex-direction: column; align-items: flex-end;">
              <div class="agile-chat-bubble">${card.userText}</div>
              <div class="agile-chat-timestamp">${card.time || getFormattedISTTime()}</div>
            </div>
          ` : '';
          const aiHtml = card.isLoading ? `
            <div class="agile-chat-msg agile-chat-msg--ai" style="align-self: flex-start; display: flex; flex-direction: column; align-items: flex-start;">
              <div class="agile-chat-ai-loading">
                <div class="agile-bunny-loader agile-bunny-loader--chat">
                  <img src="assets/hidden_Bunny_SVG.svg" class="agile-bunny-loader__img" alt="AI fetching..." />
                </div>
              </div>
            </div>
          ` : ((card.aiText || card.text) ? `
            <div class="agile-chat-msg agile-chat-msg--ai" style="align-self: flex-start; display: flex; flex-direction: column; align-items: flex-start;">
              <div class="agile-chat-prompt-body">${card.aiText || card.text}</div>
              <div class="agile-chat-timestamp">${card.time || getFormattedISTTime()}</div>
            </div>
          ` : '');
          cardEl.innerHTML = userHtml + aiHtml;
        }

        // Measure actual rendered height in DOM and sync to data model
        if (cardEl.offsetHeight > 0) {
          card.height = cardEl.offsetHeight;
        }

        const screenPos = canvasToScreenCoordinates(card.x, card.y);
        cardEl.style.transform = `translate(${screenPos.x}px, ${screenPos.y}px) scale(${engineState.scale})`;
        cardEl.style.transformOrigin = 'top left';
      });
    }

    /* ── 7. Custom Figma-Style Canvas Scrollbars (Right Vertical & Bottom Horizontal) ── */
    function updateCustomCanvasScrollbars() {
      const trackV = getEl('agile-scrollbar-v');
      const thumbV = getEl('agile-scrollbar-thumb-v');
      const trackH = getEl('agile-scrollbar-h');
      const thumbH = getEl('agile-scrollbar-thumb-h');
      if (!trackV || !thumbV || !trackH || !thumbH || !canvasEl) return;

      const rect = canvasEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const vWidth = rect.width / engineState.scale;
      const vHeight = rect.height / engineState.scale;

      const viewLeft = -engineState.translate.x / engineState.scale;
      const viewTop = -engineState.translate.y / engineState.scale;

      let minX = 0;
      let minY = 0;
      let maxX = Math.max(vWidth, 1200);
      let maxY = Math.max(vHeight, 800);

      engineState.chatCards.forEach((card) => {
        const cardEl = document.getElementById(`spatial-card-${card.id}`);
        const cardW = cardEl ? cardEl.offsetWidth : 420;
        const cardH = cardEl ? cardEl.offsetHeight : 180;

        minX = Math.min(minX, card.x);
        minY = Math.min(minY, card.y);
        maxX = Math.max(maxX, card.x + cardW + 100);
        maxY = Math.max(maxY, card.y + cardH + 100);
      });

      engineState.shapes.forEach((shape) => {
        if (shape.type === 'rect') {
          minX = Math.min(minX, shape.x);
          minY = Math.min(minY, shape.y);
          maxX = Math.max(maxX, shape.x + shape.width + 60);
          maxY = Math.max(maxY, shape.y + shape.height + 60);
        } else if (shape.type === 'circle') {
          minX = Math.min(minX, shape.cx - shape.r);
          minY = Math.min(minY, shape.cy - shape.r);
          maxX = Math.max(maxX, shape.cx + shape.r + 60);
          maxY = Math.max(maxY, shape.cy + shape.r + 60);
        } else if (shape.type === 'line') {
          minX = Math.min(minX, shape.x1, shape.x2);
          minY = Math.min(minY, shape.y1, shape.y2);
          maxX = Math.max(maxX, Math.max(shape.x1, shape.x2) + 60);
          maxY = Math.max(maxY, Math.max(shape.y1, shape.y2) + 60);
        } else if (shape.type === 'text') {
          minX = Math.min(minX, shape.x);
          minY = Math.min(minY, shape.y);
          maxX = Math.max(maxX, shape.x + 240);
          maxY = Math.max(maxY, shape.y + 50);
        } else if (shape.type === 'path' && shape.points) {
          shape.points.forEach((pt) => {
            minX = Math.min(minX, pt.x);
            minY = Math.min(minY, pt.y);
            maxX = Math.max(maxX, pt.x + 60);
            maxY = Math.max(maxY, pt.y + 60);
          });
        }
      });

      minX = Math.min(minX, viewLeft);
      minY = Math.min(minY, viewTop);
      maxX = Math.max(maxX, viewLeft + vWidth);
      maxY = Math.max(maxY, viewTop + vHeight);

      // Bound to [-100,000, +100,000] pixel canvas domain
      minX = Math.max(CANVAS_BOUNDS.minX, minX);
      minY = Math.max(CANVAS_BOUNDS.minY, minY);
      maxX = Math.min(CANVAS_BOUNDS.maxX, maxX);
      maxY = Math.min(CANVAS_BOUNDS.maxY, maxY);

      const totalW = maxX - minX;
      const totalH = maxY - minY;

      // 1. Right Vertical Scrollbar
      const trackH_px = trackV.clientHeight;
      const thumbH_px = Math.max(28, Math.min(trackH_px, (vHeight / totalH) * trackH_px));
      const scrollableH = totalH - vHeight;
      const trackScrollableH = trackH_px - thumbH_px;
      const ratioY = scrollableH > 0 ? (viewTop - minY) / scrollableH : 0;
      const thumbTop = Math.max(0, Math.min(trackScrollableH, ratioY * trackScrollableH));

      thumbV.style.height = `${thumbH_px}px`;
      thumbV.style.transform = `translateY(${thumbTop}px)`;

      // 2. Bottom Horizontal Scrollbar
      const trackW_px = trackH.clientWidth;
      const thumbW_px = Math.max(28, Math.min(trackW_px, (vWidth / totalW) * trackW_px));
      const scrollableW = totalW - vWidth;
      const trackScrollableW = trackW_px - thumbW_px;
      const ratioX = scrollableW > 0 ? (viewLeft - minX) / scrollableW : 0;
      const thumbLeft = Math.max(0, Math.min(trackScrollableW, ratioX * trackScrollableW));

      thumbH.style.width = `${thumbW_px}px`;
      thumbH.style.transform = `translateX(${thumbLeft}px)`;

      // Momentarily reveal scrollbars during scroll/pan
      trackV.classList.add('is-scrolling');
      trackH.classList.add('is-scrolling');

      clearTimeout(window._scrollbarFadeTimer);
      window._scrollbarFadeTimer = setTimeout(() => {
        trackV.classList.remove('is-scrolling');
        trackH.classList.remove('is-scrolling');
      }, 1200);
    }

    /* ── Scrollbar Thumb Dragging Event Listeners ── */
    function initScrollbarDragging() {
      const trackV = getEl('agile-scrollbar-v');
      const thumbV = getEl('agile-scrollbar-thumb-v');
      const trackH = getEl('agile-scrollbar-h');
      const thumbH = getEl('agile-scrollbar-thumb-h');
      if (!thumbV || !thumbH || !trackV || !trackH) return;

      let isDraggingV = false;
      let isDraggingH = false;
      let startY = 0;
      let startX = 0;
      let startTranslateY = 0;
      let startTranslateX = 0;

      thumbV.addEventListener('mousedown', (e) => {
        if (sessionState.isCanvasLocked) return;
        e.stopPropagation();
        e.preventDefault();
        isDraggingV = true;
        startY = e.clientY;
        startTranslateY = engineState.translate.y;
        thumbV.classList.add('is-dragging');
        trackV.classList.add('is-active');
      });

      thumbH.addEventListener('mousedown', (e) => {
        if (sessionState.isCanvasLocked) return;
        e.stopPropagation();
        e.preventDefault();
        isDraggingH = true;
        startX = e.clientX;
        startTranslateX = engineState.translate.x;
        thumbH.classList.add('is-dragging');
        trackH.classList.add('is-active');
      });

      window.addEventListener('mousemove', (e) => {
        if (isDraggingV) {
          e.preventDefault();
          const deltaY = e.clientY - startY;
          const rect = canvasEl.getBoundingClientRect();
          const trackH_px = trackV.clientHeight;
          const thumbH_px = thumbV.offsetHeight;
          const trackScrollableH = trackH_px - thumbH_px;

          if (trackScrollableH > 0) {
            const vHeight = rect.height / engineState.scale;
            const totalH = Math.max(vHeight, calculateCanvasYMax() + 200);
            const scrollableH = totalH - vHeight;
            const canvasDeltaY = (deltaY / trackScrollableH) * scrollableH * engineState.scale;
            engineState.translate.y = startTranslateY - canvasDeltaY;
            clampTranslation();
            renderCanvas();
          }
        }

        if (isDraggingH) {
          e.preventDefault();
          const deltaX = e.clientX - startX;
          const rect = canvasEl.getBoundingClientRect();
          const trackW_px = trackH.clientWidth;
          const thumbW_px = thumbH.offsetWidth;
          const trackScrollableW = trackW_px - thumbW_px;

          if (trackScrollableW > 0) {
            const vWidth = rect.width / engineState.scale;
            const totalW = Math.max(vWidth, 1200);
            const scrollableW = totalW - vWidth;
            const canvasDeltaX = (deltaX / trackScrollableW) * scrollableW * engineState.scale;
            engineState.translate.x = startTranslateX - canvasDeltaX;
            clampTranslation();
            renderCanvas();
          }
        }
      });

      window.addEventListener('mouseup', () => {
        if (isDraggingV || isDraggingH) {
          isDraggingV = false;
          isDraggingH = false;
          thumbV.classList.remove('is-dragging');
          thumbH.classList.remove('is-dragging');
          trackV.classList.remove('is-active');
          trackH.classList.remove('is-active');
        }
      });
    }

    initScrollbarDragging();

    /* ── Spacebar Key State Tracking & Canvas Frame Reference ── */
    let isSpacePressed = false;
    const canvasSpaceEl = getEl('agile-canvas-space');

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        isSpacePressed = true;
        if (canvasSpaceEl) canvasSpaceEl.classList.add('is-panning');
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        isSpacePressed = false;
        if (canvasSpaceEl) canvasSpaceEl.classList.remove('is-panning');
      }
    });

    /* ── Mouse Wheel & Trackpad Infinite Pan/Zoom Listener (Works in BOTH Modes) ── */
    if (canvasSpaceEl) {
      canvasSpaceEl.addEventListener('wheel', (e) => {
        if (window._canvasAnimId) {
          cancelAnimationFrame(window._canvasAnimId);
          window._canvasAnimId = null;
        }

        // If scrolling inside questions feed with active vertical scroll room, allow feed to scroll internally
        const target = e.target;
        const feed = target && target.closest ? target.closest('.agile-questions-feed') : null;

        if (sessionState.isCanvasLocked) {
          if (feed) {
            return; // Allow vertical scrolling inside mandatory questions feed
          }
          e.preventDefault();
          return; // Block canvas panning / zooming while locked
        }

        if (feed && !e.ctrlKey && !e.metaKey) {
          const canScrollUp = feed.scrollTop > 0 && e.deltaY < 0;
          const canScrollDown = feed.scrollTop < (feed.scrollHeight - feed.clientHeight - 2) && e.deltaY > 0;
          if (canScrollUp || canScrollDown) {
            return; // Allow vertical chat feed scroll
          }
        }

        e.preventDefault();

        if (e.ctrlKey || e.metaKey) {
          // Pinch Zoom / Ctrl+Wheel Zoom (Enabled in BOTH AI Chat & Whiteboard Modes)
          const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
          const newScale = Math.min(Math.max(0.2, engineState.scale * zoomFactor), 5.0);

          const rect = canvasEl.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          engineState.translate.x = mouseX - (mouseX - engineState.translate.x) * (newScale / engineState.scale);
          engineState.translate.y = mouseY - (mouseY - engineState.translate.y) * (newScale / engineState.scale);
          engineState.scale = newScale;
        } else {
          // 2-Finger Trackpad Scroll / Mouse Wheel Pan (Works in BOTH Chat & Whiteboard modes)
          engineState.translate.x -= e.deltaX;
          engineState.translate.y -= e.deltaY;
        }

        clampTranslation();
        renderCanvas();
      }, { passive: false });
    }

    // Helper: Determine resize cursor when hovering on border/handle of a selected shape
    function getShapeBorderResizeCursor(cx, cy, shape) {
      if (!shape) return 'default';
      const handle = hitTestResizeHandle(cx, cy, shape);
      if (handle) {
        if (handle === 'tl' || handle === 'br') return 'nwse-resize';
        if (handle === 'tr' || handle === 'bl') return 'nesw-resize';
        if (handle === 't' || handle === 'b') return 'ns-resize';
        if (handle === 'l' || handle === 'r') return 'ew-resize';
        if (handle === 'p1' || handle === 'p2') return 'move';
      }
      return 'move';
    }

    /* ── 7. Pointer Events for Drawing, Panning & Shape Normalization ── */
    canvasEl.addEventListener('pointerdown', (e) => {
      if (sessionState.isCanvasLocked) return;

      if (isSpacePressed || e.button === 1 || engineState.tool === 'hand') {
        engineState.isPanning = true;
        engineState.panStart = { x: e.clientX, y: e.clientY };
        if (canvasSpaceEl) canvasSpaceEl.classList.add('is-panning');
        canvasEl.setPointerCapture(e.pointerId);
        return;
      }

      if (engineState.mode !== 'whiteboard') return;

      const canvasCoords = screenToCanvasCoordinates(e.clientX, e.clientY);

      // 1. Check if user clicked border/handle of currently SELECTED shape to start resizing
      if (engineState.selectedShapeIds && engineState.selectedShapeIds.length === 1) {
        const selectedShape = engineState.shapes.find(s => s.id === engineState.selectedShapeIds[0]);
        if (selectedShape) {
          const handle = hitTestResizeHandle(canvasCoords.x, canvasCoords.y, selectedShape);
          if (handle) {
            engineState.isResizingShape = true;
            engineState.resizeHandle = handle;
            engineState.dragStartCanvas = canvasCoords;
            engineState.shapeInitialState = JSON.parse(JSON.stringify(selectedShape));
            canvasEl.setPointerCapture(e.pointerId);
            renderCanvas();
            return;
          }
        }
      }

      // 2. If Move Tool is active:
      if (engineState.tool === 'move') {
        const clickedShape = hitTestShape(canvasCoords.x, canvasCoords.y);
        if (clickedShape) {
          if (!engineState.selectedShapeIds.includes(clickedShape.id)) {
            engineState.selectedShapeIds = [clickedShape.id];
            engineState.selectedShapeId = clickedShape.id;
          }
          engineState.isMovingShape = true;
          engineState.dragStartCanvas = canvasCoords;

          engineState.shapeInitialStates = {};
          engineState.shapes.forEach(s => {
            if (engineState.selectedShapeIds.includes(s.id)) {
              engineState.shapeInitialStates[s.id] = JSON.parse(JSON.stringify(s));
            }
          });
          canvasEl.setPointerCapture(e.pointerId);
          renderCanvas();
          return;
        }

        // Clicked empty canvas with Move Tool -> Start Marquee Area Drag Selection!
        engineState.selectedShapeIds = [];
        engineState.selectedShapeId = null;
        engineState.isSelectingArea = true;
        engineState.selectionStart = canvasCoords;
        engineState.selectionCurrent = canvasCoords;
        canvasEl.setPointerCapture(e.pointerId);
        renderCanvas();
        return;
      }

      // 3. Check if user clicked on the BORDER STROKE of any UNSELECTED shape to select it
      const borderHitShape = hitTestShapeBorder(canvasCoords.x, canvasCoords.y);
      if (borderHitShape) {
        engineState.selectedShapeIds = [borderHitShape.id];
        engineState.selectedShapeId = borderHitShape.id;
        engineState.isMovingShape = true;
        engineState.dragStartCanvas = canvasCoords;
        engineState.shapeInitialStates = {};
        engineState.shapeInitialStates[borderHitShape.id] = JSON.parse(JSON.stringify(borderHitShape));
        canvasEl.setPointerCapture(e.pointerId);
        renderCanvas();
        return;
      }

      // Clicked inside shape interior or empty canvas with drawing tool active -> deselect current shape so user can draw new shape on top!
      engineState.selectedShapeIds = [];
      engineState.selectedShapeId = null;

      // Text Tool Handling (Auto-expanding overlay textarea)
      if (engineState.tool === 'text') {
        spawnAutoExpandingTextNode(canvasCoords.x, canvasCoords.y, e.clientX, e.clientY);
        renderCanvas();
        return;
      }

      // Shape Creation Tools (Rectangle, Circle, Line)
      engineState.isDrawing = true;
      engineState.startPoint = canvasCoords;
      engineState.currentPoint = canvasCoords;
      engineState.freehandPoints = [canvasCoords];
      canvasEl.setPointerCapture(e.pointerId);
      renderCanvas();
    });

    function setCanvasCursor(cStyle) {
      if (canvasEl) canvasEl.style.cursor = cStyle;
      if (overlayEl) overlayEl.style.cursor = cStyle;
      if (canvasSpaceEl) canvasSpaceEl.style.cursor = cStyle;
    }

    canvasEl.addEventListener('pointermove', (e) => {
      if (engineState.isPanning) {
        const dx = e.clientX - engineState.panStart.x;
        const dy = e.clientY - engineState.panStart.y;
        engineState.translate.x += dx;
        engineState.translate.y += dy;
        engineState.panStart = { x: e.clientX, y: e.clientY };
        clampTranslation();
        renderCanvas();
        return;
      }

      const canvasCoords = screenToCanvasCoordinates(e.clientX, e.clientY);

      // Marquee Drag Selection Box Update
      if (engineState.isSelectingArea) {
        engineState.selectionCurrent = canvasCoords;
        renderCanvas();
        return;
      }

      // Dynamic Hover Cursor Updates (Border hover arrow, handle resize arrows, tool cursors)
      if (engineState.mode === 'whiteboard' && !engineState.isDrawing && !engineState.isMovingShape && !engineState.isResizingShape && !engineState.isPanning) {
        let cursorSet = false;
        if (engineState.selectedShapeIds && engineState.selectedShapeIds.length > 0) {
          const selectedShapes = engineState.shapes.filter(s => engineState.selectedShapeIds.includes(s.id));
          if (selectedShapes.length === 1) {
            const selectedShape = selectedShapes[0];
            const isHandleHit = hitTestResizeHandle(canvasCoords.x, canvasCoords.y, selectedShape);
            const isBorderHit = hitTestShapeBorder(canvasCoords.x, canvasCoords.y);
            if (isHandleHit || (isBorderHit && isBorderHit.id === selectedShape.id)) {
              const resizeCursor = getShapeBorderResizeCursor(canvasCoords.x, canvasCoords.y, selectedShape);
              setCanvasCursor(resizeCursor);
              cursorSet = true;
            }
          }
        }

        if (!cursorSet) {
          const borderHit = hitTestShapeBorder(canvasCoords.x, canvasCoords.y);
          if (borderHit) {
            setCanvasCursor('default'); // Arrow icon (same as AI mode)
          } else if (engineState.tool === 'move') {
            const shapeHit = hitTestShape(canvasCoords.x, canvasCoords.y);
            setCanvasCursor(shapeHit ? 'move' : 'default'); // Arrow cursor for Move tool
          } else if (engineState.tool === 'hand') {
            const shapeHit = hitTestShape(canvasCoords.x, canvasCoords.y);
            setCanvasCursor(shapeHit ? 'move' : 'grab');
          } else {
            setCanvasCursor(''); // Fallback to CSS default tool cursor
          }
        }
      }

      // Resizing shape via handle
      if (engineState.isResizingShape && engineState.selectedShapeIds && engineState.selectedShapeIds.length === 1 && engineState.shapeInitialState) {
        const shape = engineState.shapes.find(s => s.id === engineState.selectedShapeIds[0]);
        const init = engineState.shapeInitialState;
        const dx = canvasCoords.x - engineState.dragStartCanvas.x;
        const dy = canvasCoords.y - engineState.dragStartCanvas.y;
        const h = engineState.resizeHandle;

        if (shape) {
          if (shape.type === 'rect') {
            if (h === 'tl') {
              shape.x = init.x + dx;
              shape.y = init.y + dy;
              shape.width = Math.max(10, init.width - dx);
              shape.height = Math.max(10, init.height - dy);
            } else if (h === 'tr') {
              shape.y = init.y + dy;
              shape.width = Math.max(10, init.width + dx);
              shape.height = Math.max(10, init.height - dy);
            } else if (h === 'bl') {
              shape.x = init.x + dx;
              shape.width = Math.max(10, init.width - dx);
              shape.height = Math.max(10, init.height + dy);
            } else if (h === 'br') {
              shape.width = Math.max(10, init.width + dx);
              shape.height = Math.max(10, init.height + dy);
            } else if (h === 't') {
              shape.y = init.y + dy;
              shape.height = Math.max(10, init.height - dy);
            } else if (h === 'b') {
              shape.height = Math.max(10, init.height + dy);
            } else if (h === 'l') {
              shape.x = init.x + dx;
              shape.width = Math.max(10, init.width - dx);
            } else if (h === 'r') {
              shape.width = Math.max(10, init.width + dx);
            }
          } else if (shape.type === 'circle') {
            const dist = Math.hypot(canvasCoords.x - init.cx, canvasCoords.y - init.cy);
            shape.r = Math.max(5, dist);
          } else if (shape.type === 'line') {
            if (h === 'p1') {
              shape.x1 = init.x1 + dx;
              shape.y1 = init.y1 + dy;
            } else if (h === 'p2') {
              shape.x2 = init.x2 + dx;
              shape.y2 = init.y2 + dy;
            }
          } else if (shape.type === 'text') {
            if (h === 'r' || h === 'tr' || h === 'br') {
              shape.width = Math.min(720, Math.max(100, (init.width || 400) + dx));
            } else if (h === 'l' || h === 'tl' || h === 'bl') {
              shape.x = init.x + dx;
              shape.width = Math.min(720, Math.max(100, (init.width || 400) - dx));
            }
          }
        }
        renderCanvas();
        return;
      }

      // Moving shape / shapes
      if (engineState.isMovingShape && engineState.shapeInitialStates) {
        const dx = canvasCoords.x - engineState.dragStartCanvas.x;
        const dy = canvasCoords.y - engineState.dragStartCanvas.y;

        engineState.shapes.forEach(shape => {
          const init = engineState.shapeInitialStates[shape.id];
          if (init) {
            if (shape.type === 'rect' || shape.type === 'text') {
              shape.x = init.x + dx;
              shape.y = init.y + dy;
            } else if (shape.type === 'circle') {
              shape.cx = init.cx + dx;
              shape.cy = init.cy + dy;
            } else if (shape.type === 'line') {
              shape.x1 = init.x1 + dx;
              shape.y1 = init.y1 + dy;
              shape.x2 = init.x2 + dx;
              shape.y2 = init.y2 + dy;
            } else if (shape.type === 'path' && init.points) {
              shape.points = init.points.map(pt => ({ x: pt.x + dx, y: pt.y + dy }));
            }
          }
        });
        renderCanvas();
        return;
      }

      if (!engineState.isDrawing) return;
      engineState.currentPoint = canvasCoords;
      engineState.freehandPoints.push(canvasCoords);
      renderCanvas();
    });

    canvasEl.addEventListener('pointerup', (e) => {
      if (engineState.isPanning) {
        engineState.isPanning = false;
        if (canvasSpaceEl) canvasSpaceEl.classList.remove('is-panning');
        try { canvasEl.releasePointerCapture(e.pointerId); } catch (err) {}
        return;
      }

      // Finish Marquee Drag Area Selection
      if (engineState.isSelectingArea) {
        engineState.isSelectingArea = false;
        if (engineState.selectionStart && engineState.selectionCurrent) {
          const x = Math.min(engineState.selectionStart.x, engineState.selectionCurrent.x);
          const y = Math.min(engineState.selectionStart.y, engineState.selectionCurrent.y);
          const w = Math.abs(engineState.selectionCurrent.x - engineState.selectionStart.x);
          const h = Math.abs(engineState.selectionCurrent.y - engineState.selectionStart.y);

          if (w > 3 || h > 3) {
            const marquee = { x, y, width: w, height: h };
            const matchingShapes = engineState.shapes.filter(s => boundsOverlap(getShapeBounds(s), marquee));
            engineState.selectedShapeIds = matchingShapes.map(s => s.id);
            engineState.selectedShapeId = matchingShapes.length > 0 ? matchingShapes[matchingShapes.length - 1].id : null;
          }
        }
        engineState.selectionStart = null;
        engineState.selectionCurrent = null;
        try { canvasEl.releasePointerCapture(e.pointerId); } catch (err) {}
        renderCanvas();
        return;
      }

      if (engineState.isResizingShape) {
        engineState.isResizingShape = false;
        engineState.resizeHandle = null;
        engineState.shapeInitialState = null;
        try { canvasEl.releasePointerCapture(e.pointerId); } catch (err) {}
        renderCanvas();
        return;
      }

      if (engineState.isMovingShape) {
        engineState.isMovingShape = false;
        engineState.shapeInitialStates = {};
        try { canvasEl.releasePointerCapture(e.pointerId); } catch (err) {}
        renderCanvas();
        return;
      }

      if (!engineState.isDrawing) return;
      engineState.isDrawing = false;
      try { canvasEl.releasePointerCapture(e.pointerId); } catch (err) {}

      // Commit shape to engineState.shapes with corner-anchored logic
      if (engineState.startPoint && engineState.currentPoint) {
        if (engineState.tool === 'rectangle') {
          const x = Math.min(engineState.startPoint.x, engineState.currentPoint.x);
          const y = Math.min(engineState.startPoint.y, engineState.currentPoint.y);
          const width = Math.abs(engineState.currentPoint.x - engineState.startPoint.x);
          const height = Math.abs(engineState.currentPoint.y - engineState.startPoint.y);
          if (width > 4 || height > 4) {
            const newShape = {
              id: Date.now(),
              type: 'rect',
              x, y, width, height,
              color: engineState.color
            };
            engineState.shapes.push(newShape);
            engineState.selectedShapeIds = [newShape.id];
            engineState.selectedShapeId = newShape.id;
          }
        } else if (engineState.tool === 'circle') {
          const x1 = engineState.startPoint.x;
          const y1 = engineState.startPoint.y;
          const x2 = engineState.currentPoint.x;
          const y2 = engineState.currentPoint.y;
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2;
          const rx = Math.abs(x2 - x1) / 2;
          const ry = Math.abs(y2 - y1) / 2;
          const r = Math.max(rx, ry);
          if (r > 4) {
            const newShape = {
              id: Date.now(),
              type: 'circle',
              cx, cy, r,
              color: engineState.color
            };
            engineState.shapes.push(newShape);
            engineState.selectedShapeIds = [newShape.id];
            engineState.selectedShapeId = newShape.id;
          }
        } else if (engineState.tool === 'line') {
          const newShape = {
            id: Date.now(),
            type: 'line',
            x1: engineState.startPoint.x,
            y1: engineState.startPoint.y,
            x2: engineState.currentPoint.x,
            y2: engineState.currentPoint.y,
            color: engineState.color
          };
          engineState.shapes.push(newShape);
          engineState.selectedShapeIds = [newShape.id];
          engineState.selectedShapeId = newShape.id;
        } else if (engineState.freehandPoints.length > 1) {
          const newShape = {
            id: Date.now(),
            type: 'path',
            points: [...engineState.freehandPoints],
            color: engineState.color
          };
          engineState.shapes.push(newShape);
          engineState.selectedShapeIds = [newShape.id];
          engineState.selectedShapeId = newShape.id;
        }
      }

      engineState.startPoint = null;
      engineState.currentPoint = null;
      engineState.freehandPoints = [];
      renderCanvas();
    });

    /* ── 8. Auto-Expanding Text Node Creation ── */
    function spawnAutoExpandingTextNode(canvasX, canvasY, screenX, screenY, existingShape = null) {
      if (!overlayEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const relX = screenX - rect.left;
      const relY = screenY - rect.top;

      const textarea = document.createElement('textarea');
      textarea.className = 'agile-text-node-input';
      textarea.style.left = `${relX}px`;
      textarea.style.top = `${relY}px`;
      textarea.style.width = '400px';
      textarea.placeholder = 'Type text...';

      if (existingShape) {
        textarea.value = existingShape.text || '';
      }

      overlayEl.appendChild(textarea);
      setTimeout(() => {
        textarea.focus();
        if (existingShape) {
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }, 10);

      const autoExpand = () => {
        textarea.style.height = 'auto';
        textarea.style.width = '400px';
        const scrollW = textarea.scrollWidth;
        if (scrollW > 400 && scrollW <= 720) {
          textarea.style.width = `${scrollW + 16}px`;
        } else if (scrollW > 720) {
          textarea.style.width = '720px';
        } else {
          textarea.style.width = '400px';
        }
        textarea.style.height = `${Math.max(40, textarea.scrollHeight)}px`;
      };

      textarea.addEventListener('input', autoExpand);
      autoExpand();

      let committed = false;
      const commitText = () => {
        if (committed) return;
        committed = true;
        const val = textarea.value.trim();
        const currentWidth = parseFloat(textarea.style.width) || 400;
        const finalWidth = Math.min(720, Math.max(400, currentWidth));

        if (val) {
          if (existingShape) {
            existingShape.text = val;
            existingShape.width = finalWidth;
          } else {
            const newShape = {
              id: Date.now(),
              type: 'text',
              x: canvasX,
              y: canvasY,
              text: val,
              color: engineState.color,
              width: finalWidth
            };
            engineState.shapes.push(newShape);
            engineState.selectedShapeId = newShape.id;
          }
        } else if (existingShape) {
          engineState.shapes = engineState.shapes.filter(s => s.id !== existingShape.id);
          if (engineState.selectedShapeId === existingShape.id) {
            engineState.selectedShapeId = null;
          }
        }

        if (textarea.parentElement) {
          textarea.parentElement.removeChild(textarea);
        }
        renderCanvas();
      };

      textarea.addEventListener('blur', commitText);
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          commitText();
        }
      });
    }

    /* ── Double-Click Handler for Text Re-Editing ── */
    canvasEl.addEventListener('dblclick', (e) => {
      if (engineState.mode !== 'whiteboard') return;
      const canvasCoords = screenToCanvasCoordinates(e.clientX, e.clientY);
      const clickedShape = hitTestShape(canvasCoords.x, canvasCoords.y);
      if (clickedShape && clickedShape.type === 'text') {
        const screenPos = canvasToScreenCoordinates(clickedShape.x, clickedShape.y);
        const rect = canvasEl.getBoundingClientRect();
        spawnAutoExpandingTextNode(clickedShape.x, clickedShape.y, screenPos.x + rect.left, screenPos.y + rect.top, clickedShape);
      }
    });

    /* ── Keyboard Shortcuts: Delete selected shape & Escape deselect ── */
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && engineState.selectedShapeId) {
        engineState.shapes = engineState.shapes.filter(s => s.id !== engineState.selectedShapeId);
        engineState.selectedShapeId = null;
        renderCanvas();
      } else if (e.key === 'Escape' && engineState.selectedShapeId) {
        engineState.selectedShapeId = null;
        renderCanvas();
      }
    });

    /* ── 9. Toolbar Mode Switcher & Tools Controller ── */
    function setMode(newMode) {
      engineState.mode = newMode;
      const canvasSpace = getEl('agile-canvas-space');

      if (newMode === 'whiteboard') {
        barEl.classList.remove('mode-chat');
        barEl.classList.add('mode-whiteboard');
        scribbleBtn.classList.add('active-pill');
        rabbitBtn.classList.remove('active-pill');
        sectionChat.style.display = 'none';
        sectionWhiteboard.style.display = 'flex';
        canvasEl.classList.remove('mode-chat-active');
        if (canvasSpace) {
          canvasSpace.classList.add('mode-whiteboard-active');
          canvasSpace.setAttribute('data-tool', 'text');
        }

        // Default preselected tool in Whiteboard mode is Text tool
        engineState.tool = 'text';
        toolBtns.forEach((b) => b && b.classList.remove('agile-tool-badge--active'));
        const textBtn = getEl('tool-btn-text');
        if (textBtn) textBtn.classList.add('agile-tool-badge--active');

      } else {
        // Switching to AI Mode: RESET ZOOM scale to default 1.0
        engineState.scale = 1.0;

        barEl.classList.remove('mode-whiteboard');
        barEl.classList.add('mode-chat');
        rabbitBtn.classList.add('active-pill');
        scribbleBtn.classList.remove('active-pill');
        sectionWhiteboard.style.display = 'none';
        sectionChat.style.display = 'flex';
        canvasEl.classList.add('mode-chat-active');
        if (canvasSpace) {
          canvasSpace.classList.remove('mode-whiteboard-active');
          canvasSpace.removeAttribute('data-tool');
        }

        // When switching from Whiteboard mode to AI Chat mode, target the end where new prompt chats appear
        // and keep 100px clearance space from the bottom of the canvas frame for clear visibility.
        const rect = canvasEl.getBoundingClientRect();
        const currentYMax = calculateCanvasYMax();
        if (rect && rect.height > 0 && currentYMax > 100) {
          const targetTy = rect.height - 100 - currentYMax;
          if (currentYMax > (rect.height - 100)) {
            engineState.translate.y = targetTy;
          } else {
            engineState.translate.y = 0;
          }
        }
      }

      resizeCanvasBuffer();
      renderCanvas();
    }

    if (scribbleBtn) {
      scribbleBtn.addEventListener('click', () => {
        if (engineState.mode !== 'whiteboard') {
          setMode('whiteboard');
        }
      });
    }

    if (rabbitBtn) {
      rabbitBtn.addEventListener('click', () => setMode('chat'));
    }

    // Tools Selection Buttons
    const toolBtns = [
      getEl('tool-btn-move'),
      getEl('tool-btn-palm'),
      getEl('tool-btn-text'),
      getEl('tool-btn-rect'),
      getEl('tool-btn-circle'),
      getEl('tool-btn-line')
    ];

    toolBtns.forEach((btn) => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (engineState.mode !== 'whiteboard') {
          setMode('whiteboard');
        }
        toolBtns.forEach((b) => b && b.classList.remove('agile-tool-badge--active'));
        btn.classList.add('agile-tool-badge--active');
        const selectedTool = btn.getAttribute('data-tool') || 'move';
        engineState.tool = selectedTool;
        if (canvasSpaceEl) canvasSpaceEl.setAttribute('data-tool', selectedTool);
      });
    });

    // Color Selection Buttons
    const colorBtns = [
      getEl('color-btn-black'),
      getEl('color-btn-red'),
      getEl('color-btn-blue')
    ];

    colorBtns.forEach((btn) => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        colorBtns.forEach((b) => b && b.classList.remove('agile-color-badge--active'));
        btn.classList.add('agile-color-badge--active');
        engineState.color = btn.getAttribute('data-color') || '#111111';
      });
    });

    /* ── 9b. Keyboard Shortcuts for Drawing Tools & Colors ── */
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (['INPUT', 'TEXTAREA'].includes(activeEl.tagName) || activeEl.isContentEditable)) {
        return; // Ignore shortcuts when typing in input or text fields
      }

      const key = e.key ? e.key.toLowerCase() : '';

      // Drawing Tool Shortcuts
      if (key === 'v') {
        const btn = getEl('tool-btn-move');
        if (btn) btn.click();
      } else if (key === 'p') {
        const btn = getEl('tool-btn-palm');
        if (btn) btn.click();
      } else if (key === 't') {
        const btn = getEl('tool-btn-text');
        if (btn) btn.click();
      } else if (key === 'r') {
        const btn = getEl('tool-btn-rect');
        if (btn) btn.click();
      } else if (key === 'o') {
        const btn = getEl('tool-btn-circle');
        if (btn) btn.click();
      } else if (key === 'l') {
        const btn = getEl('tool-btn-line');
        if (btn) btn.click();
      }

      // Color Selection Shortcuts
      if (key === '1') {
        const btn = getEl('color-btn-black');
        if (btn) btn.click();
      } else if (key === '2') {
        const btn = getEl('color-btn-red');
        if (btn) btn.click();
      } else if (key === '3') {
        const btn = getEl('color-btn-blue');
        if (btn) btn.click();
      }
    });

    /* ── 10. Spatial AI Prompt Submission at (X_anchor, Y_max + offset) ── */
    function handlePromptSubmission() {
      if (!promptInput) return;
      const text = promptInput.value.trim();
      if (!text) return;

      promptInput.value = '';
      const msgId = Date.now();
      const timeStr = getFormattedISTTime();

      // 1. Render User Message + Gemini-Style 36px Bunny Loading Indicator in HTML Feed
      const feed = getEl('agile-questions-feed');
      if (feed) {
        const msgPair = document.createElement('div');
        msgPair.className = 'agile-chat-pair';
        msgPair.style.display = 'flex';
        msgPair.style.flexDirection = 'column';
        msgPair.style.gap = '12px';
        msgPair.innerHTML = `
          <div class="agile-chat-msg agile-chat-msg--user" style="align-self: flex-end;">
            <div class="agile-chat-bubble">${text}</div>
            <div class="agile-chat-timestamp">${timeStr}</div>
          </div>
          <div class="agile-chat-msg agile-chat-msg--ai" id="agile-ai-msg-${msgId}" style="align-self: flex-start;">
            <div class="agile-chat-ai-loading">
              <div class="agile-bunny-loader agile-bunny-loader--chat">
                <img src="assets/hidden_Bunny_SVG.svg" class="agile-bunny-loader__img" alt="AI thinking..." />
              </div>
            </div>
          </div>
        `;
        feed.appendChild(msgPair);
        feed.scrollTop = feed.scrollHeight;
      }

      // 2. Spatial Anchor Chat Column Lane on 2D Infinite Canvas with Loading State
      const X_anchor = 100;

      // Force sync & measure DOM heights of all existing cards BEFORE calculating Y_spawn
      syncSpatialChatOverlayPosition();
      const currentYMax = calculateCanvasYMax();
      const Y_spawn = currentYMax + 40; // 40px vertical clearance gap between cards

      const newCard = {
        id: msgId,
        x: X_anchor,
        y: Y_spawn,
        userText: text,
        aiText: '',
        isLoading: true,
        time: timeStr
      };

      engineState.chatCards.push(newCard);
      renderCanvas(); // Synchronously render new card in DOM with loading bunny

      // Immediately measure newly created card's actual DOM height
      const newCardEl = document.getElementById(`spatial-card-${newCard.id}`);
      const actualCardH = newCardEl && newCardEl.offsetHeight > 0 ? newCardEl.offsetHeight : 180;
      newCard.height = actualCardH;

      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      resizeCanvasBuffer();

      // Automatically focus & smoothly center the canvas viewport on the newly submitted prompt card
      const rect = canvasEl.getBoundingClientRect();
      const cardW = newCardEl ? newCardEl.offsetWidth : 420;
      const cardH = actualCardH;

      const cardCenterX = newCard.x + (cardW / 2);
      const cardCenterY = newCard.y + (cardH / 2);

      if (rect && rect.width > 0 && rect.height > 0) {
        const targetTx = (rect.width / 2) - (cardCenterX * engineState.scale);
        const targetTy = (rect.height / 2) - (cardCenterY * engineState.scale);
        animateCanvasTranslationTo(targetTx, targetTy, 450);
      }

      // 3. Fetch AI Response from API & Instantly Replace 36px Bunny Loader with Response
      (async () => {
        let aiResultText = 'Here is an AI response generated for your query! You can ask unlimited questions and scroll vertically anytime. Toggle to Scribble mode to annotate on the shared 2D canvas space.';
        const fetchStartTime = Date.now();

        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationHistory: [{ role: 'user', content: text }],
              topic: sessionState.answers.category || 'design-systems'
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.response) {
              if (typeof data.response === 'string') aiResultText = data.response;
              else if (data.response.text) aiResultText = data.response.text;
              else if (data.response.question) aiResultText = data.response.question;
            }
          }
        } catch (e) {
          console.log('AI Chat Fetching fallback:', e);
        }

        // Ensure loader is visible for at least 800ms so peekaboo animation plays smoothly before instant disappearance
        const elapsed = Date.now() - fetchStartTime;
        if (elapsed < 800) {
          await new Promise(r => setTimeout(r, 800 - elapsed));
        }

        // INSTANT DISAPPEARANCE of 36px SVG Bunny Loader -> Render AI Text Message
        const aiMsgContainer = getEl(`agile-ai-msg-${msgId}`);
        if (aiMsgContainer) {
          aiMsgContainer.innerHTML = `
            <div class="agile-chat-prompt-body">${aiResultText}</div>
            <div class="agile-chat-timestamp">${getFormattedISTTime()}</div>
          `;
          if (feed) feed.scrollTop = feed.scrollHeight;
        }

        newCard.aiText = aiResultText;
        newCard.isLoading = false;
        renderCanvas();
      })();
    }

    /* ── Smooth Canvas Viewport Translation Animation (Ease-Out Cubic) ── */
    function animateCanvasTranslationTo(targetTx, targetTy, duration = 450) {
      const startTx = engineState.translate.x;
      const startTy = engineState.translate.y;
      const startTime = performance.now();

      if (window._canvasAnimId) {
        cancelAnimationFrame(window._canvasAnimId);
      }

      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-Out Cubic

        engineState.translate.x = startTx + (targetTx - startTx) * easeProgress;
        engineState.translate.y = startTy + (targetTy - startTy) * easeProgress;

        clampTranslation();
        renderCanvas();

        if (progress < 1) {
          window._canvasAnimId = requestAnimationFrame(step);
        } else {
          window._canvasAnimId = null;
        }
      }

      window._canvasAnimId = requestAnimationFrame(step);
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', handlePromptSubmission);
    }

    if (promptInput) {
      promptInput.addEventListener('focus', () => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        resizeCanvasBuffer();
      });

      promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handlePromptSubmission();
        }
      });
    }

    renderCanvas();
  }

})();

