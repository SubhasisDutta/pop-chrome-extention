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
