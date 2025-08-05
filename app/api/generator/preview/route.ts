import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    const { client, campaign, blueprint, hookAppeal, charCap, topic, productSlide, addSelfAwareJoke, addBottomText, toneStrength, rageBaitIntensity } = config

    const debugData: any = {
      config,
      clientPrompt: '',
      campaignPrompt: '',
      blueprint: '',
      fullPrompt: '',
      exampleOutput: ''
    }

    // Load client prompt
    try {
      const clientPath = path.join(process.cwd(), 'prompts', 'clients', client, '_brand.md')
      const clientContent = await readFile(clientPath, 'utf-8')
      const { content: clientPromptContent } = matter(clientContent)
      debugData.clientPrompt = clientPromptContent.trim()
    } catch (err) {
      debugData.clientPrompt = `[Client prompt not found for: ${client}]`
    }

    // Load campaign prompt if specified
    if (campaign) {
      try {
        const campaignPath = path.join(process.cwd(), 'prompts', 'clients', client, `${campaign}.md`)
        const campaignContent = await readFile(campaignPath, 'utf-8')
        const { content: campaignPromptContent } = matter(campaignContent)
        debugData.campaignPrompt = campaignPromptContent.trim()
      } catch (err) {
        debugData.campaignPrompt = `[Campaign prompt not found for: ${campaign}]`
      }
    }

    // Load blueprint
    try {
      const blueprintPath = path.join(process.cwd(), 'blueprints', `${blueprint}.md`)
      const blueprintContent = await readFile(blueprintPath, 'utf-8')
      debugData.blueprint = blueprintContent.trim()
    } catch (err) {
      debugData.blueprint = `[Blueprint not found: ${blueprint}]`
    }

    // Construct the full prompt chain
    const promptParts = []
    
    promptParts.push('=== SYSTEM PROMPT ===')
    promptParts.push('You are an AI assistant specialized in generating social media content.')
    promptParts.push('')
    
    promptParts.push('=== CLIENT CONTEXT ===')
    promptParts.push(debugData.clientPrompt || '[No client prompt]')
    promptParts.push('')
    
    if (campaign && debugData.campaignPrompt) {
      promptParts.push('=== CAMPAIGN CONTEXT ===')
      promptParts.push(debugData.campaignPrompt)
      promptParts.push('')
    }
    
    promptParts.push('=== GENERATION PARAMETERS ===')
    promptParts.push(`Topic: ${topic}`)
    promptParts.push(`Hook Appeal: ${hookAppeal}`)
    promptParts.push(`Character Cap: ${charCap}`)
    promptParts.push(`Number of Hooks: ${config.rows || 5}`)
    promptParts.push(`Product Slide: Slide ${productSlide}`)
    
    if (addSelfAwareJoke) {
      promptParts.push('Include Self-Aware Joke: Yes')
    }
    
    if (addBottomText) {
      promptParts.push('Generate with Bottom Text: Yes')
    }
    
    if (toneStrength) {
      promptParts.push(`Tone Strength: ${toneStrength}%`)
    }
    
    if (rageBaitIntensity) {
      promptParts.push(`Rage Bait Intensity: ${rageBaitIntensity}%`)
    }
    
    promptParts.push('')
    promptParts.push('=== BLUEPRINT STRUCTURE ===')
    promptParts.push(debugData.blueprint || '[No blueprint]')
    promptParts.push('')
    
    promptParts.push('=== GENERATION INSTRUCTIONS ===')
    promptParts.push(`Generate ${config.rows || 5} hooks with ${hookAppeal} appeal.`)
    promptParts.push(`Each hook should be under ${charCap} characters.`)
    promptParts.push('Follow the blueprint structure for slide progression.')
    
    if (addBottomText) {
      promptParts.push('Format hooks with bottom text: [TOP TEXT] | [BOTTOM TEXT]')
    }
    
    debugData.fullPrompt = promptParts.join('\n')

    // Example output structure
    const exampleParts = []
    exampleParts.push('=== EXPECTED OUTPUT FORMAT ===')
    exampleParts.push('')
    
    if (addBottomText) {
      exampleParts.push('Hook 1: [Hook with top text] | [Bottom text]')
      exampleParts.push('Hook 2: [Hook with top text] | [Bottom text]')
    } else {
      exampleParts.push('Hook 1: [Hook text under ' + charCap + ' characters]')
      exampleParts.push('Hook 2: [Hook text under ' + charCap + ' characters]')
    }
    
    exampleParts.push('...')
    exampleParts.push('')
    exampleParts.push('Then for each selected hook, generate 5 slides:')
    exampleParts.push('- Slide 1: Hook (same as above)')
    exampleParts.push('- Slide 2: [Content following blueprint]')
    exampleParts.push('- Slide 3: [Content following blueprint]')
    exampleParts.push(`- Slide ${productSlide === 4 ? '4' : '4'}: ${productSlide === 4 ? '[Product placement]' : '[Content following blueprint]'}`)
    exampleParts.push(`- Slide 5: ${productSlide === 5 ? '[Product placement]' : '[Content following blueprint]'}`)
    
    if (addSelfAwareJoke) {
      exampleParts.push('')
      exampleParts.push('Note: Include a self-aware joke in one of the slides.')
    }
    
    debugData.exampleOutput = exampleParts.join('\n')

    return NextResponse.json(debugData)
  } catch (error) {
    console.error('Preview generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}