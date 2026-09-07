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
    this.waveformHistory = []; // Array of normalized amplitude values (0.0 - 1.0)
    this.maxBars = 100;
    this.rulerOffset = 0; // Pixels offset for scrolling timeline ruler

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

    // Pre-fill history buffer with minimal baseline heights
    for (let i = 0; i < this.maxBars; i++) {
      this.waveformHistory.push(0.05 + Math.sin(i * 0.2) * 0.02);
    }

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
    const draw = () => {
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

      // Draw Waveform Bars (moving right to left)
      const barWidth = 3 * dpr;
      const barGap = 4 * dpr;
      const totalBarSpace = barWidth + barGap;
      const numVisibleBars = Math.floor(width / totalBarSpace);

      // Fetch audio sample if actively recording
      if (this.state === 'recording') {
        const amplitude = this.getAudioAmplitude();
        this.waveformHistory.push(amplitude);
        if (this.waveformHistory.length > 200) {
          this.waveformHistory.shift();
        }
        this.rulerOffset += 0.4 * dpr;
      }

      // Draw bars right-to-left starting from right edge
      const rightX = width - (8 * dpr);
      const historyLen = this.waveformHistory.length;

      for (let i = 0; i < numVisibleBars; i++) {
        const historyIdx = historyLen - 1 - i;
        if (historyIdx < 0) break;

        const amp = this.waveformHistory[historyIdx] || 0.04;
        const barH = Math.max(4 * dpr, amp * (waveformAreaHeight * 0.75));

        const x = rightX - (i * totalBarSpace);

        // Draw vertical bar centered around centerY
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.fillRect(x - barWidth, centerY - (barH / 2), barWidth, barH);
      }

      // Draw Bottom Timeline Ruler (Ticks & Labels)
      this.drawTimelineRuler(width, height, waveformAreaHeight, rulerHeight, dpr);

      this.animationFrameId = requestAnimationFrame(draw);
    };

    draw();
  }

  /**
   * Draw scrolling timeline ruler at bottom of canvas
   */
  drawTimelineRuler(width, height, waveformAreaHeight, rulerHeight, dpr) {
    const ctx = this.ctx;
    const rulerY = waveformAreaHeight;

    // Top border of ruler
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, rulerY);
    ctx.lineTo(width, rulerY);
    ctx.stroke();

    // Ruler Ticks
    const tickInterval = 50 * dpr;
    const startX = (width - (this.rulerOffset % tickInterval));

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = `${11 * dpr}px 'JetBrains Mono', 'Inter', monospace`;
    ctx.textAlign = 'center';

    let secCounter = Math.floor(this.elapsedSeconds);

    for (let x = startX; x > -tickInterval; x -= tickInterval) {
      // Small tick mark
      ctx.fillRect(x, rulerY, 1 * dpr, 6 * dpr);

      // Label timestamp every 100px
      const displaySec = Math.max(0, secCounter % 60);
      const formattedSec = displaySec < 10 ? `00:0${displaySec}` : `00:${displaySec}`;
      ctx.fillText(formattedSec, x, rulerY + (20 * dpr));

      secCounter = Math.max(0, secCounter - 2);
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
    this.dom.presetsGrid.classList.add('is-hidden');
    this.dom.extendersRow.classList.remove('is-hidden');
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
    this.remainingSeconds = this.selectedPresetMinutes * 60;

    this.dom.outerRing.classList.remove('is-rotating');
    this.dom.presetsGrid.classList.remove('is-hidden');
    this.dom.extendersRow.classList.add('is-hidden');
    this.dom.saveBtn.classList.remove('is-visible');

    this.updateTimerDisplay();
  }
}
