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
| `manifest.json` | Extension configuration, permissions, commands (max 4 shortcuts) |
| `js/background.js` | Service worker for hotkeys, alarms, messaging |
| `js/content.js` | Injected into pages for overlays/widgets |
| `js/main.js` | Dashboard page orchestrator, settings management |
| `js/storage.js` | Chrome storage wrapper with export/import |
| `js/theme.js` | Dark/light mode management |
| `js/sampleData.js` | Initial demo data generator |
| `js/expand-manager.js` | Expand/minimize functionality with sidebar navigation |

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

**IMPORTANT**: Chrome Manifest V3 limits extensions to a maximum of 4 keyboard shortcuts.

### Active Shortcuts

| Command ID | Default Key | Description |
|-----------|-------------|-------------|
| cognitive-offload | Alt+C | Quick capture overlay |
| open-dashboard | Alt+P | Full dashboard |
| _execute_action | - | Popup (default click) |

**Note**: Additional shortcuts were removed to comply with Chrome's 4-shortcut limit. Users now access bubbles via:
1. Dashboard grid view
2. Expand/minimize feature with sidebar navigation
3. Direct bubble interaction in expanded view

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
      </div>
      <div class="bubble-info-icon">
        <div class="bubble-info-tooltip">Description of what this bubble does and how to use it.</div>
      </div>
    </div>
  </div>
  <div class="bubble-content" id="new-bubble-content"></div>
</div>
```

**Note**:
- Export/import buttons removed from individual bubbles (now in Settings)
- Hotkey display removed (limited shortcuts available)
- Info icon with tooltip is now standard for all bubbles
- Expand button (⛶) is auto-added by ExpandManager

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

### Step 6: Add to ExpandManager

Add to `js/expand-manager.js` utilities array:

```javascript
{ id: 'newBubble', bubbleId: 'bubble-new-bubble', icon: '🆕', name: 'New Bubble' }
```

If your utility supports expanded view rendering:

```javascript
async renderExpanded() {
  const container = document.getElementById('new-bubble-content');
  if (!container) return;

  const data = await this.getData();
  // Render expanded view (more detailed, full-screen optimized)
  container.innerHTML = `<!-- Expanded HTML -->`;
}
```

**Note**: Hotkeys are limited to 4 total. Do not add new hotkeys unless removing an existing one.

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
--accent-primary: #ff9ebc (sakura pink)
--accent-secondary: #ffb7ce (lighter sakura pink)
--accent-success, --accent-warning, --accent-danger, --accent-info
--card-bg, --input-bg, --hover-bg
--bubble-active, --bubble-inactive
--scrollbar-track, --scrollbar-thumb
```

### New UI Elements
- `.bubble-hidden`: Hides disabled bubbles (display: none)
- `.bubble-info-icon`: Info icon with ? symbol
- `.bubble-info-tooltip`: Tooltip that appears on hover
- `.bubble-expand-btn`: Expand/minimize button (auto-added)
- `.expand-container`: Container for sidebar + grid
- `.expand-sidebar`: Left sidebar in expanded view
- `.sidebar-icon`: Individual utility icons in sidebar
- `.expanded`: Class added to bubble in full-screen mode
- `.has-expanded-utility`: Body class when any bubble is expanded

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
- [ ] Renders correctly in grid view
- [ ] Renders correctly in expanded view
- [ ] Add/edit/delete operations work
- [ ] Data persists after refresh
- [ ] Export generates valid CSV (from Settings)
- [ ] Import accepts valid CSV (from Settings)
- [ ] Enable/disable toggle works
- [ ] Tooltip displays correct information
- [ ] Expand/minimize button functions properly
- [ ] Appears/disappears from sidebar when enabled/disabled

### Hotkeys & Navigation
- [ ] Alt+C triggers quick capture overlay
- [ ] Alt+P opens dashboard
- [ ] Escape exits expanded view
- [ ] Sidebar navigation works in expanded view
- [ ] Expand buttons appear on all bubbles
- [ ] Minimize button appears when expanded

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
4. **Keyboard shortcuts**: Limited to 4 shortcuts due to Chrome Manifest V3 restrictions

## Recent Changes

### Version 1.1.0 (January 2025)

#### New Features
1. **Expand/Minimize Functionality**
   - Each bubble can expand to full-screen view
   - Sidebar navigation with icons for all enabled bubbles
   - Quick switching between bubbles in expanded mode
   - ESC key to return to grid view
   - Implemented in `js/expand-manager.js`

2. **Interactive Tooltips**
   - Info icon (?) added to all bubble headers
   - Hover to see bubble description and usage tips
   - Styled with glassmorphism matching theme
   - CSS classes: `.bubble-info-icon`, `.bubble-info-tooltip`

3. **Enable/Disable Improvements**
   - Fixed toggle functionality in settings
   - Disabled bubbles now hidden from both grid and sidebar
   - Proper visibility synchronization
   - Uses `.bubble-hidden` class

4. **Theme Updates**
   - Changed accent color to sakura pink (#ff9ebc)
   - Updated both light and dark modes
   - Improved glassmorphism effects

5. **Import/Export Centralization**
   - Moved export/import to Settings page
   - Removed individual bubble export/import buttons
   - Cleaner bubble headers

#### Bug Fixes
- Fixed container styling issues in grid and expanded views
- Fixed bubble display issues when toggling enabled/disabled
- Fixed CSP violations for inline scripts
- Removed invalid shortcuts (Chrome 4-shortcut limit)

#### UI/UX Improvements
- Streamlined bubble headers
- Better tooltip positioning and styling
- Improved sidebar icon visibility
- Updated popup styling
- Cleaner, more consistent design

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

### v1.1.0 (January 2025)
- Added expand/minimize functionality with sidebar navigation
- Added interactive tooltips for all bubbles
- Fixed enable/disable toggle functionality
- Changed theme to sakura pink accents
- Centralized import/export to Settings page
- Streamlined keyboard shortcuts (Chrome 4-shortcut limit)
- Fixed container styling and display issues
- Fixed CSP violations
- Updated popup styling

### v1.0.0 (December 2024)
- Initial release with 14 bubbles
- Glassmorphism UI with dark/light mode
- Full export/import functionality
- Sample data for first-time users
- Bento grid layout
- Comprehensive keyboard shortcuts

---

*Last updated: January 2025*
