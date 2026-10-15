/* ========== 单词肉鸽 · 游戏状态管理 ========== */

// 游戏全局状态对象
const S = {
  playing: false,
  shop: false,
  review: false,
  rqueue: [],
  hp: 5,
  maxHp: 5,
  score: 0,
  gold: 0,
  combo: 0,
  maxCombo: 0,
  ok: 0,
  answers: 0,
  round: 1,
  endless: false,
  goal: 400,
  timeBonus: 0,
  crit: 0,
  comboMul: 1,
  showHint: false,
  showLen: false,
  shield: 0,
  goldMul: 1,
  slow: 1,
  skips: 0,
  debuff: null,
  typed: '',
  word: null,
  monster: null,
  mhp: 0,
  mmax: 1,
  t0: 0,
  limit: 8000,
  raf: 0,
  miss: [],
  bag: [],
};

// 状态管理器
const GameState = {
  SAVE_KEY: 'lexi-save',
  BEST_KEY: 'lexi-best',

  // 获取最高分
  best() {
    return Number(localStorage.getItem(this.BEST_KEY) || 0);
  },

  // 更新最高分
  updateBest(score) {
    if (score > this.best()) {
      localStorage.setItem(this.BEST_KEY, String(score));
    }
  },

  // 重置状态（开始新游戏）
  reset(reviewMode, words) {
    const diff = Settings.getDifficulty();
    const talentHp = (typeof Talents !== 'undefined') ? Talents.getEffect('max_hp') : 0;
    const talentGold = (typeof Talents !== 'undefined' && !reviewMode) ? Talents.getEffect('start_gold') : 0;
    const talentTime = (typeof Talents !== 'undefined') ? Talents.getEffect('time_bonus') : 0;
    const talentLen = (typeof Talents !== 'undefined') ? Talents.getEffect('auto_len') : false;

    const baseMaxHp = Math.max(3, Math.round((5 + talentHp) * diff.hpMul));

    Object.assign(S, {
      playing: true,
      shop: false,
      review: !!reviewMode,
      rqueue: reviewMode ? words.slice(0, 30) : [],
      hp: baseMaxHp,
      maxHp: baseMaxHp,
      score: 0,
      gold: talentGold,
      combo: 0,
      maxCombo: 0,
      ok: 0,
      answers: 0,
      round: 1,
      endless: false,
      goal: GameState.goalFor(1),
      timeBonus: talentTime,
      crit: 0.05,
      comboMul: 1,
      showHint: false,
      showLen: talentLen,
      shield: 0,
      goldMul: 1,
      slow: 1,
      skips: 0,
      debuff: null,
      typed: '',
      miss: [],
      bag: Utils.shuffle(WordBank.activeWords()),
      word: null,
      monster: null,
      mhp: 0,
      mmax: 1,
      t0: 0,
      limit: 8000,
      raf: 0,
    });
  },

  // 计算目标分数
  goalFor(round) {
    const mul = Settings.getDifficulty().scoreMul;
    return Math.round((300 + round * 180 + (S.endless ? (round - 8) * 120 : 0)) * mul);
  },

  // ========== 存档系统 ==========
  
  // 保存游戏进度
  save() {
    if (!S.playing || S.review) return false;
    const saveData = {
      version: 1,
      timestamp: Date.now(),
      hp: S.hp,
      maxHp: S.maxHp || 5,
      score: S.score,
      gold: S.gold,
      combo: S.combo,
      maxCombo: S.maxCombo,
      ok: S.ok,
      answers: S.answers,
      round: S.round,
      endless: S.endless,
      goal: S.goal,
      timeBonus: S.timeBonus,
      crit: S.crit,
      comboMul: S.comboMul,
      showHint: S.showHint,
      showLen: S.showLen,
      shield: S.shield,
      goldMul: S.goldMul,
      slow: S.slow,
      skips: S.skips,
      miss: S.miss,
      activeBankName: WordBank.activeBankName(),
    };
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (_) {
      return false;
    }
  },

  // 加载存档
  load() {
    try {
      const data = JSON.parse(localStorage.getItem(this.SAVE_KEY));
      if (!data || data.version !== 1) return null;
      return data;
    } catch (_) {
      return null;
    }
  },

  // 是否有存档
  hasSave() {
    return this.load() !== null;
  },

  // 删除存档
  deleteSave() {
    localStorage.removeItem(this.SAVE_KEY);
  },

  // 从存档恢复游戏
  restore() {
    const data = this.load();
    if (!data) return false;
    
    Object.assign(S, {
      playing: true,
      shop: false,
      review: false,
      rqueue: [],
      hp: data.hp,
      maxHp: data.maxHp || 5,
      score: data.score,
      gold: data.gold,
      combo: data.combo,
      maxCombo: data.maxCombo,
      ok: data.ok,
      answers: data.answers,
      round: data.round,
      endless: data.endless,
      goal: data.goal,
      timeBonus: data.timeBonus,
      crit: data.crit,
      comboMul: data.comboMul,
      showHint: data.showHint,
      showLen: data.showLen,
      shield: data.shield,
      goldMul: data.goldMul,
      slow: data.slow,
      skips: data.skips,
      debuff: null,
      typed: '',
      miss: data.miss || [],
      bag: Utils.shuffle(WordBank.activeWords()),
      word: null,
      monster: null,
      mhp: 0,
      mmax: 1,
      t0: 0,
      limit: 8000,
      raf: 0,
    });
    
    this.deleteSave(); // 加载后删除存档（肉鸽传统）
    return true;
  },
};

// 通用工具函数
const Utils = {
  shuffle(arr) {
    const b = arr.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  },

  pick(n, arr) {
    return this.shuffle(arr).slice(0, n);
  },

  escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  },
};
