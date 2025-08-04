// Prompt Store - Manages prompt files and provides dynamic client/campaign discovery

class PromptStore {
  constructor() {
    this.prompts = {}
    this.subscribers = []
    this.clientsAndCampaigns = {}
    this.loadPrompts()
  }

  // Load prompts from the file system
  async loadPrompts() {
    try {
      // In a real app, this would make an API call to scan the file system
      // For now, we'll simulate the file structure based on what we know exists
      const mockFileSystem = {
        'prompts/blueprints/story_6.md': {
          content: `# Story 6 Blueprint Template

## Field Details Table

| Field # | Field Name | Content Description | Character Limit | Example |
| --- | --- | --- | --- | --- |
| 0 | icp | type of user to target | single word | DIY, budget_friendly, professional |
| 1 | hook_appeal | Psychological trigger/emotion | Single word | relief, shock, validation, FOMO, insider_secret |
| 2 | hook_top_text | Main hook message | ≤95 chars | found this app, changed everything |
| 3 | hook_bottom_text | Hook supporting text/joke + transition | 1 sentence | saved 5k and my sanity honestly. best decision i made this year. |
| 4 | hook_image_query | Image category for hook | category/subcategory | {{ brand_name }}/emotion/surprised |
| 5 | slide2_top_text | Problem identification | ≤55 chars | the problem was obvious |
| 6 | slide2_bottom_text | Problem elaboration | 2-3 sentences | everyone faces this. we just accept it as normal. |
| 7 | slide2_image_query | Problem visualization | category/subcategory | {{ brand_name }}/problem/frustrated |
| 8 | slide3_top_text | Agitate the problem | ≤55 chars | it gets worse actually |
| 9 | slide3_bottom_text | Pain point amplification | 2-3 sentences | costs add up. time wastes away. stress compounds daily. |
| 10 | slide3_image_query | Pain visualization | category/subcategory | {{ brand_name }}/pain/overwhelmed |
| 11 | slide4_top_text | Solution introduction | ≤55 chars | then i discovered this |
| 12 | slide4_bottom_text | Solution explanation | 2-3 sentences | simple concept. powerful execution. immediate results. |
| 13 | slide4_image_query | Solution visualization | category/subcategory | {{ brand_name }}/solution/lightbulb |
| 14 | slide5_top_text | Product integration | ≤55 chars | {{ brand_name }} made it possible |
| 15 | slide5_bottom_text | Product benefits | 2-3 sentences | specific features that solve the exact problem. trusted by thousands. |
| 16 | slide5_image_query | Product showcase | category/subcategory | {{ brand_name }}/product/app_screenshot |
| 17 | slide6_top_text | Call to action | ≤55 chars | ready to change your life? |
| 18 | slide6_bottom_text | Action steps | 2-3 sentences | start free today. see results immediately. join the community. |
| 19 | slide6_image_query | CTA visualization | category/subcategory | {{ brand_name }}/cta/success |
| 20 | caption | Engagement-driving caption | 1-2 sentences + hashtags | {{ topic }} transformation is real. what's holding you back? #{{ brand_name }} #transformation #{{ persona }} |

### Hook Appeal Options:

**Emotional Triggers:**
- **relief** - "finally found the solution"
- **shock** - "can't believe this exists"
- **validation** - "not crazy for wanting this"
- **FOMO** - "everyone else knows this secret"
- **insider_secret** - "industry people don't want you to know"
- **rebellion** - "breaking the rules feels good"
- **transformation** - "before vs after reveal"

**Darker Triggers:**
- **discovery** - "stumbled upon game changer"
- **self-blame** - "turns out i was the problem"
- **toxic_revelation** - "exposed the toxic truth"
- **manipulation** - "been manipulating me this whole time"
- **conspiracy** - "they've been hiding this from us"
- **drama** - "relationship drama"
- **financial_exploitation** - "they're profiting from your struggle"

### Caption Formula Template:

**Structure**: One quick insight + Short engagement question + Hashtags

**Example Pattern**: "[One sentence insight about transformation]. [Question to drive comments]? #{{ brand_name }} #[relevant] #[tags]"

### Story Arc Flow:
1. **Hook** - Grab attention with emotional trigger
2. **Problem** - Identify relatable pain point
3. **Agitate** - Make them feel the pain deeper
4. **Solution** - Introduce the concept
5. **Product** - Show how {{ brand_name }} delivers
6. **CTA** - Clear next steps

### Final Output Format (CSV):

**Headers (21 fields):**
\`\`\`
icp,hook_appeal,hook_top_text,hook_bottom_text,hook_image_query,slide2_top_text,slide2_bottom_text,slide2_image_query,slide3_top_text,slide3_bottom_text,slide3_image_query,slide4_top_text,slide4_bottom_text,slide4_image_query,slide5_top_text,slide5_bottom_text,slide5_image_query,slide6_top_text,slide6_bottom_text,slide6_image_query,caption
\`\`\``,
          versions: [{ 
            version: 'v1', 
            content: `# Story 6 Blueprint Template

## Field Details Table

| Field # | Field Name | Content Description | Character Limit | Example |
| --- | --- | --- | --- | --- |
| 0 | icp | type of user to target | single word | DIY, budget_friendly, professional |
| 1 | hook_appeal | Psychological trigger/emotion | Single word | relief, shock, validation, FOMO, insider_secret |
| 2 | hook_top_text | Main hook message | ≤95 chars | found this app, changed everything |
| 3 | hook_bottom_text | Hook supporting text/joke + transition | 1 sentence | saved 5k and my sanity honestly. best decision i made this year. |
| 4 | hook_image_query | Image category for hook | category/subcategory | {{ brand_name }}/emotion/surprised |
| 5 | slide2_top_text | Problem identification | ≤55 chars | the problem was obvious |
| 6 | slide2_bottom_text | Problem elaboration | 2-3 sentences | everyone faces this. we just accept it as normal. |
| 7 | slide2_image_query | Problem visualization | category/subcategory | {{ brand_name }}/problem/frustrated |
| 8 | slide3_top_text | Agitate the problem | ≤55 chars | it gets worse actually |
| 9 | slide3_bottom_text | Pain point amplification | 2-3 sentences | costs add up. time wastes away. stress compounds daily. |
| 10 | slide3_image_query | Pain visualization | category/subcategory | {{ brand_name }}/pain/overwhelmed |
| 11 | slide4_top_text | Solution introduction | ≤55 chars | then i discovered this |
| 12 | slide4_bottom_text | Solution explanation | 2-3 sentences | simple concept. powerful execution. immediate results. |
| 13 | slide4_image_query | Solution visualization | category/subcategory | {{ brand_name }}/solution/lightbulb |
| 14 | slide5_top_text | Product integration | ≤55 chars | {{ brand_name }} made it possible |
| 15 | slide5_bottom_text | Product benefits | 2-3 sentences | specific features that solve the exact problem. trusted by thousands. |
| 16 | slide5_image_query | Product showcase | category/subcategory | {{ brand_name }}/product/app_screenshot |
| 17 | slide6_top_text | Call to action | ≤55 chars | ready to change your life? |
| 18 | slide6_bottom_text | Action steps | 2-3 sentences | start free today. see results immediately. join the community. |
| 19 | slide6_image_query | CTA visualization | category/subcategory | {{ brand_name }}/cta/success |
| 20 | caption | Engagement-driving caption | 1-2 sentences + hashtags | {{ topic }} transformation is real. what's holding you back? #{{ brand_name }} #transformation #{{ persona }} |

### Hook Appeal Options:

**Emotional Triggers:**
- **relief** - "finally found the solution"
- **shock** - "can't believe this exists"
- **validation** - "not crazy for wanting this"
- **FOMO** - "everyone else knows this secret"
- **insider_secret** - "industry people don't want you to know"
- **rebellion** - "breaking the rules feels good"
- **transformation** - "before vs after reveal"

**Darker Triggers:**
- **discovery** - "stumbled upon game changer"
- **self-blame** - "turns out i was the problem"
- **toxic_revelation** - "exposed the toxic truth"
- **manipulation** - "been manipulating me this whole time"
- **conspiracy** - "they've been hiding this from us"
- **drama** - "relationship drama"
- **financial_exploitation** - "they're profiting from your struggle"

### Caption Formula Template:

**Structure**: One quick insight + Short engagement question + Hashtags

**Example Pattern**: "[One sentence insight about transformation]. [Question to drive comments]? #{{ brand_name }} #[relevant] #[tags]"

### Story Arc Flow:
1. **Hook** - Grab attention with emotional trigger
2. **Problem** - Identify relatable pain point
3. **Agitate** - Make them feel the pain deeper
4. **Solution** - Introduce the concept
5. **Product** - Show how {{ brand_name }} delivers
6. **CTA** - Clear next steps

### Final Output Format (CSV):

**Headers (21 fields):**
\`\`\`
icp,hook_appeal,hook_top_text,hook_bottom_text,hook_image_query,slide2_top_text,slide2_bottom_text,slide2_image_query,slide3_top_text,slide3_bottom_text,slide3_image_query,slide4_top_text,slide4_bottom_text,slide4_image_query,slide5_top_text,slide5_bottom_text,slide5_image_query,slide6_top_text,slide6_bottom_text,slide6_image_query,caption
\`\`\``, 
            active: true, 
            created: '2024-01-15' 
          }]
        },
        'prompts/blueprints/tutorial_5.md': {
          content: `# Tutorial 5 Blueprint Template

## Field Details Table

| Field # | Field Name | Content Description | Character Limit | Example |
| --- | --- | --- | --- | --- |
| 0 | icp | type of user to target | single word | beginner, expert, DIY |
| 1 | hook_appeal | Psychological trigger/emotion | Single word | curiosity, mastery, efficiency, hack, shortcut |
| 2 | hook_top_text | Main hook message | ≤95 chars | nobody teaches this {{ topic }} method |
| 3 | hook_bottom_text | Hook supporting text + promise | 1 sentence | saves hours every week. wish i knew this sooner. |
| 4 | hook_image_query | Image category for hook | category/subcategory | {{ brand_name }}/tutorial/reveal |
| 5 | slide2_top_text | Step 1 introduction | ≤55 chars | step 1: [foundational action] |
| 6 | slide2_bottom_text | Step 1 details | 2-3 sentences | start here. most people skip this. crucial foundation. |
| 7 | slide2_image_query | Step 1 visualization | category/subcategory | {{ brand_name }}/step1/demo |
| 8 | slide3_top_text | Step 2 progression | ≤55 chars | step 2: [build on foundation] |
| 9 | slide3_bottom_text | Step 2 explanation | 2-3 sentences | this connects everything. the magic happens here. |
| 10 | slide3_image_query | Step 2 visualization | category/subcategory | {{ brand_name }}/step2/process |
| 11 | slide4_top_text | Step 3 advanced | ≤55 chars | step 3: [advanced technique] |
| 12 | slide4_bottom_text | Step 3 mastery tips | 2-3 sentences | pro tip most miss. this separates beginners from pros. |
| 13 | slide4_image_query | Step 3 visualization | category/subcategory | {{ brand_name }}/step3/advanced |
| 14 | slide5_top_text | Product/tool integration | ≤55 chars | {{ brand_name }} automates all this |
| 15 | slide5_bottom_text | How product helps | 2-3 sentences | does steps 1-3 automatically. saves time. perfect results. |
| 16 | slide5_image_query | Product demonstration | category/subcategory | {{ brand_name }}/product/interface |
| 17 | slide6_top_text | Not applicable (5 slides) | N/A | N/A |
| 18 | slide6_bottom_text | Not applicable (5 slides) | N/A | N/A |
| 19 | slide6_image_query | Not applicable (5 slides) | N/A | N/A |
| 20 | caption | Engagement-driving caption | 1-2 sentences + hashtags | master {{ topic }} in minutes. what technique surprised you most? #{{ brand_name }} #tutorial #{{ persona }} |

### Hook Appeal Options for Tutorials:

**Learning Triggers:**
- **curiosity** - "never seen this before"
- **mastery** - "become an expert quickly"
- **efficiency** - "save hours with this trick"
- **hack** - "industry professionals hate this"
- **shortcut** - "skip years of trial and error"
- **insider_knowledge** - "what experts actually do"
- **simplification** - "easier than you think"

**Discovery Triggers:**
- **hidden_feature** - "this was always there"
- **game_changer** - "changes everything"
- **aha_moment** - "finally makes sense"
- **myth_busting** - "everything you knew was wrong"
- **secret_method** - "kept secret for a reason"

### Caption Formula Template:

**Structure**: Learning outcome + Engagement question + Hashtags

**Example Pattern**: "[Skill/result] in [timeframe]. which step was most helpful? #{{ brand_name }} #[tutorial] #[skill]"

### Tutorial Flow:
1. **Hook** - Promise valuable knowledge
2. **Step 1** - Foundation/basics
3. **Step 2** - Build complexity
4. **Step 3** - Advanced technique
5. **Product** - Show how {{ brand_name }} simplifies everything

### Final Output Format (CSV):

**Headers (21 fields):**
\`\`\`
icp,hook_appeal,hook_top_text,hook_bottom_text,hook_image_query,slide2_top_text,slide2_bottom_text,slide2_image_query,slide3_top_text,slide3_bottom_text,slide3_image_query,slide4_top_text,slide4_bottom_text,slide4_image_query,slide5_top_text,slide5_bottom_text,slide5_image_query,slide6_top_text,slide6_bottom_text,slide6_image_query,caption
\`\`\`

**Note**: For tutorial_5 format, fields 17-19 (slide6) should be left empty or filled with "N/A" as this format only uses 5 slides.`,
          versions: [{ 
            version: 'v1', 
            content: `# Tutorial 5 Blueprint Template

## Field Details Table

| Field # | Field Name | Content Description | Character Limit | Example |
| --- | --- | --- | --- | --- |
| 0 | icp | type of user to target | single word | beginner, expert, DIY |
| 1 | hook_appeal | Psychological trigger/emotion | Single word | curiosity, mastery, efficiency, hack, shortcut |
| 2 | hook_top_text | Main hook message | ≤95 chars | nobody teaches this {{ topic }} method |
| 3 | hook_bottom_text | Hook supporting text + promise | 1 sentence | saves hours every week. wish i knew this sooner. |
| 4 | hook_image_query | Image category for hook | category/subcategory | {{ brand_name }}/tutorial/reveal |
| 5 | slide2_top_text | Step 1 introduction | ≤55 chars | step 1: [foundational action] |
| 6 | slide2_bottom_text | Step 1 details | 2-3 sentences | start here. most people skip this. crucial foundation. |
| 7 | slide2_image_query | Step 1 visualization | category/subcategory | {{ brand_name }}/step1/demo |
| 8 | slide3_top_text | Step 2 progression | ≤55 chars | step 2: [build on foundation] |
| 9 | slide3_bottom_text | Step 2 explanation | 2-3 sentences | this connects everything. the magic happens here. |
| 10 | slide3_image_query | Step 2 visualization | category/subcategory | {{ brand_name }}/step2/process |
| 11 | slide4_top_text | Step 3 advanced | ≤55 chars | step 3: [advanced technique] |
| 12 | slide4_bottom_text | Step 3 mastery tips | 2-3 sentences | pro tip most miss. this separates beginners from pros. |
| 13 | slide4_image_query | Step 3 visualization | category/subcategory | {{ brand_name }}/step3/advanced |
| 14 | slide5_top_text | Product/tool integration | ≤55 chars | {{ brand_name }} automates all this |
| 15 | slide5_bottom_text | How product helps | 2-3 sentences | does steps 1-3 automatically. saves time. perfect results. |
| 16 | slide5_image_query | Product demonstration | category/subcategory | {{ brand_name }}/product/interface |
| 17 | slide6_top_text | Not applicable (5 slides) | N/A | N/A |
| 18 | slide6_bottom_text | Not applicable (5 slides) | N/A | N/A |
| 19 | slide6_image_query | Not applicable (5 slides) | N/A | N/A |
| 20 | caption | Engagement-driving caption | 1-2 sentences + hashtags | master {{ topic }} in minutes. what technique surprised you most? #{{ brand_name }} #tutorial #{{ persona }} |

### Hook Appeal Options for Tutorials:

**Learning Triggers:**
- **curiosity** - "never seen this before"
- **mastery** - "become an expert quickly"
- **efficiency** - "save hours with this trick"
- **hack** - "industry professionals hate this"
- **shortcut** - "skip years of trial and error"
- **insider_knowledge** - "what experts actually do"
- **simplification** - "easier than you think"

**Discovery Triggers:**
- **hidden_feature** - "this was always there"
- **game_changer** - "changes everything"
- **aha_moment** - "finally makes sense"
- **myth_busting** - "everything you knew was wrong"
- **secret_method** - "kept secret for a reason"

### Caption Formula Template:

**Structure**: Learning outcome + Engagement question + Hashtags

**Example Pattern**: "[Skill/result] in [timeframe]. which step was most helpful? #{{ brand_name }} #[tutorial] #[skill]"

### Tutorial Flow:
1. **Hook** - Promise valuable knowledge
2. **Step 1** - Foundation/basics
3. **Step 2** - Build complexity
4. **Step 3** - Advanced technique
5. **Product** - Show how {{ brand_name }} simplifies everything

### Final Output Format (CSV):

**Headers (21 fields):**
\`\`\`
icp,hook_appeal,hook_top_text,hook_bottom_text,hook_image_query,slide2_top_text,slide2_bottom_text,slide2_image_query,slide3_top_text,slide3_bottom_text,slide3_image_query,slide4_top_text,slide4_bottom_text,slide4_image_query,slide5_top_text,slide5_bottom_text,slide5_image_query,slide6_top_text,slide6_bottom_text,slide6_image_query,caption
\`\`\`

**Note**: For tutorial_5 format, fields 17-19 (slide6) should be left empty or filled with "N/A" as this format only uses 5 slides.`, 
            active: true, 
            created: '2024-01-15' 
          }]
        },
        'prompts/global/universal_engine_v1.md': {
          content: '### UNIVERSAL ENGINE v1\n\ncsv_header: {{ csv_header }}\nblueprint: {{ blueprint_id }}\n\nglobal_rules:\n- lowercase conversational, no periods line-end, no em-dashes\n- char caps: hook ≤95, slide_top ≤55, caption ≤50 + 4 hashtags\n- {{ brand_name }} appears on slide5 and caption',
          versions: [{ version: 'v1', content: '### UNIVERSAL ENGINE v1\n\ncsv_header: {{ csv_header }}\nblueprint: {{ blueprint_id }}\n\nglobal_rules:\n- lowercase conversational, no periods line-end, no em-dashes\n- char caps: hook ≤95, slide_top ≤55, caption ≤50 + 4 hashtags\n- {{ brand_name }} appears on slide5 and caption', active: true, created: '2024-01-15' }]
        },
        'prompts/clients/vibit/_brand_v1.md': {
          content: '# VIBIT Brand Voice\n\n## Core Values\n- Professional yet approachable\n- Focus on health and wellness transformation\n- Emphasize proven results and scientific backing\n- Target audience: health-conscious individuals 25-55\n\n## Tone Guidelines\n- Encouraging and supportive\n- Evidence-based claims\n- Avoid medical advice\n- Use "you" to create connection\n\n## Banned Words\n- "miracle"\n- "instant"\n- "guaranteed"\n- "cure"',
          versions: [
            { version: 'v1', content: '# VIBIT Brand Voice\n\n## Core Values\n- Professional yet approachable\n- Focus on health and wellness transformation\n- Emphasize proven results and scientific backing\n- Target audience: health-conscious individuals 25-55\n\n## Tone Guidelines\n- Encouraging and supportive\n- Evidence-based claims\n- Avoid medical advice\n- Use "you" to create connection\n\n## Banned Words\n- "miracle"\n- "instant"\n- "guaranteed"\n- "cure"', active: true, created: '2024-01-15' },
            { version: 'v2', content: '# VIBIT Brand Voice v2\n\n## Core Values\n- Professional yet approachable\n- Focus on health and wellness transformation\n- Emphasize proven results and scientific backing\n- Target audience: health-conscious individuals 25-55\n\n## Tone Guidelines\n- Encouraging and supportive\n- Evidence-based claims\n- Avoid medical advice\n- Use "you" to create connection\n- Add personal stories when appropriate\n\n## Banned Words\n- "miracle"\n- "instant"\n- "guaranteed"\n- "cure"\n- "magic"', active: false, created: '2024-01-20' }
          ]
        },
        'prompts/clients/vibit/older_v1.md': {
          content: '# Older Persona Campaign\n\n## Target Demographics\n- Age: 40+ years\n- Focus on health concerns and mobility\n- Emphasize proven, safe results\n- Address common fears about starting fitness\n\n## Messaging Focus\n- "It\'s never too late to start"\n- Gentle, encouraging approach\n- Highlight success stories from similar demographics\n- Emphasize gradual progress over dramatic changes',
          versions: [{ version: 'v1', content: '# Older Persona Campaign\n\n## Target Demographics\n- Age: 40+ years\n- Focus on health concerns and mobility\n- Emphasize proven, safe results\n- Address common fears about starting fitness\n\n## Messaging Focus\n- "It\'s never too late to start"\n- Gentle, encouraging approach\n- Highlight success stories from similar demographics\n- Emphasize gradual progress over dramatic changes', active: true, created: '2024-01-15' }]
        },
        'prompts/clients/vibit/younger_v1.md': {
          content: '# Younger Persona Campaign\n\n## Target Demographics\n- Age: 18-35 years\n- Focus on performance and results\n- Emphasize quick wins and visible progress\n- Address time constraints and busy lifestyles\n\n## Messaging Focus\n- "Transform your life in weeks, not months"\n- High-energy, motivational approach\n- Highlight before/after transformations\n- Emphasize efficiency and time-saving',
          versions: [{ version: 'v1', content: '# Younger Persona Campaign\n\n## Target Demographics\n- Age: 18-35 years\n- Focus on performance and results\n- Emphasize quick wins and visible progress\n- Address time constraints and busy lifestyles\n\n## Messaging Focus\n- "Transform your life in weeks, not months"\n- High-energy, motivational approach\n- Highlight before/after transformations\n- Emphasize efficiency and time-saving', active: true, created: '2024-01-15' }]
        },
        'prompts/clients/pupscan/premium_v1.md': {
          content: '# PupScan Premium Campaign\n\n## Target Demographics\n- Premium pet owners\n- Tech-savvy millennials and Gen Z\n- High disposable income\n- Early adopters\n\n## Messaging Focus\n- Cutting-edge technology\n- Premium experience\n- Exclusive features\n- Peace of mind for pet health',
          versions: [{ version: 'v1', content: '# PupScan Premium Campaign\n\n## Target Demographics\n- Premium pet owners\n- Tech-savvy millennials and Gen Z\n- High disposable income\n- Early adopters\n\n## Messaging Focus\n- Cutting-edge technology\n- Premium experience\n- Exclusive features\n- Peace of mind for pet health', active: true, created: '2024-01-15' }]
        },
        'prompts/clients/pupscan/basic_v1.md': {
          content: '# PupScan Basic Campaign\n\n## Target Demographics\n- Budget-conscious pet owners\n- Value-focused consumers\n- Practical pet care needs\n- Health-conscious families\n\n## Messaging Focus\n- Affordable health monitoring\n- Essential pet care features\n- Family-friendly approach\n- Reliable and trustworthy',
          versions: [{ version: 'v1', content: '# PupScan Basic Campaign\n\n## Target Demographics\n- Budget-conscious pet owners\n- Value-focused consumers\n- Practical pet care needs\n- Health-conscious families\n\n## Messaging Focus\n- Affordable health monitoring\n- Essential pet care features\n- Family-friendly approach\n- Reliable and trustworthy', active: true, created: '2024-01-15' }]
        }
      }

      this.prompts = mockFileSystem
      this.updateClientsAndCampaigns()
      this.notifySubscribers()
    } catch (error) {
      console.error('Error loading prompts:', error)
    }
  }

  // Extract clients and campaigns from file paths
  updateClientsAndCampaigns() {
    const clientsAndCampaigns = {}
    
    Object.keys(this.prompts).forEach(filePath => {
      // Parse file path to extract client and campaign
      const parts = filePath.split('/')
      
      if (parts[1] === 'clients' && parts.length >= 4) {
        const client = parts[2] // e.g., 'vibit'
        const fileName = parts[3] // e.g., '_brand_v1.md' or 'older_v1.md'
        
        if (!clientsAndCampaigns[client]) {
          clientsAndCampaigns[client] = []
        }
        
        // Extract campaign name from filename (skip _brand files)
        if (!fileName.startsWith('_brand')) {
          const campaign = fileName.replace('_v1.md', '') // e.g., 'older'
          if (!clientsAndCampaigns[client].includes(campaign)) {
            clientsAndCampaigns[client].push(campaign)
          }
        }
      }
    })
    
    this.clientsAndCampaigns = clientsAndCampaigns
  }

  // Get all available clients and their campaigns
  getClientsAndCampaigns() {
    return this.clientsAndCampaigns
  }

  // Get all prompts
  getPrompts() {
    return this.prompts
  }

  // Get a specific prompt by path
  getPrompt(path) {
    return this.prompts[path]
  }

  // Get merged prompt with variables
  getMergedPrompt(client, campaign, variables = {}) {
    const globalPrompt = this.prompts['prompts/global/universal_engine_v1.md']
    const brandPrompt = this.prompts[`prompts/clients/${client}/_brand_v1.md`]
    const campaignPrompt = campaign ? this.prompts[`prompts/clients/${client}/${campaign}_v1.md`] : null
    
    let mergedContent = globalPrompt?.content || ''
    
    // Merge brand prompt
    if (brandPrompt) {
      mergedContent += '\n\n' + brandPrompt.content
    }
    
    // Merge campaign prompt
    if (campaignPrompt) {
      mergedContent += '\n\n' + campaignPrompt.content
    }
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      mergedContent = mergedContent.replace(regex, value)
    })
    
    return mergedContent
  }

  // Update a prompt (creates new version)
  updatePrompt(path, newContent) {
    if (!this.prompts[path]) {
      // Create new prompt
      this.prompts[path] = {
        content: newContent,
        versions: [{
          version: 'v1',
          content: newContent,
          active: true,
          created: new Date().toISOString().split('T')[0]
        }]
      }
    } else {
      // Update existing prompt
      const prompt = this.prompts[path]
      const currentVersionNum = Math.max(...prompt.versions.map(v => parseInt(v.version.slice(1)))) + 1
      const newVersion = `v${currentVersionNum}`
      
      // Create new version
      const newVersionData = {
        version: newVersion,
        content: newContent,
        active: true,
        created: new Date().toISOString().split('T')[0]
      }
      
      // Deactivate old versions and add new one
      const updatedVersions = prompt.versions.map(v => ({ ...v, active: false }))
      updatedVersions.push(newVersionData)
      
      this.prompts[path] = {
        ...prompt,
        content: newContent,
        versions: updatedVersions
      }
    }
    
    // Update clients and campaigns after prompt change
    this.updateClientsAndCampaigns()
    
    this.notifySubscribers()
  }

  // Subscribe to changes
  subscribe(callback) {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  // Notify all subscribers
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.prompts))
  }

  // Check if a client exists
  clientExists(client) {
    return Object.keys(this.clientsAndCampaigns).includes(client)
  }

  // Check if a campaign exists for a client
  campaignExists(client, campaign) {
    return this.clientsAndCampaigns[client]?.includes(campaign) || false
  }

  // Get campaigns for a specific client
  getCampaignsForClient(client) {
    return this.clientsAndCampaigns[client] || []
  }
}

// Create singleton instance
const promptStore = new PromptStore()

export default promptStore