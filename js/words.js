/* ========== 单词肉鸽 · 词库管理 ========== */

const WordBank = {
  BUILTIN_BANKS: {
    'builtin_cet4': { name: 'CET-4 精选', file: 'data/cet4.json', words: [] },
    'builtin_cet6': { name: 'CET-6 核心', file: 'data/cet6.json', words: [] },
    'builtin_hs':   { name: '高中核心',   file: 'data/high-school.json', words: [] },
  },
  DEFAULT_KEY: 'builtin_cet4',

  BANKS_KEY: 'lexi-banks',
  ACTIVE_KEY: 'lexi-active-bank',
  BOOK_KEY: 'lexi-book',
  
  banks: [],           // 自定义词库 [{name, words}]
  active: 'builtin_cet4', // 当前选中的词库 ID 或名称
  book: {},            // 错题本
  
  // 本地文件读取辅助函数（支持 fetch 与 XHR 双保险离线读取）
  async _loadFile(path) {
    try {
      const resp = await fetch(path);
      if (resp && resp.ok) return await resp.json();
    } catch (_) {}

    return new Promise((resolve) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch (_) { resolve({ words: [] }); }
        };
        xhr.onerror = () => resolve({ words: [] });
        xhr.send();
      } catch (_) {
        resolve({ words: [] });
      }
    });
  },

  // 从 JSON 文件加载内置词库
  async init() {
    for (const [key, info] of Object.entries(this.BUILTIN_BANKS)) {
      try {
        const data = await this._loadFile(info.file);
        info.words = (data && data.words) ? data.words : [];
      } catch (e) {
        console.warn(`加载内置词库 ${info.file} 失败`, e);
        info.words = [];
      }
    }

    // 从 localStorage 加载自定义词库和错题本
    this.banks = this._loadJSON(this.BANKS_KEY, []);
    const savedActive = localStorage.getItem(this.ACTIVE_KEY);
    if (savedActive && (this.BUILTIN_BANKS[savedActive] || this.bankByName(savedActive))) {
      this.active = savedActive;
    } else {
      this.active = this.DEFAULT_KEY;
    }

    this.book = this._loadJSON(this.BOOK_KEY, {});
  },

  _loadJSON(key, defaultVal) {
    try { return JSON.parse(localStorage.getItem(key)) ?? defaultVal; }
    catch (_) { return defaultVal; }
  },

  _saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  },

  isCustom(keyOrName) {
    return !this.BUILTIN_BANKS[keyOrName] && !!this.bankByName(keyOrName);
  },

  bankByName(name) {
    return this.banks.find(b => b.name === name);
  },

  activeWords() {
    if (this.BUILTIN_BANKS[this.active]) {
      return this.BUILTIN_BANKS[this.active].words;
    }
    const b = this.bankByName(this.active);
    return (b && b.words.length) ? b.words : (this.BUILTIN_BANKS[this.DEFAULT_KEY].words || []);
  },

  activeBankName() {
    if (this.BUILTIN_BANKS[this.active]) {
      return this.BUILTIN_BANKS[this.active].name;
    }
    const b = this.bankByName(this.active);
    return b ? b.name : this.BUILTIN_BANKS[this.DEFAULT_KEY].name;
  },

  selectBank(nameOrKey) {
    this.active = nameOrKey || this.DEFAULT_KEY;
    localStorage.setItem(this.ACTIVE_KEY, this.active);
  },

  getBanks() {
    return this.banks;
  },

  importBank(bank) {
    this.banks = this.banks.filter(b => b.name !== bank.name);
    this.banks.push(bank);
    this._saveJSON(this.BANKS_KEY, this.banks);
    this.selectBank(bank.name);
  },

  deleteBank(name) {
    this.banks = this.banks.filter(b => b.name !== name);
    this._saveJSON(this.BANKS_KEY, this.banks);
    if (this.active === name) {
      this.selectBank(this.DEFAULT_KEY);
    }
  },

  exportBank() {
    const words = this.activeWords();
    return words.map(w => w.join('\t')).join('\n');
  },

  // 解析导入的词库文本（支持 TXT / CSV / JSON）
  parseBankText(text, name) {
    const words = [];
    const t = text.trim();
    if (t.startsWith('[') || t.startsWith('{')) {
      let data = JSON.parse(t);
      if (!Array.isArray(data)) data = data.words || data.list || [];
      for (const item of data) {
        if (Array.isArray(item) && item[0] && item[1]) {
          words.push([String(item[0]).trim().toLowerCase(), String(item[1]).trim(), String(item[2] || '').trim()]);
        } else if (item && item.en && (item.zh || item.meaning)) {
          words.push([String(item.en).trim().toLowerCase(), String(item.zh || item.meaning).trim(), String(item.pos || '').trim()]);
        }
      }
    } else {
      for (const line of t.split(/\r?\n/)) {
        const s = line.trim();
        if (!s || s.startsWith('#')) continue;
        let parts = s.split(/\t|[,，;；]|\s{2,}/).map(x => x.trim()).filter(Boolean);
        if (parts.length < 2) {
          const m = s.match(/^([A-Za-z][A-Za-z'’-]*)\s+(.+)$/);
          if (!m) continue;
          let rest = m[2].trim();
          let pos = '';
          const pm = rest.match(/^(.+?)\s+((?:art|n|v|vt|vi|adj|adv|prep|conj|pron|num|interj)\.)$/i);
          if (pm) { rest = pm[1].trim(); pos = pm[2]; }
          parts = [m[1], rest, pos];
        }
        if (!/^[A-Za-z][A-Za-z'’-]*$/.test(parts[0])) continue;
        words.push([parts[0].toLowerCase(), parts[1], parts[2] || '']);
      }
    }
    const seen = new Set();
    const out = words.filter(w => !seen.has(w[0]) && (seen.add(w[0]), true));
    return { name, words: out };
  },

  // ========== 错题本 (间隔重复) ==========
  bookRecord(word, ok) {
    const en = word[0].toLowerCase();
    const e = this.book[en] || (this.book[en] = { zh: word[1], pos: word[2] || '', box: 0, due: 0, wrong: 0, right: 0 });
    e.zh = word[1];
    if (word[2]) e.pos = word[2];
    if (ok) {
      e.right += 1;
      e.box = Math.min(e.box + 1, BOX_DAYS.length - 1);
      e.due = Date.now() + BOX_DAYS[e.box] * DAY_MS;
    } else {
      e.wrong += 1;
      e.box = 0;
      e.due = Date.now();
    }
    this._saveJSON(this.BOOK_KEY, this.book);
  },

  bookDue() {
    const now = Date.now();
    return Object.keys(this.book)
      .filter(k => this.book[k].due <= now)
      .map(k => [k, this.book[k].zh, this.book[k].pos])
      .sort((a, b) => this.book[a[0]].due - this.book[b[0]].due);
  },

  bookStats() {
    const now = Date.now();
    let due = 0, mastered = 0;
    for (const k in this.book) {
      if (this.book[k].box >= 5) mastered += 1;
      else if (this.book[k].due <= now) due += 1;
    }
    return { total: Object.keys(this.book).length, due, mastered };
  },
};
