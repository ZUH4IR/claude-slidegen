# Claude SlideGen

A powerful tool for generating TikTok-style CSV copy using Claude AI, available as both a CLI and web interface.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your Anthropic API key:
```
ANTHROPIC_API_KEY=your_api_key_here
```

## Usage

### Web Interface (Recommended)

Start the web application:
```bash
npm run dev
```

Open http://localhost:3000 in your browser. The web interface provides:

**Generator Tab:**
- Visual configuration with sliders, dropdowns, and toggles
- Live hook editing with character count validation
- CSV generation with real-time validation
- Export functionality (copy to clipboard or download)
- Step-by-step workflow (Config → Hooks → CSV)

**Prompt Editor Tab:**
- Live editing of all prompt templates with syntax highlighting
- File browser with icons for different prompt types
- Real-time saving with change detection
- Support for Markdown and YAML files

### CLI (Legacy)

Run the command-line generator:
```bash
npm run gen
```

This will:
1. Generate hook options based on configured parameters
2. Use those hooks to generate a complete CSV with all slide content
3. Validate the CSV output

## Configuration

### Web Interface
Use the intuitive form controls in the Generator tab to configure:
- Brand and campaign selection
- Blueprint format (story_6 or tutorial_5)
- Number of rows to generate
- Persona, topic, and hook appeal
- Character limits and other parameters

### CLI
Edit `src/cli.js` to modify the hardcoded configuration values.

## File Structure

- `prompts/` - Contains all prompt templates
  - `universal_engine_v1.md` - Main generation engine
  - `brands/` - Brand voice guidelines  
  - `campaigns/` - Campaign-specific modifiers
  - `blueprints.yaml` - Slide format definitions
- `src/` - CLI source code (legacy)
- `app/` - Next.js application (web interface)
- `lib/` - Shared utilities and types
- `components/` - React components

## Features

### Generation Workflow
1. **Configure Parameters**: Set brand, campaign, blueprint, topic, persona, etc.
2. **Generate Hooks**: AI creates hook options based on your parameters
3. **Edit Hooks**: Refine hooks with real-time character count validation
4. **Generate CSV**: AI creates complete slide content using approved hooks
5. **Export**: Copy to clipboard or download as CSV file

### Prompt Management
- Live editing of all prompt templates
- Syntax highlighting for Markdown and YAML
- Real-time file saving
- Visual indicators for unsaved changes

### Validation
- Real-time CSV validation
- Character limit enforcement
- Column count verification
- Clear error reporting

## Output

The tool generates complete CSV files with all columns needed for TikTok slide creation, including:
- Hook text (top/bottom)
- Slide content for each step
- Visual descriptions
- Captions with hashtags

All output is validated and ready for use in your content creation workflow.