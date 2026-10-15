/* ========== 单词肉鸽 · 游戏配置 ========== */

// 商店商品库（含 Buff 与消耗品，分级定价）
const BUFFS = [
  // 普通品质 (Common - 30~45💰)
  { id: "heal1", name: "急救绷带", desc: "立刻回复 1 点生命", cost: 25, type: "consumable", rarity: "common", icon: "🩹" },
  { id: "time",  name: "沙漏加持", desc: "答题时限 +1.4 秒", cost: 35, type: "buff", rarity: "common", icon: "⏳" },
  { id: "skip",  name: "跳过权",   desc: "获得 1 次跳过（按 Tab 键）", cost: 40, type: "consumable", rarity: "common", icon: "⏭️" },

  // 稀有品质 (Rare - 50~70💰)
  { id: "heal2", name: "强效药剂", desc: "立刻回复 2 点生命", cost: 50, type: "consumable", rarity: "rare", icon: "🧪" },
  { id: "crit",  name: "暴击词典", desc: "30% 几率得分与攻击翻倍", cost: 55, type: "buff", rarity: "rare", icon: "💥" },
  { id: "hint",  name: "首字母透视", desc: "常驻显示单词首字母", cost: 50, type: "buff", rarity: "rare", icon: "👁️" },
  { id: "len",   name: "音节尺",   desc: "常驻显示单词字母数", cost: 45, type: "buff", rarity: "rare", icon: "📏" },
  { id: "gold",  name: "词商之印", desc: "答题与通关金币收益 +50%", cost: 55, type: "buff", rarity: "rare", icon: "💰" },
  { id: "combo", name: "热血连击", desc: "连击伤害与得分倍率 +0.25", cost: 60, type: "buff", rarity: "rare", icon: "🔥" },

  // 史诗品质 (Epic - 75~95💰)
  { id: "shield", name: "错题护盾", desc: "获得 1 层伤害免伤护盾", cost: 75, type: "buff", rarity: "epic", icon: "🛡️" },
  { id: "slow",   name: "时间膨胀", desc: "倒计时流逝速度减缓 20%", cost: 80, type: "buff", rarity: "epic", icon: "🌀" },
  { id: "big_heart", name: "生命灵药", desc: "生命上限 +1 并立刻回满", cost: 95, type: "buff", rarity: "epic", icon: "💖" },
];

// Debuff 定义（Boss 关使用）
const DEBUFFS = [
  {id:"fog", name:"迷雾试卷", desc:"部分字母被雾挡住"},
  {id:"haste", name:"deadline", desc:"倒计时加快 28%"},
  {id:"noback", name:"一锤定音", desc:"本回合不能退格"},
];

// 怪物定义
const MONSTERS = [
  {name:"生词史莱姆", sprite:"👾", hp:2},
  {name:"错题蝙蝠", sprite:"🦇", hp:3},
  {name:"语法骷髅", sprite:"💀", hp:3},
  {name:"词根章鱼", sprite:"🐙", hp:4},
  {name:"词霸巨龙", sprite:"🐲", hp:6, boss:true},
];

// 难度预设
const DIFFICULTY = {
  easy:   { label: "简单", timeMul: 1.4, hpMul: 0.7, scoreMul: 0.7 },
  normal: { label: "普通", timeMul: 1.0, hpMul: 1.0, scoreMul: 1.0 },
  hard:   { label: "困难", timeMul: 0.7, hpMul: 1.4, scoreMul: 1.5 },
};

// 主题定义
const THEMES = {
  red:   { label: "暗黑赤红", value: "red" },
  blue:  { label: "深海蓝", value: "blue" },
  green: { label: "翡翠绿", value: "green" },
};

// 间隔重复：盒子级别对应的复习间隔（天）
const BOX_DAYS = [0, 0.02, 1, 2, 4, 7, 14, 21];
const DAY_MS = 86400000;

// 设置管理器
const Settings = {
  _key: "lexi-settings",
  _defaults: {
    sfxVolume: 0.6,
    ttsVolume: 0.8,
    difficulty: "normal",
    theme: "red",
    showKeyboardHint: false,
  },
  _cache: null,

  _load() {
    if (!this._cache) {
      try {
        this._cache = { ...this._defaults, ...JSON.parse(localStorage.getItem(this._key)) };
      } catch (_) {
        this._cache = { ...this._defaults };
      }
    }
    return this._cache;
  },

  _save() {
    try { localStorage.setItem(this._key, JSON.stringify(this._cache)); } catch (_) {}
  },

  get(key) {
    return this._load()[key] ?? this._defaults[key];
  },

  set(key, value) {
    this._load();
    this._cache[key] = value;
    this._save();
  },

  getAll() {
    return { ...this._load() };
  },

  getDifficulty() {
    return DIFFICULTY[this.get("difficulty")] || DIFFICULTY.normal;
  },

  getTheme() {
    return this.get("theme");
  },

  applyTheme() {
    document.body.setAttribute("data-theme", this.getTheme());
  },
};
