# POP - Personal Organization Platform

<p align="center">
  <strong>A Chrome extension with 14 productivity "Bubbles" to organize your digital life</strong>
</p>

<p align="center">
  Built with GTD, Deep Work, and mindful productivity principles
</p>

---

## Features

POP is a comprehensive personal organization platform that combines multiple productivity utilities into one beautiful, cohesive extension. Each utility is called a "Bubble" and can be enabled or disabled based on your needs.

### Design Philosophy
- **Glassmorphism UI**: Modern, frosted-glass aesthetic with smooth animations and sakura pink accents
- **Bento Grid Layout**: Organized dashboard with flexible card arrangement
- **Expand/Minimize Views**: Each bubble can expand to full-screen for detailed work or minimize to grid view
- **Dark/Light Mode**: User-toggleable theme that respects your preference
- **Interactive Tooltips**: Hover over info icons to learn what each bubble does
- **Keyboard-First**: Quick access via keyboard shortcuts for major functions
- **Privacy-Focused**: All data stored locally using Chrome's storage API

---

## The 14 Bubbles

### 1. Cognitive Offload (Alt+C)
**Concepts**: GTD (Capture everything) + Deep Work (Reduce attention residue)

Instantly capture thoughts without breaking your flow. A minimalist popup triggered by hotkey lets you type a thought, tag it as "Actionable" or "Reference", and get back to work.

### 2. Month Cash Flow (Alt+M)
Track your monthly income and expenses with categories. See your balance at a glance and maintain financial awareness.

### 3. Net Worth Logger (Alt+N)
Monitor your assets over time. Track cash, investments, property, and liabilities. Visualize your wealth-building journey.

### 4. Stock Watchlist (Alt+S)
Create multiple watchlists and track stocks. Quick links to Google Finance, Yahoo Finance, and Robinhood for each ticker.

### 5. Purpose Gatekeeper (Alt+G)
**Concepts**: Drive (Purpose/Autonomy) + GTD (Horizons of Focus)

Link every task to a higher-level "Why". Visualizes the ratio of autonomous vs. controlled tasks to ensure you're doing meaningful work.

### 6. Daily Negotiator (Alt+D)
**Concepts**: 12 Rules (Treat yourself like someone you care for) + GTD (Next Actions)

Morning planner that asks: "What does a day look like that would make you want to wake up tomorrow?" Enforces balance between hard tasks and rewards.

### 7. Question Primer (Alt+Q)
**Concepts**: Questions Are the Answer + Deep Work

Before deep work sessions, set your ONE core question. Tracks stuck questions (3+ days) and suggests reframing when needed.

### 8. Flow Thermometer (Alt+F)
**Concepts**: Drive (Goldilocks Rule) + Deep Work (Flow)

Rate task difficulty vs. skill level to stay in the "Flow Channel". Suggests breaking down tasks or adding constraints based on your state.

### 9. Truth Time Logger (Alt+T)
**Concepts**: 12 Rules (Tell the Truth) + Deep Work

Categorize sites as "Deep" or "Shallow". Displays a Truth Score showing your actual productivity without judgment, just facts.

### 10. Tab Snoozer (Alt+B)
**Concepts**: GTD (2-Minute Rule) + 12 Rules (Order)

Manages tab chaos. When tabs go idle, choose: Do It (< 2 mins), Snooze It, or Trash It. Snoozed tabs automatically reopen later.

### 11. Mastery Graph (Alt+Y)
**Concepts**: 12 Rules (Compare to yesterday) + Drive (Mastery)

Track ONE metric. Shows only Today vs. Yesterday to prevent anxiety about long-term goals. Green means improvement!

### 12. Digital Cleaner (Alt+K)
**Concepts**: 12 Rules (Clean your room) + GTD (Organizing)

Reviews old bookmarks (6+ months) on startup. Archive or delete to maintain a clean digital environment.

### 13. Weekly Review (Alt+W)
**Concepts**: GTD (Reflect) + Questions Are the Answer

Scheduled reflection with 5 catalytic questions. Download your review as a text file for long-term tracking.

### 14. Life Expectancy Calculator (Alt+L)
Calculate remaining weeks and hours based on your age. Tracks your "Freedom Aim" - the net worth needed for passive income to cover expenses.

---

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension directory
6. The POP icon will appear in your toolbar

### Permissions Required

- **storage**: For saving all your data locally
- **unlimitedStorage**: For comprehensive data without limits
- **tabs**: For tab management features
- **bookmarks**: For the Digital Cleaner
- **notifications**: For reminders and alerts
- **alarms**: For scheduled features

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+C` | Quick Capture (Cognitive Offload) |
| `Alt+P` | Open Dashboard |
| `Escape` | Minimize expanded bubble (return to grid view) |

**Note**: Some keyboard shortcuts have been streamlined due to Chrome extension limitations (maximum 4 shortcuts). You can access all bubbles via the dashboard and expand/minimize functionality.

---

## Data Management

### Export
Each bubble has an export button that generates a CSV file with all its data.

### Import
Import CSV files to restore or migrate data. Option to merge with existing data.

### Export All
One-click export of all POP data as a JSON file for complete backup.

### Privacy
All data is stored locally in your Chrome profile using `chrome.storage.local`. Nothing is sent to external servers.

---

## Configuration

### Enable/Disable Bubbles
Click the Settings icon to toggle individual bubbles on or off. Disabled bubbles are hidden from the dashboard and sidebar navigation.

### Expand/Minimize Bubbles
Each bubble has an expand button (⛶) in its header. Click to expand a bubble to full-screen view for detailed work. A sidebar navigation appears on the left showing all enabled bubbles. Press Escape or click the minimize button (⊟) to return to grid view.

### Interactive Tooltips
Each bubble has an info icon (?) that displays helpful tooltips on hover, explaining what the bubble does and how to use it.

### Weekly Review Schedule
Configure which day and time the Weekly Review prompt appears.

### Flow Check Interval
Set how often the Flow Thermometer prompts you (default: 30 minutes).

---

## Technical Details

### Stack
- **Manifest V3**: Latest Chrome extension format
- **Vanilla JavaScript**: No framework dependencies
- **CSS Variables**: For theming
- **Chrome Storage API**: Local persistence

### File Structure
```
pop-chrome-extension/
├── manifest.json
├── css/
│   ├── styles.css        # Main Glassmorphism theme with sakura pink accents
│   └── content.css       # Injected overlay styles
├── js/
│   ├── background.js     # Service worker
│   ├── content.js        # Page injections
│   ├── main.js           # Dashboard orchestrator
│   ├── storage.js        # Data persistence
│   ├── theme.js          # Theme management
│   ├── sampleData.js     # Initial demo data
│   ├── expand-manager.js # Expand/minimize functionality
│   └── utils/            # Individual bubble modules
├── html/
│   ├── main.html         # Full dashboard
│   └── popup.html        # Quick actions popup
└── icons/
```

---

## Contributing

Contributions are welcome! The modular architecture makes it easy to:
- Add new bubbles
- Improve existing features
- Enhance the UI/UX

See `CLAUDE_TRACKING.md` for development notes.

---

## Inspiration

POP is inspired by concepts from:
- **Getting Things Done (GTD)** by David Allen
- **Deep Work** by Cal Newport
- **12 Rules for Life** by Jordan Peterson
- **Drive** by Daniel Pink
- **Questions Are the Answer** by Hal Gregersen

---

## License

MIT License - See LICENSE file for details.

---

<p align="center">
  Made with productivity principles in mind
</p>
