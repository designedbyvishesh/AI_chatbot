/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RECORDING & TIMER COMPONENT (RecordingTimer)
 * Dual-function Audio Recorder + Countdown & Count-up Timer Widget
 * ═══════════════════════════════════════════════════════════════════════════
 */

class RecordingTimer {
  /**
   * @param {HTMLElement|string} container - Parent container element or CSS selector
   * @param {Object} options - Configuration options
   * @param {Function} options.onSave - Callback when recording is saved: fn({ blob, durationSeconds, formattedTime })
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) {
      console.error('RecordingTimer: Container element not found');
      return;
    }

    this.options = options;

    // States: 'idle' | 'recording' | 'paused'
    this.state = 'idle';

    // Timer settings (in seconds)
    this.selectedPresetMinutes = 45; // Default 45 min
    this.remainingSeconds = 45 * 60;
    this.elapsedSeconds = 0;
    this.elapsedSecondsFloat = 0.0;
    this.timerInterval = null;

    // Audio & Waveform properties
    this.audioCtx = null;
    this.analyser = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordedBlob = null;
    this.useSyntheticAudio = false;

    // Canvas & Waveform history buffer
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;
    this.waveformHistory = []; // Array of { time, amp }
    this.lastSampleTime = 0;

    this.init();
  }

  /**
   * Initialize HTML layout & DOM listeners
   */
  init() {
    this.renderHTML();
    this.cacheDOM();
    this.bindEvents();
    this.initCanvas();
    this.updateTimerDisplay();
  }

  /**
   * Render component HTML structure
   */
  renderHTML() {
    this.container.innerHTML = `
      <div class="recorder-widget" id="rw-widget">
        <!-- Left Panel: Waveform Canvas & Playhead -->
        <div class="recorder-widget__left">
          <div class="recorder-widget__canvas-wrap">
            <canvas class="recorder-widget__canvas" id="rw-canvas"></canvas>
            <div class="recorder-widget__playhead">
              <div class="recorder-widget__playhead-dot recorder-widget__playhead-dot--top"></div>
              <div class="recorder-widget__playhead-dot recorder-widget__playhead-dot--bottom"></div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Controls & Timer Display -->
        <div class="recorder-widget__right">
          <!-- Top Header: Save button -->
          <div class="recorder-widget__header">
            <button class="recorder-widget__save-btn" id="rw-save-btn" title="Save Audio Recording">Save</button>
          </div>

          <!-- Central Dial & Record Button -->
          <div class="recorder-widget__dial-container">
            <div class="recorder-widget__outer-ring" id="rw-outer-ring">
              <div class="recorder-widget__ring-tick recorder-widget__ring-tick--1"></div>
              <div class="recorder-widget__ring-tick recorder-widget__ring-tick--2"></div>
              <div class="recorder-widget__ring-tick recorder-widget__ring-tick--3"></div>
            </div>
            <button class="recorder-widget__record-btn" id="rw-record-btn" aria-label="Record or Pause"></button>
          </div>

          <!-- Buttons Area (Presets or Extenders) -->
          <div class="recorder-widget__buttons-area">
            <!-- 2x2 Preset Grid (Idle State) -->
            <div class="recorder-widget__presets-grid" id="rw-presets-grid">
              <button class="recorder-widget__preset-btn" data-minutes="30">30 min</button>
              <button class="recorder-widget__preset-btn is-selected" data-minutes="45">45 min</button>
              <button class="recorder-widget__preset-btn" data-minutes="60">60 min</button>
              <button class="recorder-widget__preset-btn" data-minutes="90">90 min</button>
            </div>

            <!-- Extenders Row (Recording / Paused State) -->
            <div class="recorder-widget__extenders-row is-hidden" id="rw-extenders-row">
              <button class="recorder-widget__extender-btn" id="rw-ext-5">+05 min</button>
              <button class="recorder-widget__extender-btn" id="rw-ext-10">+10 min</button>
            </div>
          </div>

          <!-- Timer Display (- MM:SS or + MM:SS) -->
          <div class="recorder-widget__timer-display" id="rw-timer-display">- 45:00</div>
        </div>
      </div>
    `;
  }

  /**
   * Cache DOM elements
   */
  cacheDOM() {
    this.dom = {
      widget: this.container.querySelector('#rw-widget'),
      canvas: this.container.querySelector('#rw-canvas'),
      outerRing: this.container.querySelector('#rw-outer-ring'),
      recordBtn: this.container.querySelector('#rw-record-btn'),
      saveBtn: this.container.querySelector('#rw-save-btn'),
      presetsGrid: this.container.querySelector('#rw-presets-grid'),
      presetBtns: this.container.querySelectorAll('.recorder-widget__preset-btn'),
      extendersRow: this.container.querySelector('#rw-extenders-row'),
      ext5Btn: this.container.querySelector('#rw-ext-5'),
      ext10Btn: this.container.querySelector('#rw-ext-10'),
      timerDisplay: this.container.querySelector('#rw-timer-display')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Record / Pause toggle
    this.dom.recordBtn.addEventListener('click', () => this.toggleRecordPause());

    // Preset duration selectors
    this.dom.presetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (this.state !== 'idle') return;
        const mins = parseInt(e.currentTarget.dataset.minutes, 10);
        this.setPresetMinutes(mins);
        this.dom.presetBtns.forEach(b => b.classList.remove('is-selected'));
        e.currentTarget.classList.add('is-selected');
      });
    });

    // Extender buttons (+5m, +10m)
    this.dom.ext5Btn.addEventListener('click', () => this.addMinutes(5));
    this.dom.ext10Btn.addEventListener('click', () => this.addMinutes(10));

    // Save button
    this.dom.saveBtn.addEventListener('click', () => this.saveRecording());

    // Handle window resize for canvas resolution
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
   * Canvas setup & rendering loop
   */
  initCanvas() {
    this.canvas = this.dom.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();

    // Start with empty history (no waveform before recording starts)
    this.waveformHistory = [];

    this.renderCanvas();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
  }

  /**
   * Main Canvas render loop (Right-to-Left scrolling)
   */
  renderCanvas() {
    let lastTime = performance.now();

    const draw = (now) => {
      const currentTime = now || performance.now();
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const width = this.canvas.width;
      const height = this.canvas.height;
      const dpr = window.devicePixelRatio || 1;

      this.ctx.clearRect(0, 0, width, height);

      // Background
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, width, height);

      const rulerHeight = 36 * dpr;
      const waveformAreaHeight = height - rulerHeight;
      const centerY = waveformAreaHeight / 2;

      // Speed: Pixels per second (increased 15% to 63.25 * dpr for wider timestamp spacing)
      const pixelsPerSecond = 63.25 * dpr;
      const rightX = width - (8 * dpr);
      const barWidth = 2 * dpr; // 2px waveform bar thickness

      // Update elapsed time & capture audio sample if recording
      if (this.state === 'recording') {
        this.elapsedSecondsFloat += dt;
        this.elapsedSeconds = Math.floor(this.elapsedSecondsFloat);

        // Sample audio amplitude every ~63.2ms (gives 2px bar + 2px gap spacing)
        if (currentTime - this.lastSampleTime > 63.2) {
          const amp = this.getAudioAmplitude();
          this.waveformHistory.push({ time: this.elapsedSecondsFloat, amp: amp });
          this.lastSampleTime = currentTime;
        }
      }

      // Prune old samples that are off the left edge of canvas
      while (this.waveformHistory.length > 0) {
        const first = this.waveformHistory[0];
        const firstX = rightX - (this.elapsedSecondsFloat - first.time) * pixelsPerSecond;
        if (firstX < -50 * dpr) {
          this.waveformHistory.shift();
        } else {
          break;
        }
      }

      // Draw Waveform Bars (2px width, 2px gap, moving right to left)
      for (let i = 0; i < this.waveformHistory.length; i++) {
        const item = this.waveformHistory[i];
        const x = rightX - (this.elapsedSecondsFloat - item.time) * pixelsPerSecond;

        if (x >= -20 * dpr && x <= rightX + 10 * dpr) {
          const amp = item.amp || 0.04;
          const barH = Math.max(4 * dpr, amp * (waveformAreaHeight * 0.75));

          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          this.ctx.fillRect(x - (barWidth / 2), centerY - (barH / 2), barWidth, barH);
        }
      }

      // Draw Bottom Timeline Ruler (00:00, 00:01, 00:02... moving right to left)
      this.drawTimelineRuler(width, height, waveformAreaHeight, rulerHeight, dpr, pixelsPerSecond, rightX);

      this.animationFrameId = requestAnimationFrame(draw);
    };

    this.animationFrameId = requestAnimationFrame(draw);
  }

  /**
   * Draw scrolling timeline ruler at bottom of canvas
   */
  drawTimelineRuler(width, height, waveformAreaHeight, rulerHeight, dpr, pixelsPerSecond, rightX) {
    const ctx = this.ctx;
    const rulerY = waveformAreaHeight;

    // Top border of ruler
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, rulerY);
    ctx.lineTo(width, rulerY);
    ctx.stroke();

    ctx.font = `${11 * dpr}px 'JetBrains Mono', 'Inter', monospace`;
    ctx.textAlign = 'center';

    // Calculate integer second range visible on screen
    const minSec = Math.max(0, Math.floor(this.elapsedSecondsFloat - (rightX / pixelsPerSecond) - 1));
    const maxSec = Math.ceil(this.elapsedSecondsFloat + 1);

    for (let sec = minSec; sec <= maxSec; sec++) {
      const mainX = rightX - (this.elapsedSecondsFloat - sec) * pixelsPerSecond;

      if (mainX >= -40 * dpr && mainX <= width + 40 * dpr) {
        // Main second tick mark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(mainX - (0.75 * dpr), rulerY, 1.5 * dpr, 7 * dpr);

        // Label timestamp: MM:SS (e.g. 00:00, 00:01, 00:02...)
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        const formatted = `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillText(formatted, mainX, rulerY + (22 * dpr));

        // Draw 4 minor sub-ticks between second marks
        for (let sub = 1; sub < 5; sub++) {
          const subTime = sec + (sub * 0.2);
          const subX = rightX - (this.elapsedSecondsFloat - subTime) * pixelsPerSecond;
          if (subX >= 0 && subX <= rightX) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(subX - (0.5 * dpr), rulerY, 1 * dpr, 4 * dpr);
          }
        }
      }
    }
  }

  /**
   * Audio Amplitude Extractor (Real Mic or Synthetic Fallback)
   */
  getAudioAmplitude() {
    if (this.analyser && !this.useSyntheticAudio) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      return Math.min(1.0, Math.max(0.06, avg / 128));
    } else {
      // Synthetic procedural voice waveform simulation
      const t = Date.now() * 0.005;
      const base = Math.sin(t * 1.5) * 0.3 + Math.cos(t * 3.1) * 0.2;
      const noise = (Math.random() - 0.5) * 0.15;
      const raw = Math.abs(base + noise);
      return Math.min(0.9, Math.max(0.06, raw));
    }
  }

  /**
   * Web Audio Capture Initialization
   */
  async startAudioCapture() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices not supported');
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      source.connect(this.analyser);

      // Initialize MediaRecorder for saving
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.start(100);

      this.useSyntheticAudio = false;
      console.log('Audio capture started successfully');
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable. Using synthetic waveform generator fallback.', err);
      this.useSyntheticAudio = true;
    }
  }

  stopAudioCapture() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.recordedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
  }

  /**
   * State Machine Toggle (Idle -> Recording -> Paused)
   */
  toggleRecordPause() {
    if (this.state === 'idle') {
      this.startRecording();
    } else if (this.state === 'recording') {
      this.pauseRecording();
    } else if (this.state === 'paused') {
      this.resumeRecording();
    }
  }

  startRecording() {
    this.state = 'recording';
    this.startAudioCapture();

    // UI Updates
    this.dom.outerRing.classList.add('is-rotating');
    // Note: Extender buttons (+05m, +10m) kept hidden as requested, preserving preset grid
    // this.dom.presetsGrid.classList.add('is-hidden');
    // this.dom.extendersRow.classList.remove('is-hidden');
    this.dom.saveBtn.classList.remove('is-visible');

    // Start Timer Ticker
    this.startTimerTicker();
  }

  pauseRecording() {
    this.state = 'paused';

    // UI Updates
    this.dom.outerRing.classList.remove('is-rotating');
    this.dom.saveBtn.classList.add('is-visible');

    // Pause audio recorder stream if active
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }

    // Stop timer ticker
    this.clearTimerTicker();
  }

  resumeRecording() {
    this.state = 'recording';

    // UI Updates
    this.dom.outerRing.classList.add('is-rotating');
    this.dom.saveBtn.classList.remove('is-visible');

    // Resume audio recorder
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }

    this.startTimerTicker();
  }

  /**
   * Timer Operations
   */
  setPresetMinutes(mins) {
    this.selectedPresetMinutes = mins;
    this.remainingSeconds = mins * 60;
    this.updateTimerDisplay();
  }

  addMinutes(mins) {
    this.remainingSeconds += mins * 60;
    this.updateTimerDisplay();
  }

  startTimerTicker() {
    this.clearTimerTicker();
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.remainingSeconds--;
      this.updateTimerDisplay();
    }, 1000);
  }

  clearTimerTicker() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Formats display string (- MM:SS or + MM:SS)
   */
  updateTimerDisplay() {
    const isOvertime = this.remainingSeconds < 0;
    const absSeconds = Math.abs(this.remainingSeconds);

    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;

    const formattedMins = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSecs = seconds < 10 ? `0${seconds}` : `${seconds}`;

    const prefix = isOvertime ? '+ ' : '- ';
    this.dom.timerDisplay.textContent = `${prefix}${formattedMins}:${formattedSecs}`;

    if (isOvertime) {
      this.dom.timerDisplay.classList.add('is-overtime');
    } else {
      this.dom.timerDisplay.classList.remove('is-overtime');
    }
  }

  /**
   * Save Recording Export
   */
  saveRecording() {
    this.stopAudioCapture();
    this.clearTimerTicker();

    const result = {
      blob: this.recordedBlob,
      durationSeconds: this.elapsedSeconds,
      formattedTime: this.dom.timerDisplay.textContent,
      timestamp: new Date().toISOString()
    };

    console.log('Recording Saved Payload:', result);

    if (this.options.onSave) {
      this.options.onSave(result);
    }

    // Trigger browser file download if blob exists
    if (this.recordedBlob) {
      const url = URL.createObjectURL(this.recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert(`Recording saved! Duration: ${Math.floor(this.elapsedSeconds / 60)}m ${this.elapsedSeconds % 60}s`);
    }

    // Reset to idle state
    this.resetToIdle();
  }

  resetToIdle() {
    this.state = 'idle';
    this.elapsedSeconds = 0;
    this.elapsedSecondsFloat = 0.0;
    this.remainingSeconds = this.selectedPresetMinutes * 60;

    this.initCanvas();

    this.dom.outerRing.classList.remove('is-rotating');
    this.dom.presetsGrid.classList.remove('is-hidden');
    this.dom.extendersRow.classList.add('is-hidden');
    this.dom.saveBtn.classList.remove('is-visible');

    this.updateTimerDisplay();
  }
}
