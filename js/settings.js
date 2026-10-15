/* ========== 单词肉鸽 · 设置面板 ========== */

const SettingsPanel = {
  // 初始化设置面板
  init() {
    // Apply saved theme on load
    Settings.applyTheme();
    
    // Bind the settings button
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.onclick = () => {
        Audio.playClick();
        UI.show('settings');
        this.render();
      };
    }
    
    const btnBackSettings = document.getElementById('btn-back-settings');
    if (btnBackSettings) {
      btnBackSettings.onclick = () => {
        Audio.playClick();
        UI.show('title');
        UI.refreshTitle();
      };
    }
  },

  // 渲染设置面板内容
  render() {
    const panel = document.getElementById('settings-content');
    if (!panel) return;
    
    const settings = Settings.getAll();
    
    panel.innerHTML = `
      <div class="setting-row">
        <label>🔊 音效音量</label>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="range" id="set-sfx" min="0" max="100" value="${Math.round(settings.sfxVolume * 100)}" />
          <span class="volume-value" id="sfx-val">${Math.round(settings.sfxVolume * 100)}%</span>
        </div>
      </div>
      <div class="setting-row">
        <label>🗣️ 语音音量</label>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="range" id="set-tts" min="0" max="100" value="${Math.round(settings.ttsVolume * 100)}" />
          <span class="volume-value" id="tts-val">${Math.round(settings.ttsVolume * 100)}%</span>
        </div>
      </div>
      <div class="setting-row">
        <label>📊 难度</label>
        <select id="set-diff">
          ${Object.entries(DIFFICULTY).map(([k, v]) => 
            `<option value="${k}" ${k === settings.difficulty ? 'selected' : ''}>${v.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="setting-row">
        <label>🎨 主题</label>
        <select id="set-theme">
          ${Object.entries(THEMES).map(([k, v]) => 
            `<option value="${k}" ${k === settings.theme ? 'selected' : ''}>${v.label}</option>`
          ).join('')}
        </select>
      </div>
    `;
    
    // Bind events
    document.getElementById('set-sfx').oninput = (e) => {
      const v = e.target.value / 100;
      Settings.set('sfxVolume', v);
      Audio.setVolume(v);
      document.getElementById('sfx-val').textContent = e.target.value + '%';
    };
    
    document.getElementById('set-tts').oninput = (e) => {
      const v = e.target.value / 100;
      Settings.set('ttsVolume', v);
      document.getElementById('tts-val').textContent = e.target.value + '%';
    };
    
    document.getElementById('set-diff').onchange = (e) => {
      Settings.set('difficulty', e.target.value);
      Audio.playClick();
    };
    
    document.getElementById('set-theme').onchange = (e) => {
      Settings.set('theme', e.target.value);
      Settings.applyTheme();
      Audio.playClick();
    };
  },
};
