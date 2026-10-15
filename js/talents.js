/* ========== 单词肉鸽 · 局外天赋祭坛 (Meta-Progression) ========== */

const Talents = {
  COINS_KEY: 'lexi-scholar-coins',
  DATA_KEY: 'lexi-talents-data',

  // 天赋定义清单
  DEFS: [
    {
      id: 'start_gold',
      name: '启动资金',
      icon: '🎒',
      desc: '每局开局自带额外初始金币',
      maxLevel: 3,
      costs: [80, 200, 450],
      effect: (lvl) => [0, 30, 60, 100][lvl] || 0,
      formatEffect: (lvl) => lvl === 0 ? '+0 💰' : `+${[0, 30, 60, 100][lvl]} 初始金币`,
    },
    {
      id: 'max_hp',
      name: '学者体魄',
      icon: '💖',
      desc: '提高开局基础生命值与最大上限',
      maxLevel: 2,
      costs: [120, 320],
      effect: (lvl) => lvl || 0,
      formatEffect: (lvl) => lvl === 0 ? '+0 ❤' : `生命上限 +${lvl}`,
    },
    {
      id: 'time_bonus',
      name: '思维敏捷',
      icon: '⏱️',
      desc: '答题基础时限永久延长',
      maxLevel: 3,
      costs: [90, 220, 400],
      effect: (lvl) => lvl * 0.6,
      formatEffect: (lvl) => lvl === 0 ? '+0s' : `基础时限 +${(lvl * 0.6).toFixed(1)}s`,
    },
    {
      id: 'auto_len',
      name: '求知若渴',
      icon: '🔍',
      desc: '开局自带“音节尺（显示字母数）”提示',
      maxLevel: 1,
      costs: [150],
      effect: (lvl) => lvl > 0,
      formatEffect: (lvl) => lvl > 0 ? '已激活' : '未解锁',
    },
    {
      id: 'shop_discount',
      name: '商贾之友',
      icon: '🏷️',
      desc: '局内商店商品享受专属折扣',
      maxLevel: 2,
      costs: [180, 380],
      effect: (lvl) => [0, 0.15, 0.25][lvl] || 0,
      formatEffect: (lvl) => lvl === 0 ? '无折扣' : `全场 ${Math.round((1 - [0, 0.15, 0.25][lvl]) * 100)}% 售价`,
    },
    {
      id: 'interest_boost',
      name: '财商精明',
      icon: '📈',
      desc: '过关存钱利息上限提升',
      maxLevel: 2,
      costs: [100, 260],
      effect: (lvl) => [15, 25, 40][lvl] || 15,
      formatEffect: (lvl) => `利息上限 ${[15, 25, 40][lvl]} 💰`,
    },
  ],

  // 获取学识金币
  getCoins() {
    return Number(localStorage.getItem(this.COINS_KEY) || 0);
  },

  // 增加学识币
  addCoins(amount) {
    if (amount <= 0) return this.getCoins();
    const total = this.getCoins() + amount;
    localStorage.setItem(this.COINS_KEY, String(total));
    return total;
  },

  // 消耗学识币
  spendCoins(amount) {
    const current = this.getCoins();
    if (current < amount) return false;
    localStorage.setItem(this.COINS_KEY, String(current - amount));
    return true;
  },

  // 读取已习得天赋数据 { talentId: level }
  getData() {
    try {
      return JSON.parse(localStorage.getItem(this.DATA_KEY)) || {};
    } catch (_) {
      return {};
    }
  },

  // 获取某天赋当前等级
  getLevel(talentId) {
    const data = this.getData();
    return Number(data[talentId] || 0);
  },

  // 获取某天赋的当前数值效果
  getEffect(talentId) {
    const def = this.DEFS.find(d => d.id === talentId);
    if (!def) return 0;
    return def.effect(this.getLevel(talentId));
  },

  // 升级天赋
  upgrade(talentId) {
    const def = this.DEFS.find(d => d.id === talentId);
    if (!def) return { success: false, msg: '天赋不存在' };

    const curLvl = this.getLevel(talentId);
    if (curLvl >= def.maxLevel) {
      return { success: false, msg: '已达最高等级' };
    }

    const cost = def.costs[curLvl];
    if (this.getCoins() < cost) {
      return { success: false, msg: '学识币不足' };
    }

    if (this.spendCoins(cost)) {
      const data = this.getData();
      data[talentId] = curLvl + 1;
      localStorage.setItem(this.DATA_KEY, JSON.stringify(data));
      return { success: true, newLevel: curLvl + 1, cost };
    }

    return { success: false, msg: '扣除学识币失败' };
  },

  // 重置天赋（返还100%学识币）
  resetAll() {
    const data = this.getData();
    let refunded = 0;
    for (const [id, lvl] of Object.entries(data)) {
      const def = this.DEFS.find(d => d.id === id);
      if (def && lvl > 0) {
        for (let i = 0; i < lvl; i++) {
          refunded += def.costs[i] || 0;
        }
      }
    }
    this.addCoins(refunded);
    localStorage.removeItem(this.DATA_KEY);
    return refunded;
  },
};
