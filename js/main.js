/* ========== 单词肉鸽 · 主入口 ========== */

const Main = {
  // 初始化游戏
  async init() {
    // 加载内置词库与本地数据
    await WordBank.init();
    
    // 初始化设置面板与主题
    if (typeof SettingsPanel !== 'undefined' && SettingsPanel.init) {
      SettingsPanel.init();
    }

    // 初始化学识祭坛面板
    if (typeof TalentsPanel !== 'undefined' && TalentsPanel.init) {
      TalentsPanel.init();
    }
    
    // 刷新标题页
    UI.refreshTitle();
    
    // 绑定交互事件
    this.bindEvents();
  },

  // 开始新游戏（普通模式或复习模式）
  startRun(reviewMode) {
    Audio.init();
    const due = reviewMode ? WordBank.bookDue() : [];
    if (reviewMode && !due.length) return;
    
    GameState.reset(reviewMode, due);
    UI.show('game');
    UI.$('tag').textContent = reviewMode ? '复习关' : '普通关';
    
    if (reviewMode) {
      UI.$('sprite').textContent = '📖';
      UI.$('mname').textContent = '复习魔法书';
      UI.$('mhp').style.width = '0%';
    } else {
      Battle.spawnMonster();
    }
    Battle.nextWord();
    const keysInput = UI.$('keys');
    if (keysInput) keysInput.focus();
  },

  // 从存档继续游戏
  continueGame() {
    Audio.init();
    if (!GameState.restore()) return;
    UI.show('game');
    Battle.spawnMonster();
    Battle.nextWord();
    const keysInput = UI.$('keys');
    if (keysInput) keysInput.focus();
  },

  // 游戏结束结算
  end(win) {
    S.playing = false;
    cancelAnimationFrame(S.raf);
    GameState.updateBest(S.score);
    GameState.deleteSave();

    // 局外学识币沉淀：当局金币 100% 转化为永久学识币
    const earnedScholarCoins = S.review ? Math.round(S.score / 25) : S.gold;
    const totalCoins = (typeof Talents !== 'undefined') ? Talents.addCoins(earnedScholarCoins) : 0;
    
    if (win) Audio.playVictory();
    else Audio.playDefeat();
    
    UI.$('best').textContent = Math.max(GameState.best(), S.score);
    UI.$('end-title').textContent = S.review
      ? (win ? '复习完成' : '复习中断')
      : (win ? '通关' : '倒下了');
    UI.$('end-sub').textContent = S.review
      ? `复习 ${S.ok + (S.answers - S.ok)} 词 · 答对 ${S.ok} · 错词已重新排期`
      : (S.endless ? `无尽撑到第 ${S.round} 回合` : `止步第 ${S.round} 回合`);
    UI.$('end-score').textContent = S.score;
    UI.$('end-combo').textContent = S.maxCombo;
    UI.$('end-ok').textContent = S.ok;

    const endCoinsEl = UI.$('end-coins');
    if (endCoinsEl) endCoinsEl.textContent = earnedScholarCoins;
    const endTotalCoinsEl = UI.$('end-total-coins');
    if (endTotalCoinsEl) endTotalCoinsEl.textContent = totalCoins;

    UI.$('miss').innerHTML = S.miss.length
      ? '错题：' + S.miss.slice(0, 12).map(w => `${w[0]}（${w[1]}）`).join(' · ')
      : (S.review ? '全部拼对，记忆牢固。' : '本局没有错题，词典之神。');
    UI.show('over');
  },

  // 绑定所有事件
  bindEvents() {
    // 标题页与结算页按钮
    const btnStart = UI.$('btn-start');
    if (btnStart) btnStart.onclick = () => this.startRun(false);

    const btnReview = UI.$('btn-review');
    if (btnReview) btnReview.onclick = () => this.startRun(true);

    const btnAgain = UI.$('btn-again');
    if (btnAgain) btnAgain.onclick = () => { UI.show('title'); UI.refreshTitle(); };

    // 商店操作按钮
    const btnLeaveShop = UI.$('btn-leave-shop') || UI.$('btn-skip-shop');
    if (btnLeaveShop) btnLeaveShop.onclick = () => { Audio.playClick(); Shop.close(); };

    const btnRerollShop = UI.$('btn-reroll-shop');
    if (btnRerollShop) btnRerollShop.onclick = () => { Shop.reroll(); };
    
    // 继续游戏按钮
    const btnContinue = UI.$('btn-continue');
    if (btnContinue) {
      btnContinue.onclick = () => this.continueGame();
    }

    // 词库选择切换
    const bankSelect = UI.$('bank-select');
    if (bankSelect) {
      bankSelect.onchange = (e) => {
        WordBank.selectBank(e.target.value);
        UI.$('bank-label').textContent = WordBank.activeBankName();
        const btnDel = UI.$('btn-del-bank');
        if (btnDel) btnDel.style.display = WordBank.isCustom(WordBank.active) ? '' : 'none';
      };
    }

    // 词库导入
    const btnImport = UI.$('btn-import');
    const fileInput = UI.$('file-input');
    if (btnImport && fileInput) {
      btnImport.onclick = () => fileInput.click();
      fileInput.onchange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          let parsed;
          try {
            parsed = WordBank.parseBankText(String(r.result), f.name.replace(/\.[^.]+$/, ''));
          } catch (_) {
            alert('词库解析失败：文件格式无法识别');
            return;
          }
          if (parsed.words.length < 5) {
            alert(`有效单词太少（${parsed.words.length} 个），至少需要 5 个`);
            return;
          }
          let name = parsed.name || '自定义词库';
          if (WordBank.bankByName(name)) {
            if (!confirm(`词库「${name}」已存在，覆盖吗？`)) return;
          }
          WordBank.importBank({ name, words: parsed.words });
          UI.renderBankSelect();
          alert(`词库「${name}」导入成功：${parsed.words.length} 个单词`);
        };
        r.readAsText(f, 'utf-8');
        e.target.value = '';
      };
    }

    // 词库导出
    const btnExport = UI.$('btn-export');
    if (btnExport) {
      btnExport.onclick = () => {
        const txt = WordBank.exportBank();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['\ufeff' + txt], { type: 'text/plain;charset=utf-8' }));
        a.download = WordBank.activeBankName() + '.txt';
        a.click();
        URL.revokeObjectURL(a.href);
      };
    }

    // 删除自定义词库
    const btnDelBank = UI.$('btn-del-bank');
    if (btnDelBank) {
      btnDelBank.onclick = () => {
        if (!WordBank.active) return;
        if (!confirm(`删除自定义词库「${WordBank.active}」？\n（错题本不受影响）`)) return;
        WordBank.deleteBank(WordBank.active);
        UI.renderBankSelect();
      };
    }

    // 词库格式说明帮助弹窗
    const btnHelp = UI.$('btn-help');
    if (btnHelp) {
      btnHelp.onclick = () => alert(
        '支持两种词库格式：\n\n' +
        '① TXT / CSV（每行一个词）：\n' +
        'abandon\t放弃\tv.\n' +
        'ability\t能力\tn.\n' +
        '（用 Tab、逗号或多个空格分隔；词性可省略；# 开头为注释）\n\n' +
        '② JSON：\n' +
        '  [["abandon","放弃","v."], ...] 或\n' +
        '  {"words":[{"en":"abandon","zh":"放弃","pos":"v."}, ...]}\n\n' +
        '词库保存在浏览器本地，导出可备份或分享。'
      );
    }

    // 全局键盘拼写输入事件
    window.addEventListener('keydown', (e) => {
      if (!S.playing || S.shop) return;
      if (e.key === 'Tab') { e.preventDefault(); Battle.skipWord(); return; }
      if (e.key === 'Enter') { e.preventDefault(); Battle.submit(); return; }
      if (e.key === 'Backspace') {
        if (S.debuff && S.debuff.id === 'noback') return;
        S.typed = S.typed.slice(0, -1);
        UI.$('typed').textContent = S.typed;
        e.preventDefault();
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        S.typed += e.key.toLowerCase();
        UI.$('typed').textContent = S.typed;
        UI.$('typed').className = 'typed';
      }
    });

    // 点击页面任意非交互区域时自动聚焦隐藏输入框
    document.addEventListener('click', () => {
      if (S.playing && !S.shop) {
        const keysInput = UI.$('keys');
        if (keysInput) keysInput.focus();
      }
    });
  },
};

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => Main.init());
