# Content System Organization Guide

## Overview
This system organizes viral content generation into a hierarchical structure that allows for maximum flexibility while maintaining brand consistency.

## Directory Structure

```
prompts/
├── global/
│   └── rules_v1.md          # Universal principles for all content
├── clients/
│   └── {client_name}/
│       ├── _client_v1.md    # Client-specific voice and rules
│       └── {campaign}_v1.md # Campaign-specific strategies
blueprints/
├── family-betrayal.md       # Template for family drama stories
├── relationship-shock.md    # Template for relationship reveals
├── workplace-injustice.md   # Template for work drama
└── medical-mystery.md       # Template for health stories
```

## Variable Hierarchy

### Global Variables (Available Everywhere)
- `{{client_name}}` - The brand being promoted
- `{{campaign_name}}` - Current campaign identifier
- `{{product_slide}}` - Slide number for product placement
- `{{tone_strength}}` - Intensity modifier (0-100)
- `{{rage_bait_intensity}}` - Controversy level (0-100)

### Client Variables (Client + Campaign Level)
- Custom variables defined in frontmatter
- `{{primary_benefit}}` - Main product benefit
- `{{secondary_benefit}}` - Additional benefit
- Any client-specific tokens

### Campaign Variables (Campaign Level Only)
- `{{audience}}` - Target demographic
- `{{stress_source}}` - Campaign-specific pain point
- Campaign-specific story elements

## Content Creation Flow

1. **Global Rules** provide the psychological framework
2. **Blueprints** offer story structure templates
3. **Client Files** define brand voice and integration rules
4. **Campaign Files** specify audience and angle

## Example Usage

### For DreamEase Sleep Aid:
1. Global rules ensure rage bait principles
2. Family-betrayal blueprint provides story structure
3. DreamEase client file adds brand voice
4. Stress-parents campaign targets exhausted parents

### Story Generation:
- Combine blueprint structure with campaign angle
- Apply client voice and integration rules
- Follow global psychological principles
- Insert product naturally at specified slide

## Adding New Content

### New Client:
1. Create folder: `prompts/clients/{client_name}/`
2. Add `_client_v1.md` with brand voice
3. Define client variables and rules

### New Campaign:
1. Add `{campaign_name}_v1.md` to client folder
2. Specify audience and rage bait intensity
3. Create campaign-specific angles

### New Blueprint:
1. Add `{blueprint_name}.md` to blueprints/
2. Define story structure with 5 slides
3. Include variable placeholders
4. Add proven hooks and triggers

## Best Practices

1. **Version Control**: Always increment versions when editing
2. **Variable Naming**: Use snake_case for consistency
3. **Character Limits**: Respect platform constraints
4. **Rage Bait Ethics**: Stay within legal/platform bounds
5. **Testing**: Preview with different variable values

## Content Psychology

### Emotional Arc:
1. **Hook** - Curiosity/Mild Discomfort
2. **Build** - Increasing Tension
3. **Peak** - Maximum Emotional Response
4. **Resolution** - Validation/Understanding
5. **Product** - Relief/Empowerment

### Engagement Mechanics:
- Ambiguous details drive comments
- Relatable pain points increase shares
- Moral gray areas maximize debate
- Identity triggers boost engagement

## Prompt Manager Features

- **Tree View**: Navigate content hierarchy
- **Color Coding**: Visual variable scoping
- **Version History**: Track all changes
- **Live Preview**: See rendered content
- **Validation**: Character limits and banned words
- **Full Chain View**: See complete prompt assembly