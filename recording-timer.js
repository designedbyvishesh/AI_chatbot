/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RECORDING & TIMER COMPONENT (RecordingTimer)
 * Dual-function Audio Recorder + Countdown & Count-up Timer Widget
 * ═══════════════════════════════════════════════════════════════════════════
 */

class RecordingTimer {
  /**
   * @param {HTMLElement|string} container - Parent container element or CSS selector
   * @param {Object} options - Configuration options ({ onSave: fn })
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) {
      console.error('RecordingTimer: Container element not found');
      return;
    }

    this.options = options;

    // States: 'idle' | 'recording' | 'paused' | 'saved'
    this.state = 'idle';
    this.isUnlocked = false;
    this.isHistoryMode = false;

    // Timer counters (in seconds)
    this.selectedPresetMinutes = 0;
    this.remainingSeconds = 0;
    this.elapsedSeconds = 0;
    this.elapsedSecondsFloat = 0.0;
    this.timerInterval = null;

    // Audio & Waveform data
    this.audioCtx = null;
    this.analyser = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordedBlob = null;
    this.useSyntheticAudio = false;

    // Canvas animation
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;
    this.waveformHistory = [];
    this.lastSampleTime = 0;

    this.init();
  }

  /**
   * Initialize HTML layout & listeners
   */
  init() {
    this.renderHTML();
    this.cacheDOM();
    this.bindEvents();
    this.initCanvas();
    this.updateTimerDisplay();

    if (this.dom && this.dom.recordBtn) {
      this.dom.recordBtn.classList.add('is-disabled');
    }
  }

  /**
   * Render clean HTML widget markup
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
          <div class="recorder-widget__header">
            <button class="recorder-widget__save-btn" id="rw-save-btn" title="Save Audio Recording">Save</button>
          </div>

          <div class="recorder-widget__dial-container">
            <div class="recorder-widget__outer-ring" id="rw-outer-ring">
              <div class="recorder-widget__ring-tick recorder-widget__ring-tick--1"></div>
              <div class="recorder-widget__ring-tick recorder-widget__ring-tick--2"></div>
              <div class="recorder-widget__ring-tick recorder-widget__ring-tick--3"></div>
            </div>
            <button class="recorder-widget__record-btn" id="rw-record-btn" aria-label="Record or Pause"></button>
          </div>

          <div class="recorder-widget__buttons-area" id="rw-buttons-area">
            <div class="recorder-widget__extenders-row is-hidden" id="rw-extenders-row">
              <button class="recorder-widget__extender-btn" id="rw-ext-5">-10 sec</button>
              <button class="recorder-widget__extender-btn" id="rw-ext-10">+10 sec</button>
            </div>
          </div>

          <div class="recorder-widget__timer-display" id="rw-timer-display">- 00:00</div>
        </div>
      </div>
    `;
  }

  /**
   * Cache DOM elements
   */
  cacheDOM() {
    const q = (sel) => this.container.querySelector(sel);
    this.dom = {
      widget: q('#rw-widget'),
      canvas: q('#rw-canvas'),
      outerRing: q('#rw-outer-ring'),
      recordBtn: q('#rw-record-btn'),
      saveBtn: q('#rw-save-btn'),
      buttonsArea: q('#rw-buttons-area'),
      extendersRow: q('#rw-extenders-row'),
      ext5Btn: q('#rw-ext-5'),
      ext10Btn: q('#rw-ext-10'),
      timerDisplay: q('#rw-timer-display')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.dom.recordBtn.addEventListener('click', () => this.toggleRecordPause());
    this.dom.ext5Btn.addEventListener('click', () => this.addMinutes(5));
    this.dom.ext10Btn.addEventListener('click', () => this.addMinutes(10));
    this.dom.saveBtn.addEventListener('click', () => this.saveRecording());
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
   * Canvas setup & rendering loop
   */
  initCanvas() {
    this.canvas = this.dom.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
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
   * Main Canvas render loop (Scrolling right-to-left waveform)
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

      // Dark Background
      this.ctx.fillStyle = '#121213';
      this.ctx.fillRect(0, 0, width, height);

      const rulerHeight = 36 * dpr;
      const waveformAreaHeight = height - rulerHeight;
      const centerY = waveformAreaHeight / 2;
      const pixelsPerSecond = 63.25 * dpr;
      const rightX = width - (8 * dpr);
      const barWidth = 2 * dpr;

      if (this.state === 'recording') {
        if (this.realAudioPlaying && this.audioElement) {
          this.elapsedSecondsFloat = this.audioElement.currentTime;
          this.elapsedSeconds = Math.floor(this.elapsedSecondsFloat);
        } else {
          this.elapsedSecondsFloat += dt;
          this.elapsedSeconds = Math.floor(this.elapsedSecondsFloat);

          if (currentTime - this.lastSampleTime > 63.2) {
            const amp = this.getAudioAmplitude();
            this.waveformHistory.push({ time: this.elapsedSecondsFloat, amp });
            this.lastSampleTime = currentTime;
          }
        }
      }

      if (this.waveformHistory.length > 50000) {
        this.waveformHistory = this.waveformHistory.slice(-40000);
      }

      // Draw Waveform Bars
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

      // Draw Bottom Timeline Ruler
      this.drawTimelineRuler(width, height, waveformAreaHeight, rulerHeight, dpr, pixelsPerSecond, rightX);

      this.animationFrameId = requestAnimationFrame(draw);
    };

    this.animationFrameId = requestAnimationFrame(draw);
  }

  /**
   * Draw scrolling timeline ruler
   */
  drawTimelineRuler(width, height, waveformAreaHeight, rulerHeight, dpr, pixelsPerSecond, rightX) {
    const ctx = this.ctx;
    const rulerY = waveformAreaHeight;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, rulerY);
    ctx.lineTo(width, rulerY);
    ctx.stroke();

    ctx.font = `${11 * dpr}px 'JetBrains Mono', 'Inter', monospace`;
    ctx.textAlign = 'center';

    const minSec = Math.max(0, Math.floor(this.elapsedSecondsFloat - (rightX / pixelsPerSecond) - 1));
    const maxSec = Math.ceil(this.elapsedSecondsFloat + 1);

    for (let sec = minSec; sec <= maxSec; sec++) {
      const mainX = rightX - (this.elapsedSecondsFloat - sec) * pixelsPerSecond;

      if (mainX >= -40 * dpr && mainX <= width + 40 * dpr) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(mainX - (0.75 * dpr), rulerY, 1.5 * dpr, 7 * dpr);

        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        const formatted = `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillText(formatted, mainX, rulerY + (22 * dpr));

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
   * Audio Amplitude Extractor
   */
  getAudioAmplitude() {
    if (this.analyser && !this.useSyntheticAudio) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      return Math.min(1.0, Math.max(0.06, avg / 128));
    } else {
      const t = Date.now() * 0.005;
      const base = Math.sin(t * 1.5) * 0.3 + Math.cos(t * 3.1) * 0.2;
      const noise = (Math.random() - 0.5) * 0.15;
      return Math.min(0.9, Math.max(0.06, Math.abs(base + noise)));
    }
  }

  /**
   * Audio Capture Initialization
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

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.start(100);
      this.useSyntheticAudio = false;
    } catch (err) {
      console.warn('Microphone unavailable, using synthetic waveform fallback.', err);
      this.useSyntheticAudio = true;
    }
  }

  stopAudioCapture() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch (e) {}
    }
    if (this.audioChunks && this.audioChunks.length > 0) {
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
   * State Machine Controls
   */
  toggleRecordPause() {
    if (!this.isUnlocked) return;
    if (this.state === 'idle') this.startRecording();
    else if (this.state === 'recording') this.pauseRecording();
    else if (this.state === 'paused') this.resumeRecording();
  }

  startRecording() {
    if (!this.isUnlocked || (this.remainingSeconds <= 0 && this.selectedPresetMinutes === 0)) return;

    this.state = 'recording';
    this.dom.recordBtn.classList.remove('is-disabled', 'is-paused');
    this.dom.recordBtn.classList.add('is-recording');
    this.startAudioCapture();

    this.dom.outerRing.classList.add('is-rotating');
    if (this.dom.buttonsArea && !this.isHistoryMode) {
      this.dom.buttonsArea.classList.add('is-hidden');
    }
    this.dom.saveBtn.classList.remove('is-visible');

    this.startTimerTicker();
  }

  pauseRecording() {
    this.state = 'paused';
    this.dom.recordBtn.classList.add('is-paused');
    this.dom.outerRing.classList.remove('is-rotating');

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording() {
    this.state = 'recording';
    this.dom.recordBtn.classList.remove('is-paused');
    this.dom.outerRing.classList.add('is-rotating');

    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  saveSession() {
    this.state = 'saved';
    this.clearTimerTicker();
    this.stopAudioCapture();
  }

  getAudioDataUrl() {
    return new Promise((resolve) => {
      if (this.audioChunks && this.audioChunks.length > 0 && !this.recordedBlob) {
        this.recordedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      }
      if (!this.recordedBlob || this.recordedBlob.size === 0) {
        return resolve(null);
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(this.recordedBlob);
    });
  }

  /**
   * Real Audio Playback & Replay Controls (Past Session View)
   */
  playRealAudio(audioUrl) {
    this.isHistoryMode = true;

    if (this.realAudioPlaying) {
      this.pauseRealAudio();
      return;
    }

    if (audioUrl) this.audioUrl = audioUrl;
    if (!this.audioUrl && !this.audioElement) return;

    if (!this.audioElement && this.audioUrl) {
      this.audioElement = new Audio(this.audioUrl);
      this.audioElement.addEventListener('ended', () => this.pauseRealAudio());
      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement && this.audioElement.duration) {
          const current = this.audioElement.currentTime;
          const total = this.audioElement.duration;
          this.elapsedSecondsFloat = current;
          this.elapsedSeconds = Math.floor(current);
          this.remainingSeconds = Math.max(0, Math.floor(total - current));
          this.updateTimerDisplay();
        }
      });
    }

    if (this.audioElement) {
      this.audioElement.play().then(() => {
        this.realAudioPlaying = true;
        this.dom.recordBtn.classList.remove('is-paused');
        this.dom.outerRing.classList.add('is-rotating');
        this.state = 'recording';
        this.startTimerTicker();
      }).catch(err => console.warn('Audio playback error:', err));
    }

    this.showSkipControls();
  }

  pauseRealAudio() {
    this.isHistoryMode = true;
    this.realAudioPlaying = false;
    this.dom.recordBtn.classList.add('is-paused');
    this.dom.outerRing.classList.remove('is-rotating');
    if (this.audioElement) this.audioElement.pause();
    this.clearTimerTicker();
    this.showSkipControls();
  }

  setDuration(totalSeconds) {
    this.remainingSeconds = totalSeconds;
    this.selectedPresetMinutes = Math.floor(totalSeconds / 60);

    if (totalSeconds > 0) {
      this.isUnlocked = true;
      if (this.dom && this.dom.recordBtn) {
        this.dom.recordBtn.classList.remove('is-disabled');
      }
    } else {
      this.isUnlocked = false;
      if (this.dom && this.dom.recordBtn) {
        this.dom.recordBtn.classList.add('is-disabled');
        this.dom.recordBtn.classList.remove('is-recording', 'is-paused');
      }
    }
    this.updateTimerDisplay();
  }

  addMinutes(mins) {
    this.remainingSeconds += mins * 60;
    this.updateTimerDisplay();
  }

  generateHistoryWaveform(totalDuration = 2700) {
    this.waveformHistory = [];
    const step = 0.0632;
    for (let t = 0; t <= totalDuration; t += step) {
      const base = Math.sin(t * 0.8) * 0.35 + Math.cos(t * 2.1) * 0.25 + Math.sin(t * 0.15) * 0.15;
      const amp = Math.min(0.85, Math.max(0.05, Math.abs(base) + 0.08));
      this.waveformHistory.push({ time: t, amp });
    }
  }

  skipReplay(secs = 10) {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, this.audioElement.currentTime - secs);
      this.elapsedSecondsFloat = this.audioElement.currentTime;
      this.elapsedSeconds = Math.floor(this.elapsedSecondsFloat);
      if (this.audioElement.duration) {
        this.remainingSeconds = Math.max(0, Math.floor(this.audioElement.duration - this.audioElement.currentTime));
      }
    } else {
      this.remainingSeconds += secs;
      this.elapsedSecondsFloat = Math.max(0, this.elapsedSecondsFloat - secs);
      this.elapsedSeconds = Math.floor(this.elapsedSecondsFloat);
    }
    this.updateTimerDisplay();
  }

  skipForward(secs = 10) {
    if (this.audioElement) {
      const dur = this.audioElement.duration || 3600;
      this.audioElement.currentTime = Math.min(dur, this.audioElement.currentTime + secs);
      this.elapsedSecondsFloat = this.audioElement.currentTime;
      this.elapsedSeconds = Math.floor(this.elapsedSecondsFloat);
      this.remainingSeconds = Math.max(0, Math.floor(dur - this.audioElement.currentTime));
    } else {
      this.remainingSeconds = Math.max(0, this.remainingSeconds - secs);
      this.elapsedSecondsFloat += secs;
      this.elapsedSeconds = Math.floor(this.elapsedSecondsFloat);
    }
    this.updateTimerDisplay();
  }

  showSkipControls() {
    this.isHistoryMode = true;
    if (this.waveformHistory.length === 0) {
      this.generateHistoryWaveform(2700);
      this.elapsedSecondsFloat = 54;
      this.elapsedSeconds = 54;
      this.remainingSeconds = 2646; // 44:06 remaining
    }

    if (!this.dom.buttonsArea) return;
    this.dom.buttonsArea.classList.add('is-visible');
    this.dom.buttonsArea.classList.remove('is-hidden');

    if (this.dom.extendersRow) {
      this.dom.extendersRow.classList.remove('is-hidden');
      this.dom.ext5Btn.textContent = '-10 sec';
      this.dom.ext10Btn.textContent = '+10 sec';
      this.dom.ext5Btn.title = 'Replay 10 seconds';
      this.dom.ext10Btn.title = 'Forward 10 seconds';

      const newExt5 = this.dom.ext5Btn.cloneNode(true);
      const newExt10 = this.dom.ext10Btn.cloneNode(true);
      this.dom.ext5Btn.parentNode.replaceChild(newExt5, this.dom.ext5Btn);
      this.dom.ext10Btn.parentNode.replaceChild(newExt10, this.dom.ext10Btn);
      this.dom.ext5Btn = newExt5;
      this.dom.ext10Btn = newExt10;

      this.dom.ext5Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.skipReplay(10);
      });
      this.dom.ext10Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.skipForward(10);
      });
    }
  }

  startTimerTicker() {
    this.clearTimerTicker();
    if (!this.isUnlocked || (this.remainingSeconds <= 0 && this.selectedPresetMinutes === 0)) return;

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
    if (this.dom && this.dom.timerDisplay) {
      this.dom.timerDisplay.textContent = `${prefix}${formattedMins}:${formattedSecs}`;
      this.dom.timerDisplay.classList.toggle('is-overtime', isOvertime);
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

    if (this.options.onSave) {
      this.options.onSave(result);
    }

    if (this.recordedBlob) {
      const url = URL.createObjectURL(this.recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    this.resetToIdle();
  }

  resetToIdle() {
    this.state = 'idle';
    this.elapsedSeconds = 0;
    this.elapsedSecondsFloat = 0.0;
    this.remainingSeconds = this.selectedPresetMinutes * 60;

    this.initCanvas();

    if (this.dom) {
      if (this.dom.recordBtn) this.dom.recordBtn.classList.remove('is-paused');
      if (this.dom.outerRing) this.dom.outerRing.classList.remove('is-rotating');
      if (this.dom.buttonsArea) this.dom.buttonsArea.classList.remove('is-hidden');
      if (this.dom.extendersRow) this.dom.extendersRow.classList.add('is-hidden');
      if (this.dom.saveBtn) this.dom.saveBtn.classList.remove('is-visible');
    }

    this.updateTimerDisplay();
  }
}
