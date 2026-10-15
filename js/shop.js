/* ========== 单词肉鸽 · 货架商店系统 ========== */

const Shop = {
  currentItems: [],
  rerollCost: 15,

  // 打开商店
  open() {
    S.shop = true;
    cancelAnimationFrame(S.raf);
    this.rerollCost = 15;

    // 存钱利息结算机制（每 50 金币产生 5 金币利息，受天赋加成上限）
    const baseInterest = Math.floor(S.gold / 50) * 5;
    const maxInterest = (typeof Talents !== 'undefined') ? Talents.getEffect('interest_boost') : 15;
    const actualInterest = Math.min(baseInterest, maxInterest);
    
    const shopNotice = UI.$('shop-notice');
    if (actualInterest > 0) {
      S.gold += actualInterest;
      if (shopNotice) {
        shopNotice.textContent = `🏦 存钱利息到账：+${actualInterest} 金币（当前利率 10%）`;
        shopNotice.style.display = 'block';
      }
    } else if (shopNotice) {
      shopNotice.textContent = '💡 提示：每保留 50 金币，进店时可额外获得 5 金币存款利息！';
      shopNotice.style.display = 'block';
    }

    this.generateItems();
    this.render();
    Audio.playShop();
    UI.show('shop');
  },

  // 生成商店货物
  generateItems() {
    const discount = (typeof Talents !== 'undefined') ? Talents.getEffect('shop_discount') : 0;
    const pool = Utils.shuffle(BUFFS);
    const selected = pool.slice(0, 3);

    this.currentItems = selected.map(item => {
      const discountedCost = Math.max(10, Math.round(item.cost * (1 - discount)));
      return {
        ...item,
        finalCost: discountedCost,
        bought: false,
      };
    });
  },

  // 渲染商店界面
  render() {
    const goldEl = UI.$('shop-gold');
    if (goldEl) goldEl.textContent = S.gold;

    const cardsEl = UI.$('cards');
    if (!cardsEl) return;

    cardsEl.innerHTML = this.currentItems.map((item, index) => {
      const rarityLabel = { common: '普通', rare: '稀有', epic: '史诗' }[item.rarity] || '普通';
      const canAfford = S.gold >= item.finalCost;

      let actionHtml;
      if (item.bought) {
        actionHtml = `<span class="sold-tag">✓ 已售罄</span>`;
      } else if (canAfford) {
        actionHtml = `<button class="buy-btn" data-index="${index}">购买 (${item.finalCost}💰)</button>`;
      } else {
        actionHtml = `<button class="buy-btn disabled" disabled>金币不足 (${item.finalCost}💰)</button>`;
      }

      return `
        <div class="card ${item.rarity}">
          <div class="card-header">
            <span class="card-icon">${item.icon || '✨'}</span>
            <span class="rarity-badge ${item.rarity}">${rarityLabel}</span>
          </div>
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
          <div class="card-footer">
            ${actionHtml}
          </div>
        </div>
      `;
    }).join('');

    // 绑定购买点击事件
    cardsEl.onclick = (e) => {
      const btn = e.target.closest('.buy-btn:not(.disabled)');
      if (!btn) return;
      const index = parseInt(btn.dataset.index, 10);
      if (!isNaN(index)) {
        this.buy(index);
      }
    };

    // 刷新按钮状态
    const btnReroll = UI.$('btn-reroll-shop');
    if (btnReroll) {
      if (S.gold >= this.rerollCost) {
        btnReroll.textContent = `🎲 刷新货架（${this.rerollCost}💰）`;
        btnReroll.disabled = false;
        btnReroll.classList.remove('disabled');
      } else {
        btnReroll.textContent = `🎲 刷新（${this.rerollCost}💰 · 金币不足）`;
        btnReroll.disabled = true;
        btnReroll.classList.add('disabled');
      }
    }
  },

  // 购买商品
  buy(index) {
    const item = this.currentItems[index];
    if (!item || item.bought) return;

    if (S.gold < item.finalCost) {
      Audio.playWrong();
      return;
    }

    S.gold -= item.finalCost;
    item.bought = true;
    this.applyItemEffect(item.id);
    Audio.playBuy();
    UI.fx(`-${item.finalCost}💰`);

    // 同步更新 HUD 状态
    UI.renderAll();
    this.render();
  },

  // 刷新货架
  reroll() {
    if (S.gold < this.rerollCost) {
      Audio.playWrong();
      return;
    }

    S.gold -= this.rerollCost;
    Audio.playReroll();
    this.rerollCost += 5;
    this.generateItems();
    this.render();
    UI.renderAll();
  },

  // 关闭商店，继续探险
  close() {
    S.shop = false;
    UI.show('game');
    const keysInput = UI.$('keys');
    if (keysInput) keysInput.focus();
    Battle.nextWord();
  },

  // 应用商品效果
  applyItemEffect(id) {
    const maxHp = S.maxHp || 5;
    switch (id) {
      case 'heal1':
        S.hp = Math.min(maxHp, S.hp + 1);
        break;
      case 'heal2':
        S.hp = Math.min(maxHp, S.hp + 2);
        break;
      case 'big_heart':
        S.maxHp = maxHp + 1;
        S.hp = S.maxHp;
        break;
      case 'time':
        S.timeBonus += 1.4;
        break;
      case 'skip':
        S.skips += 1;
        break;
      case 'crit':
        S.crit = Math.min(0.8, S.crit + 0.3);
        break;
      case 'hint':
        S.showHint = true;
        break;
      case 'len':
        S.showLen = true;
        break;
      case 'gold':
        S.goldMul += 0.5;
        break;
      case 'combo':
        S.comboMul += 0.25;
        break;
      case 'shield':
        S.shield += 1;
        break;
      case 'slow':
        S.slow += 0.20;
        break;
      default:
        console.warn('未知商品类型', id);
    }
  },
};
