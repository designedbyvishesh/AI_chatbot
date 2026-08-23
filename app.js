/* ═══════════════════════════════════════════════
   Equity Trading Chat — App Logic
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTaskInteractions();
  initTextarea();
  initChipInteractions();
  initMicButton();
  initSidebar();
  initDropdownMenu();
  initSidebarTabs();
  initDropdownToggles();
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

/* ─── Auto-growing textarea ─── */
function initTextarea() {
  const textarea = document.getElementById('screener-input');
  if (!textarea) return;

  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const value = textarea.value.trim();
      if (value) {
        console.log('Sending:', value);
        const inputBar = document.getElementById('input-bar');
        inputBar.style.borderColor = 'rgba(76, 175, 80, 0.5)';
        setTimeout(() => {
          inputBar.style.borderColor = '';
        }, 600);
        textarea.value = '';
        textarea.style.height = 'auto';
      }
    }
  });
}

/* ─── Chip click feedback ─── */
function initChipInteractions() {
  const chips = document.querySelectorAll('.chip');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const label = chip.querySelector('.chip__label');
      if (label) {
        console.log('Suggestion selected:', label.textContent);
      }

      chip.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.3)';
      setTimeout(() => {
        chip.style.boxShadow = '';
      }, 400);
    });
  });
}

/* ─── Mic button toggle ─── */
function initMicButton() {
  const micBtn = document.getElementById('mic-btn');
  if (!micBtn) return;

  let isListening = false;

  micBtn.addEventListener('click', () => {
    isListening = !isListening;
    const icon = micBtn.querySelector('.material-symbols-outlined');

    if (isListening) {
      icon.textContent = 'mic';
      micBtn.style.color = '#4caf50';
      micBtn.style.animation = 'micPulse 1.5s ease-in-out infinite';
    } else {
      icon.textContent = 'mic';
      micBtn.style.color = '';
      micBtn.style.animation = '';
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
    // Close dropdown if open
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

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      closeDropdown();
    }
  });

  // Export for use by dropdown
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
      // Close sidebar if open
      if (window._closeSidebar) window._closeSidebar();
      dropdown.classList.add('dropdown-menu--open');
    }
  });

  // Close when clicking outside
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

/* ─── Dropdown Toggle Switches ─── */
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
    });
  });
}
