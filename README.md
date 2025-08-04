# Claude SlideGen

> TikTok-style CSV copy generator powered by Anthropic Claude + Next.js 14

---

## ✨ Features
* **Generator** – pick *client → campaign → blueprint*; tweak sliders; one-click hooks → approved CSV.
* **Prompt Editor** – WYSIWYG edit of global rules, brand modules, campaign patches; auto-versioned files.
* **History / Diff** – browse previous `_v#` prompt files with inline diff.
* **Flat-file prompts** – no DB: everything lives in `/prompts`, fully git-tracked.
* **shadcn / Vercel-style UI** – clean cards, collapsible folders, lucide icons.

---

## 🗂️ Folder Structure (key parts)

prompts/
global/
rules_v1.md
blueprints.yaml
clients/
vibit/
_brand_v2.md
older_v1.md
pupscan/
_brand_v2.md
basic_v1.md

src/
app/ # Next.js App Router
components/
PromptTree.tsx
HookEditor.tsx
lib/
blueprint.ts
promptMerge.ts
claude.ts
validate.ts


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
