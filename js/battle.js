/* ========== 单词肉鸽 · 战斗系统 ========== */

const Battle = {
  _warnPlayed: false,  // 是否已播放倒计时警告音

  // 生成怪物
  spawnMonster() {
    const diff = Settings.getDifficulty();
    const boss = S.round % 4 === 0;
    const base = boss ? MONSTERS[4] : MONSTERS[(S.round - 1) % 4];
    const extra = Math.floor((S.round - 1) / 2);
    S.monster = base;
    S.mmax = Math.round((base.hp + extra) * diff.hpMul);
    S.mhp = S.mmax;
    
    UI.$('sprite').textContent = base.sprite;
    UI.$('mname').textContent = base.name + (boss ? ' · BOSS' : '');
    UI.$('tag').textContent = boss ? 'BOSS 关' : (S.endless ? '无尽' : '普通关');
    UI.$('mhp').style.width = '100%';
    
    if (boss) {
      S.debuff = DEBUFFS[(S.round / 4 - 1) % DEBUFFS.length];
      UI.$('log').textContent = `Boss Debuff：${S.debuff.name} — ${S.debuff.desc}`;
      Audio.playBoss();
    } else {
      S.debuff = null;
    }
  },

  // 下一个单词
  nextWord() {
    let w;
    if (S.review) {
      if (!S.rqueue.length) return Main.end(true);
      w = S.rqueue.shift();
    } else {
      if (S.bag.length < 8) S.bag = S.bag.concat(Utils.shuffle(WordBank.activeWords()));
      w = S.miss.length && Math.random() < 0.28
        ? S.miss[Math.floor(Math.random() * S.miss.length)]
        : S.bag.pop();
    }
    S.word = { en: w[0], zh: w[1], pos: w[2] };
    S.typed = '';
    UI.$('zh').textContent = S.word.zh;
    UI.$('pos').textContent = S.word.pos;
    UI.$('typed').textContent = '';
    UI.$('typed').className = 'typed';
    
    const fog = S.debuff && S.debuff.id === 'fog';
    const parts = [];
    if (S.showHint) parts.push('首字母 ' + S.word.en[0].toUpperCase());
    if (S.showLen) parts.push(S.word.en.length + ' 个字母');
    if (fog) {
      parts.push(S.word.en.split('').map((ch, i) => (i % 3 === 1 ? ch : '_')).join(' '));
    }
    UI.$('hint').textContent = parts.join(' · ');
    UI.$('log').textContent = S.review ? '复习：把单词拼回来' : '看中文，拼出英文单词';
    
    const diff = Settings.getDifficulty();
    const len = S.word.en.length;
    let limit = (5200 + len * 420 + S.timeBonus * 1000) * diff.timeMul;
    if (S.debuff && S.debuff.id === 'haste') limit *= 0.72;
    S.limit = limit * S.slow;
    S.t0 = performance.now();
    this._warnPlayed = false;
    cancelAnimationFrame(S.raf);
    this.tick();
    UI.speak(S.word.en);
    UI.renderAll();
  },

  // 提交答案
  submit() {
    if (!S.playing || S.shop) return;
    const ans = S.typed.trim().toLowerCase();
    if (!ans) return;
    if (ans === S.word.en) this.win();
    else this.fail('拼写错误');
  },

  // 答对
  win() {
    const left = Math.max(0.15, 1 - (performance.now() - S.t0) / S.limit);
    S.combo += 1;
    S.maxCombo = Math.max(S.maxCombo, S.combo);
    S.ok += 1;
    S.answers += 1;
    let gain = Math.round((80 + S.word.en.length * 12 + left * 80) * (1 + (S.combo - 1) * 0.12 * S.comboMul));
    const isCrit = Math.random() < S.crit;
    if (isCrit) {
      gain *= 2;
      UI.fx('暴击!');
      Audio.playCrit();
    } else {
      UI.fx(`+${gain}`);
      Audio.playCorrect();
    }
    // 连击里程碑音效
    if (S.combo > 0 && S.combo % 5 === 0) {
      Audio.playCombo(S.combo);
    }
    S.score += gain;
    S.gold += Math.round((8 + S.combo) * S.goldMul);
    S.mhp -= 1;
    UI.$('sprite').classList.add('hit');
    setTimeout(() => UI.$('sprite').classList.remove('hit'), 180);
    UI.$('typed').className = 'typed ok';
    UI.$('typed').textContent = S.word.en;
    UI.$('log').textContent = `${S.word.en} · ${S.word.zh}`;
    WordBank.bookRecord([S.word.en, S.word.zh, S.word.pos], true);
    this.afterAnswer();
  },

  // 答错
  fail(why) {
    S.combo = 0;
    S.answers += 1;
    if (!S.miss.find(w => w[0] === S.word.en)) {
      S.miss.push([S.word.en, S.word.zh, S.word.pos]);
    }
    WordBank.bookRecord([S.word.en, S.word.zh, S.word.pos], false);
    if (S.review) S.rqueue.push([S.word.en, S.word.zh, S.word.pos]);
    UI.$('typed').className = 'typed bad';
    UI.$('log').textContent = `${why}！正确答案：${S.word.en}`;
    UI.fx('MISS');
    Audio.playWrong();
    if (S.shield > 0) {
      S.shield -= 1;
      UI.$('log').textContent += '（护盾抵消）';
    } else {
      S.hp -= 1;
      if (S.hp <= 0) return Main.end(false);
    }
    this.afterAnswer();
  },

  // 答题后处理
  afterAnswer() {
    cancelAnimationFrame(S.raf);
    UI.renderAll();
    if (S.review) {
      if (!S.rqueue.length) return Main.end(true);
      setTimeout(() => this.nextWord(), 420);
      return;
    }
    let respawn = S.mhp <= 0;
    if (S.mhp <= 0) S.gold += 12;
    if (S.score >= S.goal) {
      if (!S.endless && S.round >= 8) {
        S.endless = true;
        UI.$('log').textContent = '8 回合通关！进入无尽模式';
      }
      S.round += 1;
      S.goal = GameState.goalFor(S.round);
      if (S.round % 4 === 0) respawn = true;
    }
    if (respawn) this.spawnMonster();
    if (S.answers > 0 && S.answers % 4 === 0) {
      // 自动存档
      if (GameState.save()) {
        UI.showSaveIndicator();
        Audio.playSave();
      }
      Shop.open();
      return;
    }
    setTimeout(() => this.nextWord(), 420);
  },

  // 倒计时
  tick() {
    if (!S.playing || S.shop) return;
    const p = 1 - (performance.now() - S.t0) / S.limit;
    UI.$('bar').style.transform = `scaleX(${Math.max(0, p)})`;
    if (p <= 0) {
      this.fail('超时');
      return;
    }
    // 倒计时警告音
    if (p < 0.2 && !this._warnPlayed) {
      Audio.playWarning();
      this._warnPlayed = true;
    }
    S.raf = requestAnimationFrame(() => this.tick());
  },

  // 跳过单词
  skipWord() {
    if (!S.skips || S.shop || !S.playing) return;
    S.skips -= 1;
    S.answers += 1;
    UI.$('log').textContent = `跳过 ${S.word.en}`;
    if (S.answers % 4 === 0) Shop.open();
    else this.nextWord();
  },
};
