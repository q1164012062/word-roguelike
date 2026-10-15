/* ========== 单词肉鸽 · 音效系统 (Web Audio API) ========== */

const Audio = {
  ctx: null,
  _volume: 0.6,

  init() {
    // Create AudioContext lazily (needs user gesture)
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this._volume = Settings.get('sfxVolume');
  },

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
  },

  // Create a gain node with the current volume
  _gain(v = 1) {
    const g = this.ctx.createGain();
    g.gain.value = this._volume * v;
    g.connect(this.ctx.destination);
    return g;
  },

  // Play a tone with given frequency, duration, type
  _tone(freq, duration, type = 'sine', volume = 0.5) {
    if (!this.ctx || this._volume === 0) return;
    const osc = this.ctx.createOscillator();
    const gain = this._gain(volume);
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(this._volume * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  },

  // ✅ Answer correct - ascending happy tone
  playCorrect() {
    if (!this.ctx) this.init();
    this._tone(523, 0.1, 'sine', 0.4); // C5
    setTimeout(() => this._tone(659, 0.1, 'sine', 0.4), 80); // E5
    setTimeout(() => this._tone(784, 0.15, 'sine', 0.3), 160); // G5
  },

  // ❌ Answer wrong - descending buzzy tone
  playWrong() {
    if (!this.ctx) this.init();
    this._tone(300, 0.15, 'sawtooth', 0.25);
    setTimeout(() => this._tone(200, 0.25, 'sawtooth', 0.2), 120);
  },

  // 💥 Critical hit - bright burst
  playCrit() {
    if (!this.ctx) this.init();
    this._tone(880, 0.05, 'square', 0.3);
    setTimeout(() => this._tone(1100, 0.05, 'square', 0.3), 50);
    setTimeout(() => this._tone(1320, 0.08, 'sine', 0.4), 100);
    setTimeout(() => this._tone(1760, 0.15, 'sine', 0.3), 150);
  },

  // 🔥 Combo milestone (play at combo 5, 10, 15...)
  playCombo(n) {
    if (!this.ctx) this.init();
    const base = 440 + Math.min(n, 20) * 20;
    this._tone(base, 0.08, 'triangle', 0.3);
    setTimeout(() => this._tone(base * 1.25, 0.08, 'triangle', 0.3), 60);
    setTimeout(() => this._tone(base * 1.5, 0.12, 'sine', 0.25), 120);
  },

  // 🐲 Boss appear - ominous deep tone
  playBoss() {
    if (!this.ctx) this.init();
    this._tone(80, 0.6, 'sawtooth', 0.3);
    setTimeout(() => this._tone(100, 0.5, 'sawtooth', 0.25), 200);
    setTimeout(() => this._tone(65, 0.8, 'sawtooth', 0.2), 500);
  },

  // 🏪 Shop open - cheerful chime
  playShop() {
    if (!this.ctx) this.init();
    this._tone(660, 0.12, 'sine', 0.3);
    setTimeout(() => this._tone(880, 0.12, 'sine', 0.3), 100);
    setTimeout(() => this._tone(1100, 0.18, 'sine', 0.25), 200);
  },

  // ⏱ Timer warning - when <20% time left
  playWarning() {
    if (!this.ctx) this.init();
    this._tone(600, 0.08, 'square', 0.15);
  },

  // 🖱 UI click
  playClick() {
    if (!this.ctx) this.init();
    this._tone(800, 0.04, 'sine', 0.2);
  },

  // 💾 Save notification
  playSave() {
    if (!this.ctx) this.init();
    this._tone(1000, 0.06, 'sine', 0.15);
    setTimeout(() => this._tone(1200, 0.08, 'sine', 0.12), 60);
  },

  // 🎉 Victory fanfare
  playVictory() {
    if (!this.ctx) this.init();
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.2, 'sine', 0.35), i * 150);
    });
  },

  // 💀 Defeat sound
  playDefeat() {
    if (!this.ctx) this.init();
    this._tone(400, 0.2, 'sawtooth', 0.3);
    setTimeout(() => this._tone(300, 0.3, 'sawtooth', 0.25), 200);
    setTimeout(() => this._tone(200, 0.5, 'sawtooth', 0.2), 450);
  },

  // 🪙 购买商品收银声
  playBuy() {
    if (!this.ctx) this.init();
    this._tone(987, 0.07, 'sine', 0.35); // B5
    setTimeout(() => this._tone(1318, 0.12, 'sine', 0.3), 50); // E6
  },

  // 🎲 刷新货架洗牌声
  playReroll() {
    if (!this.ctx) this.init();
    this._tone(400, 0.04, 'triangle', 0.25);
    setTimeout(() => this._tone(520, 0.04, 'triangle', 0.25), 35);
    setTimeout(() => this._tone(640, 0.06, 'triangle', 0.25), 70);
  },

  // ✨ 天赋升级/学识充能声
  playTalent() {
    if (!this.ctx) this.init();
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.15, 'sine', 0.35), i * 70);
    });
  },
};
