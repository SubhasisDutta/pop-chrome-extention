# Claude Development Tracking

This file helps Claude (and subagents) keep track of the POP extension development.

---

## Project Overview

**Name**: POP - Personal Organization Platform
**Type**: Chrome Extension (Manifest V3)
**Purpose**: Collection of 14 productivity utilities ("Bubbles") with unified UI

---

## Architecture

### Core Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration, permissions, commands |
| `js/background.js` | Service worker for hotkeys, alarms, messaging |
| `js/content.js` | Injected into pages for overlays/widgets |
| `js/main.js` | Dashboard page orchestrator |
| `js/storage.js` | Chrome storage wrapper with export/import |
| `js/theme.js` | Dark/light mode management |
| `js/sampleData.js` | Initial demo data generator |

### Utility Modules (js/utils/)

Each utility follows this pattern:

```javascript
const UtilityName = {
  STORAGE_KEY: 'pop_utility_name',

  async init() { /* Initialize and render */ },
  async getData() { /* Get from storage */ },
  async saveData(data) { /* Save to storage */ },
  async render() { /* Update DOM */ },
  bindEvents() { /* Set up event listeners */ },

  // Utility-specific methods...

  async exportToCSV() { /* Export functionality */ },
  async importFromCSV(content, merge) { /* Import functionality */ }
};
```

### Storage Keys

```javascript
const STORAGE_KEYS = {
  SETTINGS: 'pop_settings',
  THEME: 'pop_theme',
  COGNITIVE_OFFLOAD: 'pop_cognitive_offload',
  CASH_FLOW: 'pop_cash_flow',
  NET_WORTH: 'pop_net_worth',
  STOCK_WATCHLIST: 'pop_stock_watchlist',
  PURPOSE_GATEKEEPER: 'pop_purpose_gatekeeper',
  DAILY_NEGOTIATOR: 'pop_daily_negotiator',
  QUESTION_PRIMER: 'pop_question_primer',
  FLOW_THERMOMETER: 'pop_flow_thermometer',
  TRUTH_LOGGER: 'pop_truth_logger',
  TAB_SNOOZER: 'pop_tab_snoozer',
  MASTERY_GRAPH: 'pop_mastery_graph',
  DIGITAL_CLEANER: 'pop_digital_cleaner',
  WEEKLY_REVIEW: 'pop_weekly_review',
  LIFE_CALCULATOR: 'pop_life_calculator'
};
```

---

## Hotkeys Reference

| Command ID | Default Key | Description |
|-----------|-------------|-------------|
| cognitive-offload | Alt+C | Quick capture overlay |
| question-primer | Alt+Q | Set core question |
| flow-check | Alt+F | Flow state check |
| time-log | Alt+T | Time logger |
| daily-plan | Alt+D | Daily negotiator |
| open-dashboard | Alt+P | Full dashboard |
| net-worth | Alt+N | Net worth update |
| cash-flow | Alt+M | Cash flow log |
| stock-check | Alt+S | Stock watchlist |
| weekly-review | Alt+W | Weekly review |

---

## Adding a New Bubble

### Step 1: Create Utility Module

Create `js/utils/new-bubble.js`:

```javascript
const NewBubble = {
  STORAGE_KEY: 'pop_new_bubble',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || { /* defaults */ });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  async render() {
    const container = document.getElementById('new-bubble-content');
    if (!container) return;

    const data = await this.getData();
    container.innerHTML = `<!-- HTML content -->`;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      // Handle events
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  async exportToCSV() {
    const data = await this.getData();
    let csv = 'header1,header2\n';
    // Build CSV
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    // Parse and import
    return { success: true, count: 0 };
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => NewBubble.init());
} else {
  NewBubble.init();
}
```

### Step 2: Add to HTML

Add to `html/main.html`:

```html
<div class="glass-card bento-item" id="bubble-new-bubble" data-utility="newBubble">
  <div class="bubble-header">
    <div class="bubble-title">
      <div class="bubble-icon" style="background: linear-gradient(...);">🆕</div>
      <div>
        <div class="bubble-name">New Bubble</div>
        <span class="bubble-hotkey">Alt+X</span>
      </div>
    </div>
    <div class="bubble-actions">
      <button class="btn btn-icon btn-secondary" data-export="newBubble">📤</button>
      <button class="btn btn-icon btn-secondary" data-import="newBubble">📥</button>
    </div>
  </div>
  <div class="bubble-content" id="new-bubble-content"></div>
</div>
```

### Step 3: Update main.js

Add to `UTILITY_MAP`:

```javascript
newBubble: { key: 'pop_new_bubble', module: NewBubble, name: 'New Bubble' }
```

### Step 4: Add Sample Data

Add to `js/sampleData.js`:

```javascript
async initNewBubble() {
  const data = { /* sample data */ };
  return this.saveData('pop_new_bubble', data);
}
```

Call in `initializeAll()`.

### Step 5: Update Settings

Add to `DEFAULT_SETTINGS.utilities` in `js/storage.js`:

```javascript
newBubble: { enabled: true, hotkey: 'Alt+X' }
```

### Step 6: Add Hotkey (Optional)

Add to `manifest.json` commands:

```json
"new-bubble": {
  "suggested_key": { "default": "Alt+X" },
  "description": "New Bubble"
}
```

Handle in `background.js` onCommand listener.

---

## CSS Classes Reference

### Card Styles
- `.glass-card`: Main glassmorphism card
- `.glass-card-flat`: Flat variant without hover effect
- `.bento-item`: Grid item
- `.span-2`, `.span-3`: Column spanning
- `.tall`: Row spanning

### Components
- `.btn`, `.btn-primary`, `.btn-secondary`: Buttons
- `.btn-sm`, `.btn-lg`, `.btn-icon`: Button sizes
- `.input`, `.input-group`, `.input-label`: Form elements
- `.tag`, `.tag-actionable`, `.tag-reference`: Tags
- `.progress-bar`, `.progress-fill`: Progress bars
- `.stats-grid`, `.stat-item`: Statistics display
- `.item-list`: Scrollable lists
- `.modal-overlay`, `.modal`: Modals
- `.toast`, `.toast-container`: Notifications
- `.nav-tabs`, `.nav-tab`: Tab navigation

### Theme Variables
```css
--bg-primary, --bg-secondary
--glass-bg, --glass-border, --glass-shadow
--text-primary, --text-secondary, --text-muted
--accent-primary, --accent-secondary
--accent-success, --accent-warning, --accent-danger, --accent-info
--card-bg, --input-bg, --hover-bg
```

---

## Message Passing

### Content Script → Background

```javascript
chrome.runtime.sendMessage({
  action: 'saveThought',
  text: 'My thought',
  type: 'actionable'
}, (response) => {
  console.log(response.success);
});
```

### Background → Content Script

```javascript
chrome.tabs.sendMessage(tabId, {
  action: 'showQuickCapture'
});
```

### Available Actions

| Action | Direction | Purpose |
|--------|-----------|---------|
| saveThought | Content → BG | Save cognitive offload |
| getSettings | Any → BG | Get settings |
| categorizeSite | Content → BG | Truth logger |
| logTime | Content → BG | Log time |
| openDashboard | Any → BG | Open dashboard |
| showQuickCapture | BG → Content | Show overlay |
| showFlowCheck | BG → Content | Show flow widget |
| showTruthBadge | BG → Content | Show badge |
| categorizesite | BG → Content | Categorize prompt |

---

## Testing Checklist

### Basic Functionality
- [ ] Extension loads without errors
- [ ] Dashboard opens on install
- [ ] All bubbles render with sample data
- [ ] Theme toggle works
- [ ] Settings save and persist

### Each Bubble
- [ ] Renders correctly
- [ ] Add/edit/delete operations work
- [ ] Data persists after refresh
- [ ] Export generates valid CSV
- [ ] Import accepts valid CSV
- [ ] Enable/disable toggle works

### Hotkeys
- [ ] All hotkeys trigger correct action
- [ ] Quick capture overlay works
- [ ] Dashboard opens

### Content Script
- [ ] Overlays appear correctly
- [ ] Close on click outside/Escape
- [ ] Data saves to storage

### Background
- [ ] Alarms fire at correct intervals
- [ ] Notifications appear
- [ ] Tab snoozer wakes tabs

---

## Known Issues

1. **Icon generation**: Simple programmatic icons - consider replacing with designed icons
2. **Stock prices**: No real-time price fetching - links to external sites only
3. **Bookmark API**: May not work in all contexts - gracefully degrades

---

## Future Enhancements

### Potential New Bubbles
- Habit Tracker
- Pomodoro Timer
- Note Taking
- Calendar Integration
- Password Generator

### Feature Ideas
- Cloud sync (optional)
- Multiple profiles
- Keyboard navigation
- Accessibility improvements
- Localization

---

## Version History

### v1.0.0
- Initial release with 14 bubbles
- Glassmorphism UI with dark/light mode
- Full export/import functionality
- Sample data for first-time users

---

*Last updated: January 2026*
