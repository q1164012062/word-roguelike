/* ========== 单词肉鸽 · UI 渲染 ========== */

const UI = {
  // DOM 快捷访问
  $(id) {
    return document.getElementById(id);
  },

  // 切换屏幕
  show(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('on'));
    const target = this.$(id);
    if (target) {
      target.classList.add('on');
    }
  },

  // TTS 朗读
  speak(word) {
    try {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US';
      u.rate = 0.95;
      u.volume = Settings.get('ttsVolume');
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (_) {}
  },

  // 浮动文字效果
  fx(text) {
    const el = this.$('fx');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  },

  // 渲染 Buff 标签
  renderBuffs() {
    const map = {
      time: S.timeBonus ? `时限+${S.timeBonus.toFixed(1)}s` : '',
      crit: S.crit > 0.05 ? `暴击${Math.round(S.crit * 100)}%` : '',
      combo: S.comboMul > 1 ? `连击x${S.comboMul.toFixed(1)}` : '',
      hint: S.showHint ? '透视' : '',
      len: S.showLen ? '字数' : '',
      shield: S.shield ? `护盾${S.shield}` : '',
      gold: S.goldMul > 1 ? `金币x${S.goldMul.toFixed(1)}` : '',
      slow: S.slow > 1 ? '膨胀' : '',
      skip: S.skips ? `跳过${S.skips}` : '',
    };
    const buffsEl = this.$('buffs');
    if (buffsEl) {
      buffsEl.innerHTML = Object.values(map).filter(Boolean)
        .map(t => `<span class="chip">${t}</span>`).join('');
    }
  },

  // 渲染血量
  renderHp() {
    const hpEl = this.$('hp');
    if (hpEl) {
      const max = S.maxHp || 5;
      hpEl.textContent = '❤'.repeat(Math.max(0, S.hp)) + '♡'.repeat(Math.max(0, max - S.hp));
    }
  },

  // 渲染所有 HUD 元素
  renderAll() {
    const roundEl = this.$('round-label');
    if (roundEl) {
      roundEl.textContent = S.review
        ? `复习 ${S.answers + 1}/${S.answers + 1 + S.rqueue.length}`
        : (S.endless ? `无尽 ${S.round}` : `回合 ${S.round}/8`);
    }
    const goalEl = this.$('goal');
    if (goalEl) goalEl.textContent = S.review ? '—' : S.goal;
    const scoreEl = this.$('score');
    if (scoreEl) scoreEl.textContent = S.score;
    const goldEl = this.$('gold');
    if (goldEl) goldEl.textContent = S.gold;
    const comboEl = this.$('combo');
    if (comboEl) comboEl.textContent = `COMBO ${S.combo}`;

    this.renderHp();
    this.renderBuffs();

    const mhpEl = this.$('mhp');
    if (mhpEl) {
      if (S.review) {
        const total = S.answers + 1 + S.rqueue.length;
        mhpEl.style.width = `${Math.min(100, (S.answers / Math.max(1, total)) * 100)}%`;
      } else {
        mhpEl.style.width = `${(S.mhp / S.mmax) * 100}%`;
      }
    }
  },

  // 刷新标题页
  refreshTitle() {
    const bestEl = this.$('best');
    if (bestEl) bestEl.textContent = Math.max(GameState.best(), 0);

    const st = WordBank.bookStats();
    const bookMetaEl = this.$('book-meta');
    if (bookMetaEl) bookMetaEl.style.display = st.total ? '' : 'none';

    const bookCountEl = this.$('book-count');
    if (bookCountEl) bookCountEl.textContent = st.total;
    const dueCountEl = this.$('due-count');
    if (dueCountEl) dueCountEl.textContent = st.due;
    const masteredCountEl = this.$('mastered-count');
    if (masteredCountEl) masteredCountEl.textContent = st.mastered;

    const btnReview = this.$('btn-review');
    if (btnReview) btnReview.style.display = st.due > 0 ? '' : 'none';
    
    // 存档继续按钮
    const btnContinue = this.$('btn-continue');
    if (btnContinue) {
      const save = GameState.load();
      if (save) {
        btnContinue.style.display = '';
        btnContinue.textContent = `继续游戏（回合${save.round} · ${save.score}分）`;
      } else {
        btnContinue.style.display = 'none';
      }
    }

    // 局外学识金币
    const scholarCoinsEl = this.$('scholar-coins');
    if (scholarCoinsEl && typeof Talents !== 'undefined') {
      scholarCoinsEl.textContent = Talents.getCoins();
    }
    
    this.renderBankSelect();
  },

  // 渲染词库选择器
  renderBankSelect() {
    const sel = this.$('bank-select');
    if (!sel) return;

    const builtinOpts = Object.entries(WordBank.BUILTIN_BANKS).map(([k, b]) =>
      `<option value="${k}">内置 · ${b.name}（${b.words.length} 词）</option>`
    );

    const customOpts = WordBank.getBanks().map(b =>
      `<option value="${Utils.escapeHtml(b.name)}">自定义 · ${Utils.escapeHtml(b.name)}（${b.words.length} 词）</option>`
    );

    sel.innerHTML = builtinOpts.concat(customOpts).join('');
    sel.value = WordBank.active;

    const bankLabel = this.$('bank-label');
    if (bankLabel) bankLabel.textContent = WordBank.activeBankName();

    const btnDelBank = this.$('btn-del-bank');
    if (btnDelBank) btnDelBank.style.display = WordBank.isCustom(WordBank.active) ? '' : 'none';
  },

  // 存档提示动画
  showSaveIndicator() {
    const el = this.$('save-indicator');
    if (!el) return;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1500);
  },
};
