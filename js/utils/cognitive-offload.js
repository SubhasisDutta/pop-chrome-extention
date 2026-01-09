/**
 * Cognitive Offload Utility
 * Quick capture thoughts with GTD tagging (Actionable/Reference)
 * Hotkey: Alt+C
 */

const CognitiveOffload = {
  STORAGE_KEY: 'pop_cognitive_offload',

  /**
   * Initialize the utility
   */
  async init() {
    await this.render();
    this.bindEvents();
  },

  /**
   * Get data from storage
   */
  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || { thoughts: [] });
      });
    });
  },

  /**
   * Save data to storage
   */
  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  /**
   * Add a new thought
   */
  async addThought(text, type) {
    const data = await this.getData();
    const thought = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      text,
      type,
      createdAt: new Date().toISOString(),
      completed: false
    };
    data.thoughts.unshift(thought);
    await this.saveData(data);
    await this.render();
    return thought;
  },

  /**
   * Toggle thought completion
   */
  async toggleComplete(id) {
    const data = await this.getData();
    const thought = data.thoughts.find(t => t.id === id);
    if (thought) {
      thought.completed = !thought.completed;
      await this.saveData(data);
      await this.render();
    }
  },

  /**
   * Delete a thought
   */
  async deleteThought(id) {
    const data = await this.getData();
    data.thoughts = data.thoughts.filter(t => t.id !== id);
    await this.saveData(data);
    await this.render();
  },

  /**
   * Render the utility content
   */
  async render() {
    const container = document.getElementById('cognitive-offload-content');
    if (!container) return;

    const data = await this.getData();
    const actionableCount = data.thoughts.filter(t => t.type === 'actionable' && !t.completed).length;
    const referenceCount = data.thoughts.filter(t => t.type === 'reference').length;

    // Update counts
    const actionableEl = document.getElementById('co-actionable-count');
    const referenceEl = document.getElementById('co-reference-count');
    if (actionableEl) actionableEl.textContent = actionableCount;
    if (referenceEl) referenceEl.textContent = referenceCount;

    // Render thoughts list
    const recentThoughts = data.thoughts.slice(0, 5);

    container.innerHTML = `
      <div class="input-group" style="margin-bottom: 12px;">
        <div style="display: flex; gap: 8px;">
          <input type="text" class="input" id="co-input" placeholder="Capture a thought..." style="flex: 1;">
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="btn btn-sm" id="co-actionable-btn" style="flex: 1; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
            ✓ Actionable
          </button>
          <button class="btn btn-sm" id="co-reference-btn" style="flex: 1; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);">
            📚 Reference
          </button>
        </div>
      </div>
      <ul class="item-list" style="max-height: 200px;">
        ${recentThoughts.length === 0 ? `
          <li style="justify-content: center; color: var(--text-muted);">
            No thoughts captured yet. Press Alt+C for quick capture!
          </li>
        ` : recentThoughts.map(thought => `
          <li data-id="${thought.id}" style="${thought.completed ? 'opacity: 0.5;' : ''}">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
              <input type="checkbox" ${thought.completed ? 'checked' : ''} class="co-checkbox" style="cursor: pointer;">
              <span class="tag ${thought.type === 'actionable' ? 'tag-actionable' : 'tag-reference'}" style="font-size: 10px;">
                ${thought.type === 'actionable' ? '✓' : '📚'}
              </span>
              <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${thought.completed ? 'text-decoration: line-through;' : ''}">
                ${this.escapeHtml(thought.text)}
              </span>
            </div>
            <button class="btn btn-icon btn-sm co-delete" style="opacity: 0.5; width: 28px; height: 28px;" title="Delete">🗑️</button>
          </li>
        `).join('')}
      </ul>
      ${data.thoughts.length > 5 ? `
        <div style="text-align: center; margin-top: 8px;">
          <button class="btn btn-sm btn-secondary" id="co-view-all">View All (${data.thoughts.length})</button>
        </div>
      ` : ''}
    `;
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    document.addEventListener('click', async (e) => {
      // Add actionable thought
      if (e.target.id === 'co-actionable-btn') {
        const input = document.getElementById('co-input');
        if (input && input.value.trim()) {
          await this.addThought(input.value.trim(), 'actionable');
          input.value = '';
          this.showToast('Thought captured as Actionable!', 'success');
        }
      }

      // Add reference thought
      if (e.target.id === 'co-reference-btn') {
        const input = document.getElementById('co-input');
        if (input && input.value.trim()) {
          await this.addThought(input.value.trim(), 'reference');
          input.value = '';
          this.showToast('Thought captured as Reference!', 'success');
        }
      }

      // Delete thought
      if (e.target.classList.contains('co-delete')) {
        const li = e.target.closest('li');
        if (li) {
          await this.deleteThought(li.dataset.id);
        }
      }

      // View all modal
      if (e.target.id === 'co-view-all') {
        this.showAllThoughtsModal();
      }
    });

    // Checkbox change
    document.addEventListener('change', async (e) => {
      if (e.target.classList.contains('co-checkbox')) {
        const li = e.target.closest('li');
        if (li) {
          await this.toggleComplete(li.dataset.id);
        }
      }
    });

    // Enter key to submit
    document.addEventListener('keydown', (e) => {
      if (e.target.id === 'co-input' && e.key === 'Enter') {
        const actionableBtn = document.getElementById('co-actionable-btn');
        if (actionableBtn) actionableBtn.click();
      }
    });
  },

  /**
   * Show all thoughts in a modal
   */
  async showAllThoughtsModal() {
    const data = await this.getData();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'co-all-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h2 class="modal-title">💡 All Thoughts</h2>
          <button class="modal-close" data-dismiss="co-all-modal">&times;</button>
        </div>
        <div class="nav-tabs" style="margin-bottom: 16px;">
          <button class="nav-tab active" data-filter="all">All (${data.thoughts.length})</button>
          <button class="nav-tab" data-filter="actionable">Actionable (${data.thoughts.filter(t => t.type === 'actionable').length})</button>
          <button class="nav-tab" data-filter="reference">Reference (${data.thoughts.filter(t => t.type === 'reference').length})</button>
        </div>
        <ul class="item-list" id="co-modal-list" style="max-height: 400px;">
          ${data.thoughts.map(thought => `
            <li data-id="${thought.id}" data-type="${thought.type}" style="${thought.completed ? 'opacity: 0.5;' : ''}">
              <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                <input type="checkbox" ${thought.completed ? 'checked' : ''} class="co-modal-checkbox">
                <span class="tag ${thought.type === 'actionable' ? 'tag-actionable' : 'tag-reference'}" style="font-size: 10px;">
                  ${thought.type === 'actionable' ? '✓' : '📚'}
                </span>
                <div style="flex: 1; min-width: 0;">
                  <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${thought.completed ? 'text-decoration: line-through;' : ''}">
                    ${this.escapeHtml(thought.text)}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted);">
                    ${new Date(thought.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button class="btn btn-icon btn-sm co-modal-delete" style="opacity: 0.5;">🗑️</button>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="co-all-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    // Filter tabs
    modal.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        modal.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.dataset.filter;
        modal.querySelectorAll('#co-modal-list li').forEach(li => {
          if (filter === 'all' || li.dataset.type === filter) {
            li.style.display = '';
          } else {
            li.style.display = 'none';
          }
        });
      });
    });

    // Delete from modal
    modal.querySelectorAll('.co-modal-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const li = btn.closest('li');
        await this.deleteThought(li.dataset.id);
        li.remove();
      });
    });

    // Toggle from modal
    modal.querySelectorAll('.co-modal-checkbox').forEach(cb => {
      cb.addEventListener('change', async () => {
        const li = cb.closest('li');
        await this.toggleComplete(li.dataset.id);
        li.style.opacity = cb.checked ? '0.5' : '1';
      });
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    }
  },

  /**
   * Render expanded view with full features
   */
  async renderExpanded() {
    const container = document.getElementById('cognitive-offload-content');
    if (!container) return;

    const data = await this.getData();
    const actionableThoughts = data.thoughts.filter(t => t.type === 'actionable');
    const referenceThoughts = data.thoughts.filter(t => t.type === 'reference');
    const completedCount = data.thoughts.filter(t => t.completed).length;
    const activeCount = data.thoughts.filter(t => !t.completed).length;

    // Group by date
    const groupedByDate = {};
    data.thoughts.forEach(t => {
      const dateKey = new Date(t.createdAt).toLocaleDateString();
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(t);
    });

    container.innerHTML = `
      <div class="expanded-content">
        <div class="expanded-header">
          <div class="expanded-title">
            <span class="expanded-title-icon">💡</span>
            Cognitive Offload
          </div>
          <div class="expanded-stats">
            <div class="expanded-stat">
              <div class="expanded-stat-value">${data.thoughts.length}</div>
              <div class="expanded-stat-label">Total Thoughts</div>
            </div>
            <div class="expanded-stat">
              <div class="expanded-stat-value" style="color: var(--accent-success);">${activeCount}</div>
              <div class="expanded-stat-label">Active</div>
            </div>
            <div class="expanded-stat">
              <div class="expanded-stat-value" style="color: var(--text-muted);">${completedCount}</div>
              <div class="expanded-stat-label">Completed</div>
            </div>
          </div>
        </div>

        <div class="expanded-grid-2" style="margin-bottom: 24px;">
          <div class="expanded-section">
            <div class="expanded-section-title">
              <span>✓</span> Quick Capture
            </div>
            <div class="input-group" style="margin-bottom: 12px;">
              <input type="text" class="input" id="co-expanded-input" placeholder="What's on your mind?">
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-sm" id="co-expanded-actionable" style="flex: 1; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
                ✓ Actionable
              </button>
              <button class="btn btn-sm" id="co-expanded-reference" style="flex: 1; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);">
                📚 Reference
              </button>
            </div>
          </div>
          <div class="expanded-section">
            <div class="expanded-section-title">
              <span>📊</span> Statistics
            </div>
            <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
              <div class="stat-item">
                <div class="stat-value" style="color: var(--accent-success);">${actionableThoughts.filter(t => !t.completed).length}</div>
                <div class="stat-label">Actionable Pending</div>
              </div>
              <div class="stat-item">
                <div class="stat-value" style="color: var(--accent-info);">${referenceThoughts.length}</div>
                <div class="stat-label">References</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${Object.keys(groupedByDate).length}</div>
                <div class="stat-label">Days Active</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${completedCount > 0 ? Math.round((completedCount / data.thoughts.length) * 100) : 0}%</div>
                <div class="stat-label">Completion Rate</div>
              </div>
            </div>
          </div>
        </div>

        <div class="expanded-grid-2">
          <div class="expanded-section">
            <div class="expanded-section-title">
              <span style="color: var(--accent-success);">✓</span> Actionable Items (${actionableThoughts.length})
            </div>
            <ul class="item-list expanded-list">
              ${actionableThoughts.length === 0 ? `
                <li style="justify-content: center; color: var(--text-muted);">No actionable items</li>
              ` : actionableThoughts.map(thought => `
                <li data-id="${thought.id}" style="${thought.completed ? 'opacity: 0.5;' : ''}">
                  <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                    <input type="checkbox" ${thought.completed ? 'checked' : ''} class="co-expanded-checkbox" style="cursor: pointer; width: 18px; height: 18px;">
                    <div style="flex: 1; min-width: 0;">
                      <div style="${thought.completed ? 'text-decoration: line-through;' : ''}">${this.escapeHtml(thought.text)}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${new Date(thought.createdAt).toLocaleDateString()} ${new Date(thought.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <button class="btn btn-icon btn-sm co-expanded-delete" style="opacity: 0.5;">🗑️</button>
                </li>
              `).join('')}
            </ul>
          </div>
          <div class="expanded-section">
            <div class="expanded-section-title">
              <span style="color: var(--accent-info);">📚</span> Reference Items (${referenceThoughts.length})
            </div>
            <ul class="item-list expanded-list">
              ${referenceThoughts.length === 0 ? `
                <li style="justify-content: center; color: var(--text-muted);">No reference items</li>
              ` : referenceThoughts.map(thought => `
                <li data-id="${thought.id}">
                  <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                    <span style="font-size: 16px;">📚</span>
                    <div style="flex: 1; min-width: 0;">
                      <div>${this.escapeHtml(thought.text)}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${new Date(thought.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button class="btn btn-icon btn-sm co-expanded-delete" style="opacity: 0.5;">🗑️</button>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    this.bindExpandedEvents();
  },

  /**
   * Bind expanded view events
   */
  bindExpandedEvents() {
    const container = document.getElementById('cognitive-offload-content');
    if (!container) return;

    // Quick capture in expanded view
    const expandedInput = container.querySelector('#co-expanded-input');
    const actionableBtn = container.querySelector('#co-expanded-actionable');
    const referenceBtn = container.querySelector('#co-expanded-reference');

    if (actionableBtn) {
      actionableBtn.onclick = async () => {
        if (expandedInput && expandedInput.value.trim()) {
          await this.addThought(expandedInput.value.trim(), 'actionable');
          expandedInput.value = '';
          this.showToast('Thought captured as Actionable!', 'success');
          if (typeof ExpandManager !== 'undefined' && ExpandManager.isExpanded('cognitiveOffload')) {
            this.renderExpanded();
          }
        }
      };
    }

    if (referenceBtn) {
      referenceBtn.onclick = async () => {
        if (expandedInput && expandedInput.value.trim()) {
          await this.addThought(expandedInput.value.trim(), 'reference');
          expandedInput.value = '';
          this.showToast('Thought captured as Reference!', 'success');
          if (typeof ExpandManager !== 'undefined' && ExpandManager.isExpanded('cognitiveOffload')) {
            this.renderExpanded();
          }
        }
      };
    }

    // Delete buttons
    container.querySelectorAll('.co-expanded-delete').forEach(btn => {
      btn.onclick = async (e) => {
        const li = e.target.closest('li');
        if (li) {
          await this.deleteThought(li.dataset.id);
          if (typeof ExpandManager !== 'undefined' && ExpandManager.isExpanded('cognitiveOffload')) {
            this.renderExpanded();
          }
        }
      };
    });

    // Checkboxes
    container.querySelectorAll('.co-expanded-checkbox').forEach(cb => {
      cb.onchange = async (e) => {
        const li = e.target.closest('li');
        if (li) {
          await this.toggleComplete(li.dataset.id);
          if (typeof ExpandManager !== 'undefined' && ExpandManager.isExpanded('cognitiveOffload')) {
            this.renderExpanded();
          }
        }
      };
    });

    // Enter key
    if (expandedInput) {
      expandedInput.onkeydown = (e) => {
        if (e.key === 'Enter' && actionableBtn) actionableBtn.click();
      };
    }
  },

  /**
   * Export data to CSV
   */
  async exportToCSV() {
    const data = await this.getData();
    let csv = 'id,text,type,createdAt,completed\n';
    data.thoughts.forEach(t => {
      csv += `"${t.id}","${t.text.replace(/"/g, '""')}","${t.type}","${t.createdAt}",${t.completed}\n`;
    });
    return csv;
  },

  /**
   * Import data from CSV
   */
  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) throw new Error('Invalid CSV');

      const thoughts = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = this.parseCSVLine(lines[i]);
        if (parts.length >= 5) {
          thoughts.push({
            id: parts[0] || Date.now().toString(36),
            text: parts[1],
            type: parts[2],
            createdAt: parts[3],
            completed: parts[4] === 'true'
          });
        }
      }

      if (merge) {
        const existing = await this.getData();
        existing.thoughts = [...existing.thoughts, ...thoughts];
        await this.saveData(existing);
      } else {
        await this.saveData({ thoughts });
      }

      await this.render();
      return { success: true, count: thoughts.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }
    values.push(current);
    return values;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CognitiveOffload.init());
} else {
  CognitiveOffload.init();
}
