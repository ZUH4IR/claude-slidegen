# Claude SlideGen

> TikTok-style CSV copy generator powered by Anthropic Claude + Next.js 14

## 🔑 Setup Required

**You must add your Anthropic API key to `.env.local` for generation to work:**

```bash
# Copy the example file and add your key
cp .env.example .env.local
# Edit .env.local and add your API key from https://console.anthropic.com/settings/keys
```

---

## ✨ Features
* **Generator** – pick *client → campaign → blueprint*; tweak sliders; one-click hooks → approved CSV.
* **Prompt Editor** – WYSIWYG edit of global rules, brand modules, campaign patches; auto-versioned files.
* **History / Diff** – browse previous `_v#` prompt files with inline diff.
* **Flat-file prompts** – no DB: everything lives in `/prompts`, fully git-tracked.
* **shadcn / Vercel-style UI** – clean cards, collapsible folders, lucide icons.

---

## 🗂️ Folder Structure

```
prompts/
  global/
    rules_v1.md          # global rules
    blueprints.yaml      # blueprint definitions
  clients/
    {client}/
      _brand_v#.md       # brand root
      {campaign}_v#.md   # campaign patch
```

## 📋 Variable Legend

The prompt manager includes an intelligent variable legend that:

- **Auto-scans** active global, brand, and campaign YAML frontmatter
- **Displays** variables in a table: `key | scope | default | overrides`
- **Click to jump** - clicking any variable jumps cursor to first occurrence in merged prompt
- **Conflict indicators**:
  - 🔴 Red dot: Campaign overrides brand
  - 🟠 Orange dot: Any override exists

### Variable Scopes

1. **Global** - defined in `prompts/global/*.md`
2. **Brand** - defined in client's `_brand_v#.md`
3. **Campaign** - defined in campaign files `{campaign}_v#.md`

### Frontmatter Keys

- **Meta keys**: `version`, `status`, `description` (system use)
- **All other keys**: render variables (camelCase) - surfaced in editor

## 🛠️ Quick Actions Toolbar

- **↗** New version - clones file, bumps version, toggles active
- **Δ** Diff against v-1 - inline viewer
- **⚠** Linter - checks char caps, missing hashtags, banned words

## ⌨️ Editor Shortcuts

- `Ctrl+S` - Save
- Auto-save every 30 seconds
- Vim keymap enabled by default


---

## 🚀 Quick Start

git clone https://github.com/your-org/claude-slidegen
cd claude-slidegen

# install deps
npm install

# add your Claude key
cp .env.example .env
echo "ANTHROPIC_API_KEY=sk-live-xxx" >> .env

# local dev
npm run dev         # Next.js on http://localhost:3000

# one-off CLI generation
npm run gen         # uses src/cli.js


⚙️ CLI Cheatsheet
Command	What it does
npm run gen	Runs src/cli.js → hooks → csv (good for quick tests).
npm run lint	Next.js + ESLint.
npm run fmt	Prettier write.

🖋️ Prompt Editing Workflow
Prompts tab → select file in nested explorer.

Edit YAML front-matter or body → Save.
File is written as _v{n+1}.md, older versions stay on disk.

History tab → choose two versions → diff appears.

Click Activate to switch back to an older version.

🔧 Available Toggles & Sliders
UI control	Prompt variable	Default (from YAML)
Rows (1-15)	rows	–
Blueprint	blueprint_id	story_6
Char limit slider (40-120)	char_cap_hook	95
Self-aware joke switch	add_selfAwareJoke	true
Product slide radio	product_slide	5
Tone strength (0-100)	tone_strength (brand)	80
Rage-bait intensity (0-100)	rage_bait_intensity (campaign)	70

🏗️ Claude Ops – Best Practices
Practice	Why / How
Commit every major prompt change	Prompt text is code. Use a short message, eg. pupscan: tighten char caps
Log Claude calls	Add console.log({ promptSize, cost }) inside lib/claude.ts for spend monitoring.
One variable per slider	Avoid string concat in prompts; use Mustache vars exclusively.
Keep context < 16 k tokens	Sonnet sweet-spot; cut long strategy prose from runtime prompts.
Re-run validator on each save	npm run gen + CI hook ensures column count stays correct.
Tag UI releases	git tag ui-v0.3 after each UI sprint; rollback becomes trivial.

🛡️ Troubleshooting
Symptom	Fix
401 Unauthorized	Check ANTHROPIC_API_KEY and org policy.
ERR_MODULE_NOT_FOUND	Ensure "type":"module" in package.json.
Wrong column count	Update blueprints.yaml or adjust validator caps.


---

**Next step:**  
1. Drop the meta-prompt into Claude-Code to get the nested explorer back.  
2. Add the above `README.md` to your repo and commit:


git add README.md prompts src/components/PromptTree.tsx src/app/*
git commit -m "feat: nested prompt explorer + README"


---

## 🏗️ Architecture Overview

### What Was Built

This application is a comprehensive TikTok-style CSV copy generator that combines:

1. **Prompt Management System**
   - Flat-file based prompt storage in `/prompts` directory
   - Version control built into the naming convention (`_v#.md`)
   - Hierarchical structure: Global → Client → Campaign
   - YAML frontmatter for variable definitions and metadata

2. **Hook Generation Engine**
   - Integrates with Anthropic Claude API for AI-powered copy generation
   - Blueprint-based generation with customizable parameters
   - Real-time slider controls for fine-tuning output
   - CSV export functionality for bulk content production

3. **Editor & Version Control**
   - WYSIWYG editor with Vim keybinding support
   - Auto-save functionality (30-second intervals)
   - Diff viewer for comparing prompt versions
   - Variable legend with conflict detection

### UI Approach

The user interface follows modern design principles:

1. **Component Architecture**
   - Built with Next.js 14 App Router for optimal performance
   - shadcn/ui components for consistent, accessible design
   - Lucide icons for clean visual hierarchy
   - Responsive layout that works across devices

2. **Navigation Structure**
   - Tab-based interface: Generator | Prompts | History
   - Nested file explorer for intuitive prompt navigation
   - Collapsible folders to manage complex hierarchies
   - Quick action toolbar for common operations

3. **Visual Feedback**
   - Color-coded conflict indicators (🔴 red, 🟠 orange)
   - Loading states and progress indicators
   - Success/error toasts for user actions
   - Inline diff highlighting for version comparisons

### Logic & Data Flow

1. **Prompt Merging Logic**
   ```
   Global Rules + Brand Module + Campaign Patch = Final Prompt
   ```
   - Variables cascade from global → brand → campaign
   - Later definitions override earlier ones
   - Mustache templating for variable interpolation

2. **Generation Pipeline**
   - User selects client → campaign → blueprint
   - Adjusts parameters via UI controls
   - System merges prompts and replaces variables
   - Claude API processes the final prompt
   - Output formatted as CSV with validation

3. **State Management**
   - React hooks for UI state (useState, useEffect)
   - File system as source of truth for prompts
   - No database required - all data in flat files
   - Git-friendly for team collaboration

4. **Variable Resolution**
   - Scans YAML frontmatter across all active files
   - Builds variable map with scope tracking
   - Detects and displays override conflicts
   - Click-to-jump functionality in editor

### Key Technical Decisions

- **Flat-file storage**: Enables Git tracking, easy backups, and simple deployment
- **Version suffixes**: Built-in history without complex database schemas
- **YAML frontmatter**: Clean separation of variables from content
- **Mustache templating**: Simple, widely-understood variable syntax
- **Next.js 14**: Modern React framework with excellent DX and performance
- **shadcn/ui**: Customizable components without vendor lock-in

### Component Architecture Improvements

The application has been refactored for better consistency and maintainability:

1. **Unified Components**
   - `PromptPreview`: Single component for displaying prompt chains across all views
   - `HooksTable`: Consistent table for hook selection, editing, and display
   - `ContentTable`: Unified content editor supporting both Excel and card views

2. **Streamlined User Flow**
   - Generator → Select hooks in modal → Generate slides → Edit in unified table
   - Consistent visual language across all editing interfaces
   - Single source of truth for each UI pattern

3. **Removed Redundancy**
   - Eliminated duplicate prompt preview implementations
   - Consolidated multiple table/editor components
   - Unified hook selection and slide generation flow
