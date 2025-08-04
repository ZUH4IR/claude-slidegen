import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { stringify } from 'csv-stringify/sync'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface CSVRequest {
  config: {
    brand: string
    campaign: string
    blueprint: string
    rows: number
    hookAppeal: string
    charCap: number
    topic: string
    productSlide: number
    addSelfAwareJoke: boolean
    addBottomText: boolean
    toneStrength?: number
    rageBaitIntensity?: number
  }
  hooks: string[]
}

async function loadPrompt(brand: string, campaign?: string): Promise<string> {
  let content = ''
  
  // Load global rules
  try {
    const globalPath = path.join(process.cwd(), 'prompts', 'global', 'rules_v1.md')
    const globalContent = await fs.readFile(globalPath, 'utf-8')
    const { content: globalRules } = matter(globalContent)
    content += globalRules + '\n\n'
  } catch (err) {
    console.log('No global rules found')
  }
  
  // Load brand prompt
  try {
    const clientsDir = path.join(process.cwd(), 'prompts', 'clients', brand)
    const brandFiles = await fs.readdir(clientsDir)
    const brandFile = brandFiles.find(f => f.startsWith('_brand_v') && f.endsWith('.md'))
    if (!brandFile) throw new Error('No brand file found')
    const brandPath = path.join(clientsDir, brandFile)
    const brandContent = await fs.readFile(brandPath, 'utf-8')
    const { content: brandPrompt } = matter(brandContent)
    content += brandPrompt + '\n\n'
  } catch (err) {
    console.error('Error loading brand prompt:', err)
  }
  
  // Load campaign prompt if specified
  if (campaign) {
    try {
      const clientsDir = path.join(process.cwd(), 'prompts', 'clients', brand)
      const campaignFiles = await fs.readdir(clientsDir)
      const campaignFile = campaignFiles.find(f => f.startsWith(`${campaign}_v`) && f.endsWith('.md'))
      if (!campaignFile) throw new Error('No campaign file found')
      const campaignPath = path.join(clientsDir, campaignFile)
      const campaignContent = await fs.readFile(campaignPath, 'utf-8')
      const { content: campaignPrompt } = matter(campaignContent)
      content += campaignPrompt + '\n\n'
    } catch (err) {
      console.error('Error loading campaign prompt:', err)
    }
  }
  
  return content
}

async function loadBlueprint(blueprintName: string): Promise<string> {
  try {
    const blueprintPath = path.join(process.cwd(), 'blueprints', `${blueprintName}.md`)
    return await fs.readFile(blueprintPath, 'utf-8')
  } catch (err) {
    console.error('Error loading blueprint:', err)
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const { config, hooks }: CSVRequest = await request.json()
    
    // Load the combined prompt
    const systemPrompt = await loadPrompt(config.brand, config.campaign)
    
    // Load blueprint
    const blueprint = await loadBlueprint(config.blueprint)
    
    // Build the user prompt
    const userPrompt = `Generate TikTok-style content based on these hooks and blueprint.

Topic: ${config.topic}
Blueprint to follow:
${blueprint}

Hooks to use:
${hooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Additional settings:
- Character limit per slide: ${config.charCap}
- Product slide: Slide ${config.productSlide}
${config.addSelfAwareJoke ? '- Include a self-aware joke' : ''}
${config.addBottomText ? '- Hooks include bottom text (format: "Top text | Bottom text")' : ''}
${config.toneStrength ? `- Tone strength: ${config.toneStrength}%` : ''}
${config.rageBaitIntensity ? `- Rage bait intensity: ${config.rageBaitIntensity}%` : ''}

Generate ${config.rows} complete slide decks. Return the output in CSV format with these columns:
Hook, Slide 1, Slide 2, Slide 3, Slide 4, Slide 5

IMPORTANT: Return ONLY the CSV data, no markdown formatting or extra text.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })
    
    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    
    // Clean up the CSV content (remove any markdown formatting)
    const cleanedContent = content
      .replace(/```csv\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    
    // Save to history
    const timestamp = new Date().toISOString()
    const historyDir = path.join(process.cwd(), 'history')
    await fs.mkdir(historyDir, { recursive: true })
    
    const historyFile = path.join(historyDir, `${timestamp.replace(/[:.]/g, '-')}.json`)
    await fs.writeFile(historyFile, JSON.stringify({
      timestamp,
      config,
      hooks,
      csv: cleanedContent
    }, null, 2))
    
    return NextResponse.json({ csv: cleanedContent })
  } catch (error) {
    console.error('Error generating CSV:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV' },
      { status: 500 }
    )
  }
}