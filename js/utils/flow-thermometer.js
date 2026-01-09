/**
 * Flow State Thermometer Utility
 * Track difficulty vs skill level to stay in flow
 * Hotkey: Alt+F
 */

const FlowThermometer = {
  STORAGE_KEY: 'pop_flow_thermometer',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          readings: [],
          intervalMinutes: 30,
          paused: false,
          pausedUntil: null,
          suggestions: {
            anxiety: 'Try breaking this task into smaller, manageable pieces.',
            boredom: 'Add a constraint or challenge to make it more interesting.',
            flow: 'Great! You are in the zone. Keep going!'
          }
        });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  calculateState(difficulty, skill) {
    const diff = difficulty - skill;
    if (diff > 2) return 'anxiety';
    if (diff < -2) return 'boredom';
    return 'flow';
  },

  async addReading(difficulty, skill) {
    const data = await this.getData();
    const reading = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      difficulty,
      skill,
      state: this.calculateState(difficulty, skill)
    };
    data.readings.unshift(reading);
    // Keep only last 100 readings
    data.readings = data.readings.slice(0, 100);
    await this.saveData(data);
    await this.render();
    return reading;
  },

  async pauseFor(minutes) {
    const data = await this.getData();
    const pausedUntil = new Date();
    pausedUntil.setMinutes(pausedUntil.getMinutes() + minutes);
    data.paused = true;
    data.pausedUntil = pausedUntil.toISOString();
    await this.saveData(data);
    await this.render();
  },

  async resume() {
    const data = await this.getData();
    data.paused = false;
    data.pausedUntil = null;
    await this.saveData(data);
    await this.render();
  },

  getStateStats(readings) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayReadings = readings.filter(r => new Date(r.timestamp) >= today);
    const flowCount = todayReadings.filter(r => r.state === 'flow').length;
    const anxietyCount = todayReadings.filter(r => r.state === 'anxiety').length;
    const boredomCount = todayReadings.filter(r => r.state === 'boredom').length;
    const total = todayReadings.length;

    return {
      flow: total > 0 ? Math.round((flowCount / total) * 100) : 0,
      anxiety: total > 0 ? Math.round((anxietyCount / total) * 100) : 0,
      boredom: total > 0 ? Math.round((boredomCount / total) * 100) : 0,
      total
    };
  },

  async render() {
    const container = document.getElementById('flow-thermometer-content');
    if (!container) return;

    const data = await this.getData();
    const lastReading = data.readings[0];
    const stats = this.getStateStats(data.readings);
    const isPaused = data.paused && data.pausedUntil && new Date(data.pausedUntil) > new Date();

    container.innerHTML = `
      ${isPaused ? `
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 10px; margin-bottom: 12px; text-align: center;">
          <p style="font-size: 12px; color: var(--accent-info); margin: 0 0 8px;">
            ⏸️ Paused until ${new Date(data.pausedUntil).toLocaleTimeString()}
          </p>
          <button class="btn btn-sm btn-secondary" id="ft-resume">Resume</button>
        </div>
      ` : ''}
      ${lastReading ? `
        <div style="text-align: center; padding: 16px; background: ${
          lastReading.state === 'flow' ? 'rgba(16, 185, 129, 0.15)' :
          lastReading.state === 'anxiety' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'
        }; border-radius: 12px; margin-bottom: 16px;">
          <div style="font-size: 32px; margin-bottom: 8px;">
            ${lastReading.state === 'flow' ? '🎯' : lastReading.state === 'anxiety' ? '😰' : '😴'}
          </div>
          <div style="font-size: 16px; font-weight: 600; color: ${
            lastReading.state === 'flow' ? 'var(--accent-success)' :
            lastReading.state === 'anxiety' ? 'var(--accent-danger)' : 'var(--accent-warning)'
          }; text-transform: capitalize;">
            ${lastReading.state === 'flow' ? 'In Flow!' : lastReading.state}
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
            ${data.suggestions[lastReading.state]}
          </div>
        </div>
      ` : `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 32px; margin-bottom: 8px;">🌡️</div>
          <div style="font-size: 13px; color: var(--text-muted);">Check in to track your flow state</div>
        </div>
      `}
      <button class="btn btn-primary btn-sm" id="ft-checkin" style="width: 100%; margin-bottom: 12px;">
        🌡️ Check Flow State
      </button>
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <button class="btn btn-secondary btn-sm" id="ft-pause-30" style="flex: 1;">Pause 30m</button>
        <button class="btn btn-secondary btn-sm" id="ft-pause-60" style="flex: 1;">Pause 1h</button>
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Today's Stats (${stats.total} check-ins)</div>
      <div style="display: flex; gap: 4px; height: 8px; border-radius: 4px; overflow: hidden;">
        <div style="width: ${stats.flow}%; background: var(--accent-success);" title="Flow: ${stats.flow}%"></div>
        <div style="width: ${stats.anxiety}%; background: var(--accent-danger);" title="Anxiety: ${stats.anxiety}%"></div>
        <div style="width: ${stats.boredom}%; background: var(--accent-warning);" title="Boredom: ${stats.boredom}%"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 4px;">
        <span>🎯 ${stats.flow}%</span>
        <span>😰 ${stats.anxiety}%</span>
        <span>😴 ${stats.boredom}%</span>
      </div>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'ft-checkin') {
        this.showCheckinModal();
      }

      if (e.target.id === 'ft-pause-30') {
        await this.pauseFor(30);
        window.showToast?.('Paused for 30 minutes', 'info');
      }

      if (e.target.id === 'ft-pause-60') {
        await this.pauseFor(60);
        window.showToast?.('Paused for 1 hour', 'info');
      }

      if (e.target.id === 'ft-resume') {
        await this.resume();
        window.showToast?.('Resumed flow tracking', 'info');
      }
    });
  },

  showCheckinModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'ft-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h2 class="modal-title">🌡️ Flow Check-in</h2>
          <button class="modal-close" data-dismiss="ft-modal">&times;</button>
        </div>
        <div class="input-group">
          <label class="input-label">Task Difficulty: <span id="ft-diff-val">5</span>/10</label>
          <input type="range" id="ft-difficulty" min="1" max="10" value="5" style="width: 100%;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted);">
            <span>Easy</span>
            <span>Hard</span>
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Your Skill Level: <span id="ft-skill-val">5</span>/10</label>
          <input type="range" id="ft-skill" min="1" max="10" value="5" style="width: 100%;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted);">
            <span>Novice</span>
            <span>Expert</span>
          </div>
        </div>
        <div id="ft-preview" style="text-align: center; padding: 16px; background: var(--glass-bg); border-radius: 12px; margin-bottom: 16px;">
          <div style="font-size: 24px; margin-bottom: 4px;">🎯</div>
          <div style="font-weight: 600; color: var(--accent-success);">Flow State</div>
        </div>
        <button class="btn btn-primary" id="ft-save" style="width: 100%;">Log Check-in</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="ft-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    const diffSlider = modal.querySelector('#ft-difficulty');
    const skillSlider = modal.querySelector('#ft-skill');
    const diffVal = modal.querySelector('#ft-diff-val');
    const skillVal = modal.querySelector('#ft-skill-val');
    const preview = modal.querySelector('#ft-preview');

    const updatePreview = () => {
      const difficulty = parseInt(diffSlider.value);
      const skill = parseInt(skillSlider.value);
      diffVal.textContent = difficulty;
      skillVal.textContent = skill;

      const state = this.calculateState(difficulty, skill);
      const stateConfig = {
        flow: { icon: '🎯', text: 'Flow State', color: 'var(--accent-success)', bg: 'rgba(16, 185, 129, 0.15)' },
        anxiety: { icon: '😰', text: 'Anxiety Zone', color: 'var(--accent-danger)', bg: 'rgba(239, 68, 68, 0.15)' },
        boredom: { icon: '😴', text: 'Boredom Zone', color: 'var(--accent-warning)', bg: 'rgba(245, 158, 11, 0.15)' }
      };
      const config = stateConfig[state];
      preview.style.background = config.bg;
      preview.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 4px;">${config.icon}</div>
        <div style="font-weight: 600; color: ${config.color};">${config.text}</div>
      `;
    };

    diffSlider.addEventListener('input', updatePreview);
    skillSlider.addEventListener('input', updatePreview);

    modal.querySelector('#ft-save').addEventListener('click', async () => {
      const difficulty = parseInt(diffSlider.value);
      const skill = parseInt(skillSlider.value);
      const reading = await this.addReading(difficulty, skill);
      window.showToast?.(`Logged: ${reading.state}`, reading.state === 'flow' ? 'success' : 'warning');
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  /**
   * Render expanded view with flow analytics
   */
  async renderExpanded() {
    const container = document.getElementById('flow-thermometer-content');
    if (!container) return;

    const data = await this.getData();
    const stats = this.getStateStats(data.readings);
    const lastReading = data.readings[0];
    const isPaused = data.paused && data.pausedUntil && new Date(data.pausedUntil) > new Date();

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString();
      const dayReadings = data.readings.filter(r => new Date(r.timestamp).toLocaleDateString() === dateKey);
      const flowCount = dayReadings.filter(r => r.state === 'flow').length;
      last7Days.push({ date: date.toLocaleDateString('en-US', { weekday: 'short' }), percent: dayReadings.length > 0 ? Math.round((flowCount / dayReadings.length) * 100) : 0 });
    }

    container.innerHTML = `
      <div class="expanded-content">
        <div class="expanded-header">
          <div class="expanded-title"><span class="expanded-title-icon">🌡️</span>Flow Thermometer</div>
          <div class="expanded-stats">
            <div class="expanded-stat"><div class="expanded-stat-value" style="color: var(--accent-success);">${stats.flow}%</div><div class="expanded-stat-label">Flow</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value" style="color: var(--accent-danger);">${stats.anxiety}%</div><div class="expanded-stat-label">Anxiety</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value" style="color: var(--accent-warning);">${stats.boredom}%</div><div class="expanded-stat-label">Boredom</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value">${stats.total}</div><div class="expanded-stat-label">Check-ins</div></div>
          </div>
        </div>

        <div style="margin-bottom: 24px; display: flex; gap: 8px;">
          <button class="btn btn-primary" id="ft-exp-checkin">🌡️ Check Flow State</button>
          ${isPaused ? '<button class="btn btn-secondary" id="ft-exp-resume">▶️ Resume</button>' : '<button class="btn btn-secondary" id="ft-exp-pause-30">⏸️ Pause 30m</button><button class="btn btn-secondary" id="ft-exp-pause-60">⏸️ Pause 1h</button>'}
        </div>

        ${isPaused ? `<div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;"><p style="font-size: 14px; color: var(--accent-info);">⏸️ Paused until ${new Date(data.pausedUntil).toLocaleTimeString()}</p></div>` : ''}

        <div class="expanded-grid-2" style="margin-bottom: 24px;">
          <div class="expanded-section">
            <div class="expanded-section-title"><span>📊</span> Current State</div>
            ${lastReading ? `<div style="text-align: center; padding: 30px; background: ${lastReading.state === 'flow' ? 'rgba(16, 185, 129, 0.15)' : lastReading.state === 'anxiety' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; border-radius: 12px;"><div style="font-size: 64px; margin-bottom: 12px;">${lastReading.state === 'flow' ? '🎯' : lastReading.state === 'anxiety' ? '😰' : '😴'}</div><div style="font-size: 24px; font-weight: 700; color: ${lastReading.state === 'flow' ? 'var(--accent-success)' : lastReading.state === 'anxiety' ? 'var(--accent-danger)' : 'var(--accent-warning)'}; text-transform: capitalize;">${lastReading.state === 'flow' ? 'In Flow!' : lastReading.state}</div><div style="font-size: 14px; color: var(--text-secondary);">Difficulty: ${lastReading.difficulty}/10 • Skill: ${lastReading.skill}/10</div><div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">${data.suggestions[lastReading.state]}</div></div>` : '<div style="text-align: center; padding: 40px;"><div style="font-size: 48px; margin-bottom: 16px;">🌡️</div><div style="color: var(--text-muted);">No readings yet</div></div>'}
          </div>

          <div class="expanded-section">
            <div class="expanded-section-title"><span>📈</span> Last 7 Days</div>
            <div style="display: flex; align-items: flex-end; gap: 8px; height: 150px; padding: 10px 0;">
              ${last7Days.map(day => `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%;"><div style="flex: 1; display: flex; align-items: flex-end; width: 100%;"><div style="width: 100%; height: ${day.percent}%; background: var(--accent-success); border-radius: 4px 4px 0 0; min-height: 4px;"></div></div><div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">${day.date}</div><div style="font-size: 10px; color: var(--accent-success);">${day.percent}%</div></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="expanded-section">
          <div class="expanded-section-title"><span>📋</span> Recent Check-ins</div>
          <ul class="item-list expanded-list" style="max-height: 300px;">
            ${data.readings.length === 0 ? '<li style="justify-content: center; color: var(--text-muted);">No check-ins yet</li>' : data.readings.slice(0, 30).map(r => `<li><div style="display: flex; align-items: center; gap: 12px; flex: 1;"><span style="font-size: 24px;">${r.state === 'flow' ? '🎯' : r.state === 'anxiety' ? '😰' : '😴'}</span><div style="flex: 1;"><div style="font-weight: 600; text-transform: capitalize; color: ${r.state === 'flow' ? 'var(--accent-success)' : r.state === 'anxiety' ? 'var(--accent-danger)' : 'var(--accent-warning)'};">${r.state}</div><div style="font-size: 11px; color: var(--text-muted);">D: ${r.difficulty} • S: ${r.skill}</div></div></div><div style="font-size: 11px; color: var(--text-muted);">${new Date(r.timestamp).toLocaleDateString()} ${new Date(r.timestamp).toLocaleTimeString()}</div></li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    const checkinBtn = container.querySelector('#ft-exp-checkin');
    if (checkinBtn) checkinBtn.onclick = () => this.showCheckinModal();

    const resumeBtn = container.querySelector('#ft-exp-resume');
    if (resumeBtn) resumeBtn.onclick = async () => { await this.resume(); if (typeof ExpandManager !== 'undefined' && ExpandManager.isExpanded('flowThermometer')) this.renderExpanded(); };

    const pause30 = container.querySelector('#ft-exp-pause-30');
    if (pause30) pause30.onclick = async () => { await this.pauseFor(30); window.showToast?.('Paused 30m', 'info'); if (typeof ExpandManager !== 'undefined' && ExpandManager.isExpanded('flowThermometer')) this.renderExpanded(); };

    const pause60 = container.querySelector('#ft-exp-pause-60');
    if (pause60) pause60.onclick = async () => { await this.pauseFor(60); window.showToast?.('Paused 1h', 'info'); if (typeof ExpandManager !== 'undefined' && ExpandManager.isExpanded('flowThermometer')) this.renderExpanded(); };
  },

  async exportToCSV() {
    const data = await this.getData();
    let csv = 'id,timestamp,difficulty,skill,state\n';
    data.readings.forEach(r => {
      csv += `"${r.id}","${r.timestamp}",${r.difficulty},${r.skill},"${r.state}"\n`;
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const readings = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 5) {
          readings.push({
            id: parts[0], timestamp: parts[1], difficulty: parseInt(parts[2]),
            skill: parseInt(parts[3]), state: parts[4]
          });
        }
      }
      const data = await this.getData();
      data.readings = merge ? [...data.readings, ...readings] : readings;
      await this.saveData(data);
      await this.render();
      return { success: true, count: readings.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => FlowThermometer.init());
} else {
  FlowThermometer.init();
}
