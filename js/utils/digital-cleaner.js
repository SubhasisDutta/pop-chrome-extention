/**
 * Digital Room Cleaner Utility
 * Clean old bookmarks and reduce digital clutter
 * Hotkey: Alt+K
 */

const DigitalCleaner = {
  STORAGE_KEY: 'pop_digital_cleaner',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          processedBookmarks: [],
          archivedBookmarks: [],
          lastCleanDate: null,
          cleanOnStartup: true
        });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  async getOldBookmarks(limit = 3) {
    return new Promise((resolve) => {
      try {
        chrome.bookmarks.getTree(async (tree) => {
          const data = await this.getData();
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

          const bookmarks = [];
          const processBookmarkNode = (node) => {
            if (node.url && node.dateAdded) {
              const addedDate = new Date(node.dateAdded);
              if (addedDate < sixMonthsAgo && !data.processedBookmarks.includes(node.id)) {
                bookmarks.push({
                  id: node.id,
                  title: node.title,
                  url: node.url,
                  dateAdded: addedDate.toISOString()
                });
              }
            }
            if (node.children) {
              node.children.forEach(processBookmarkNode);
            }
          };

          tree.forEach(processBookmarkNode);

          // Sort by oldest first
          bookmarks.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
          resolve(bookmarks.slice(0, limit));
        });
      } catch (e) {
        // Fallback for demo/testing
        resolve([]);
      }
    });
  },

  async archiveBookmark(bookmark) {
    const data = await this.getData();
    data.archivedBookmarks.push({
      ...bookmark,
      archivedAt: new Date().toISOString()
    });
    data.processedBookmarks.push(bookmark.id);
    await this.saveData(data);

    // Keep in Chrome bookmarks (archived folder)
    try {
      // Move to an "Archived" folder
      chrome.bookmarks.search({ title: 'POP Archived' }, async (results) => {
        let archiveFolder = results[0];
        if (!archiveFolder) {
          archiveFolder = await new Promise((resolve) => {
            chrome.bookmarks.create({ title: 'POP Archived' }, resolve);
          });
        }
        chrome.bookmarks.move(bookmark.id, { parentId: archiveFolder.id });
      });
    } catch (e) {
      // Ignore if bookmarks API not available
    }

    await this.render();
  },

  async deleteBookmark(bookmark) {
    const data = await this.getData();
    data.processedBookmarks.push(bookmark.id);
    await this.saveData(data);

    try {
      chrome.bookmarks.remove(bookmark.id);
    } catch (e) {
      // Ignore if bookmarks API not available
    }

    await this.render();
  },

  async skipBookmark(bookmarkId) {
    const data = await this.getData();
    data.processedBookmarks.push(bookmarkId);
    await this.saveData(data);
    await this.render();
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const months = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return 'Less than a month ago';
    if (months === 1) return '1 month ago';
    return `${months} months ago`;
  },

  async render() {
    const container = document.getElementById('digital-cleaner-content');
    if (!container) return;

    const data = await this.getData();
    const oldBookmarks = await this.getOldBookmarks(3);

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 40px; margin-bottom: 8px;">🧹</div>
        <div style="font-size: 12px; color: var(--text-muted);">
          ${data.archivedBookmarks.length} archived • ${data.processedBookmarks.length} processed
        </div>
      </div>
      ${oldBookmarks.length === 0 ? `
        <div style="text-align: center; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 12px;">
          <div style="font-size: 24px; margin-bottom: 8px;">✨</div>
          <div style="font-weight: 600; color: var(--accent-success);">All Clean!</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">No old bookmarks to review</div>
        </div>
      ` : `
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
          Review these old bookmarks (6+ months):
        </div>
        ${oldBookmarks.map(bm => `
          <div class="glass-card-flat" style="padding: 12px; margin-bottom: 8px;" data-id="${bm.id}">
            <div style="font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px;">
              ${this.escapeHtml(bm.title || 'Untitled')}
            </div>
            <div style="font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px;">
              ${this.escapeHtml(bm.url)}
            </div>
            <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 8px;">
              📅 Added ${this.formatDate(bm.dateAdded)}
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-sm dc-archive" data-bookmark='${JSON.stringify(bm).replace(/'/g, "&#39;")}' style="flex: 1; background: rgba(59, 130, 246, 0.2); color: #60a5fa;">
                📁 Archive
              </button>
              <button class="btn btn-sm dc-delete" data-bookmark='${JSON.stringify(bm).replace(/'/g, "&#39;")}' style="flex: 1; background: rgba(239, 68, 68, 0.2); color: #f87171;">
                🗑️ Delete
              </button>
              <button class="btn btn-sm btn-secondary dc-skip" data-id="${bm.id}" style="padding: 8px;">
                ⏭️
              </button>
            </div>
          </div>
        `).join('')}
      `}
      <div style="margin-top: 12px;">
        <button class="btn btn-secondary btn-sm" id="dc-view-archived" style="width: 100%;">
          📁 View Archived (${data.archivedBookmarks.length})
        </button>
      </div>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('dc-archive')) {
        const bookmark = JSON.parse(e.target.dataset.bookmark);
        await this.archiveBookmark(bookmark);
        window.showToast?.('Bookmark archived', 'success');
      }

      if (e.target.classList.contains('dc-delete')) {
        const bookmark = JSON.parse(e.target.dataset.bookmark);
        await this.deleteBookmark(bookmark);
        window.showToast?.('Bookmark deleted', 'info');
      }

      if (e.target.classList.contains('dc-skip')) {
        await this.skipBookmark(e.target.dataset.id);
        window.showToast?.('Skipped for now', 'info');
      }

      if (e.target.id === 'dc-view-archived') {
        this.showArchivedModal();
      }
    });
  },

  async showArchivedModal() {
    const data = await this.getData();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'dc-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2 class="modal-title">📁 Archived Bookmarks</h2>
          <button class="modal-close" data-dismiss="dc-modal">&times;</button>
        </div>
        <ul class="item-list" style="max-height: 400px;">
          ${data.archivedBookmarks.length === 0 ? `
            <li style="justify-content: center; color: var(--text-muted);">No archived bookmarks</li>
          ` : data.archivedBookmarks.map(bm => `
            <li style="flex-direction: column; align-items: flex-start;">
              <div style="font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">
                ${this.escapeHtml(bm.title || 'Untitled')}
              </div>
              <a href="${bm.url}" target="_blank" style="font-size: 11px; color: var(--accent-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">
                ${this.escapeHtml(bm.url)}
              </a>
              <div style="font-size: 10px; color: var(--text-muted);">
                Archived ${new Date(bm.archivedAt).toLocaleDateString()}
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="dc-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  },

  async exportToCSV() {
    const data = await this.getData();
    let csv = 'id,title,url,dateAdded,archivedAt\n';
    data.archivedBookmarks.forEach(bm => {
      csv += `"${bm.id}","${(bm.title || '').replace(/"/g, '""')}","${bm.url}","${bm.dateAdded}","${bm.archivedAt}"\n`;
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const bookmarks = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 5) {
          bookmarks.push({
            id: parts[0], title: parts[1], url: parts[2],
            dateAdded: parts[3], archivedAt: parts[4]
          });
        }
      }
      const data = await this.getData();
      data.archivedBookmarks = merge ? [...data.archivedBookmarks, ...bookmarks] : bookmarks;
      await this.saveData(data);
      await this.render();
      return { success: true, count: bookmarks.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DigitalCleaner.init());
} else {
  DigitalCleaner.init();
}
