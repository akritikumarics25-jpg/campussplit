# CampusSplit 💸

A student-focused expense-splitting app — built for a hackathon. Instead of
manually calculating who owes whom, CampusSplit tracks group expenses and
automatically works out the simplest way to settle up.

**Live demo:** https://akritikumarics25-jpg.github.io/campussplit/

## Features

- 🏠 **Dashboard** — total expenses, what you owe, and what you're owed, at a glance
- 👥 **Groups** — create groups with any number of members (Trip, PG, Roommates, Event, etc.)
- 💰 **Add Expense** — equal or unequal splits, with live validation if unequal amounts don't add up to the total
- ✨ **AI-powered input** — describe an expense in plain English (e.g. *"Rahul paid 1200 for dinner split between all 4"*) and it auto-fills the form, powered by the Gemini API (with a local fallback parser if no key is configured)
- 🎤 **Voice input** — speak the same sentence instead of typing it (Chrome/Edge)
- 🧮 **Smart Settlement** — calculates the minimum number of payments needed to settle a group
- 🔍 **Detailed Breakdown** — an alternate view showing debts traced back pair-by-pair to the original expenses, for easier manual verification
- ✅ **Mark as Paid** — track which settlements have actually happened
- 🔒 **Safe group deletion** — a group can only be deleted once every payment in it has been marked paid
- 📊 Per-group settlement scoping — groups are calculated independently, so unrelated members are never matched against each other

## Tech Stack

Plain HTML, CSS, and JavaScript — no frameworks, no build step. Data is
stored in the browser's `localStorage`.

## Project Structure

```
campussplit/
├── index.html          # Dashboard
├── group.html           # Create/view groups
├── add-expense.html     # Add an expense
├── settlement.html      # Per-group settlements
├── css/
│   └── style.css
└── js/
    ├── storage.js        # State management (localStorage)
    ├── settlement.js     # Settlement algorithms
    ├── gemini.js          # AI natural-language parsing
    ├── voice.js           # Speech-to-text input
    ├── dashboard.js
    ├── groups.js
    ├── expense.js
    └── settlements.js
```

## Running Locally

1. Clone the repo:
   ```
   git clone https://github.com/akritikumarics25-jpg/campussplit.git
   ```
2. Open `index.html` in a browser, or serve the folder with any static
   server (e.g. VS Code's Live Server extension).

## Enabling the Gemini AI Feature (optional)

The app works fully without this — it falls back to a simple local parser.
To use the real Gemini API instead:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Create a file `js/config.js` (this file is gitignored and never committed):
   ```javascript
   window.GEMINI_API_KEY = "your-key-here";
   ```
3. Add it to `add-expense.html`, right before the `gemini.js` script tag:
   ```html
   <script src="js/config.js"></script>
   <script src="js/gemini.js"></script>
   ```

