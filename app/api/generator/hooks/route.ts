import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface Config {
  brand: string
  campaign: string
  blueprint: string
  rows: number
  hookAppeal: string
  charCap: number
  topic: string
  productSlide: number
  addSelfAwareJoke: boolean
  toneStrength?: number
  rageBaitIntensity?: number
}

async function loadPrompt(brand: string, campaign?: string): Promise<string> {
  let content = ''
  
  // Load global rules
  try {
    const globalPath = path.join(process.cwd(), 'global-rules.md')
    content += await fs.readFile(globalPath, 'utf-8') + '\n\n'
  } catch (err) {
    console.log('No global rules found')
  }
  
  // Load brand prompt
  try {
    const brandPath = path.join(process.cwd(), 'prompts', brand, 'prompt.md')
    const brandContent = await fs.readFile(brandPath, 'utf-8')
    const { content: brandPrompt } = matter(brandContent)
    content += brandPrompt + '\n\n'
  } catch (err) {
    console.error('Error loading brand prompt:', err)
  }
  
  // Load campaign prompt if specified
  if (campaign) {
    try {
      const campaignPath = path.join(process.cwd(), 'prompts', brand, campaign, 'prompt.md')
      const campaignContent = await fs.readFile(campaignPath, 'utf-8')
      const { content: campaignPrompt } = matter(campaignContent)
      content += campaignPrompt + '\n\n'
    } catch (err) {
      console.error('Error loading campaign prompt:', err)
    }
  }
  
  return content
}

export async function POST(request: NextRequest) {
  try {
    const config: Config = await request.json()
    
    // Load the combined prompt
    const systemPrompt = await loadPrompt(config.brand, config.campaign)
    
    // Build the user prompt
    const userPrompt = `Generate ${config.rows} hooks for TikTok-style content.

Topic: ${config.topic}
Hook Appeal: ${config.hookAppeal}
Character Limit: ${config.charCap}
Blueprint: ${config.blueprint}
${config.addSelfAwareJoke ? 'Include a self-aware joke in the content.' : ''}
${config.toneStrength ? `Tone Strength: ${config.toneStrength}%` : ''}
${config.rageBaitIntensity ? `Rage Bait Intensity: ${config.rageBaitIntensity}%` : ''}

Return ONLY the hooks, one per line, no numbering or formatting.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
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
    const hooks = content.trim().split('\n').filter(h => h.trim())
    
    return NextResponse.json({ hooks })
  } catch (error) {
    console.error('Error generating hooks:', error)
    return NextResponse.json(
      { error: 'Failed to generate hooks' },
      { status: 500 }
    )
  }
}