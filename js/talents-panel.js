/* ========== 单词肉鸽 · 学识祭坛天赋面板组件 ========== */

const TalentsPanel = {
  init() {
    const btnTalents = UI.$('btn-talents');
    if (btnTalents) {
      btnTalents.onclick = () => {
        Audio.playClick();
        UI.show('talents');
        this.render();
      };
    }

    const btnBack = UI.$('btn-back-talents');
    if (btnBack) {
      btnBack.onclick = () => {
        Audio.playClick();
        UI.show('title');
        UI.refreshTitle();
      };
    }

    const btnReset = UI.$('btn-reset-talents');
    if (btnReset) {
      btnReset.onclick = () => {
        if (!confirm('确定要重置所有已学习的天赋吗？\n所有消耗的学识币将 100% 全额返还。')) return;
        const refunded = Talents.resetAll();
        Audio.playTalent();
        alert(`已成功重置！已全额返还 ${refunded} 学识币。`);
        this.render();
        UI.refreshTitle();
      };
    }
  },

  // 渲染学识祭坛界面
  render() {
    const coinsEl = UI.$('talents-coins-val');
    if (coinsEl) {
      coinsEl.textContent = Talents.getCoins();
    }

    const gridEl = UI.$('talents-grid');
    if (!gridEl) return;

    const currentCoins = Talents.getCoins();

    gridEl.innerHTML = Talents.DEFS.map(def => {
      const curLvl = Talents.getLevel(def.id);
      const isMax = curLvl >= def.maxLevel;
      const nextCost = isMax ? 0 : def.costs[curLvl];
      const canAfford = !isMax && currentCoins >= nextCost;

      // 渲染等级指示灯 ● ● ○
      let dotsHtml = '';
      for (let i = 0; i < def.maxLevel; i++) {
        dotsHtml += `<span class="lvl-dot ${i < curLvl ? 'active' : ''}"></span>`;
      }

      let btnHtml;
      if (isMax) {
        btnHtml = `<button class="talent-btn maxed" disabled>已达满级</button>`;
      } else if (canAfford) {
        btnHtml = `<button class="talent-btn" data-id="${def.id}">升级 (${nextCost}💰)</button>`;
      } else {
        btnHtml = `<button class="talent-btn disabled" disabled>学识币不足 (${nextCost}💰)</button>`;
      }

      return `
        <div class="talent-card ${isMax ? 'maxed' : ''}">
          <div class="talent-header">
            <span class="talent-icon">${def.icon}</span>
            <div class="talent-title-area">
              <h4>${def.name}</h4>
              <div class="lvl-dots">${dotsHtml}</div>
            </div>
          </div>
          <p class="talent-desc">${def.desc}</p>
          <div class="talent-effect-preview">
            当前效果：<b>${def.formatEffect(curLvl)}</b>
          </div>
          <div class="talent-footer">
            ${btnHtml}
          </div>
        </div>
      `;
    }).join('');

    // 点击升级事件委托
    gridEl.onclick = (e) => {
      const btn = e.target.closest('.talent-btn:not(.disabled):not(.maxed)');
      if (!btn) return;
      const talentId = btn.dataset.id;
      if (!talentId) return;

      const res = Talents.upgrade(talentId);
      if (res.success) {
        Audio.playTalent();
        this.render();
        UI.refreshTitle();
      } else {
        alert(res.msg);
      }
    };
  },
};
