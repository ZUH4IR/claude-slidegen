import { loadPrompt, mergePrompts, getHeader, callClaude, validateCSV } from './cliUtils'
import { GenerationConfig, GenerationResult } from './types'

export async function generateHooks(config: GenerationConfig): Promise<string[]> {
  const ctx = {
    brand_name: config.brandSlug.split('_')[0], // Extract brand name
    blueprint_id: config.blueprint,
    csv_header: getHeader(config.blueprint),
    rows: config.rows,
    persona: config.persona,
    hook_appeal: config.hookAppeal,
    topic: config.topic,
    char_cap_hook: config.charCapHook,
    add_selfAwareJoke: config.addSelfAwareJoke,
    product_slide: config.productSlide,
  }

  const engine = loadPrompt('universal_engine_v1.md')
  const brandMod = loadPrompt(`brands/${config.brandSlug}_core_v1.md`)
  const campMod = config.campSlug !== 'none' ? loadPrompt(`campaigns/${config.campSlug}.md`) : ''

  const sys = mergePrompts(engine, brandMod, campMod, ctx)
  const hooksText = await callClaude(sys)
  
  return hooksText
    .split('\n')
    .filter(line => line.match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .slice(0, config.rows)
}

export async function generateCSV(config: GenerationConfig, hooks: string[]): Promise<GenerationResult> {
  const ctx = {
    brand_name: config.brandSlug.split('_')[0],
    blueprint_id: config.blueprint,
    csv_header: getHeader(config.blueprint),
    rows: config.rows,
    persona: config.persona,
    hook_appeal: config.hookAppeal,
    topic: config.topic,
    char_cap_hook: config.charCapHook,
    add_selfAwareJoke: config.addSelfAwareJoke,
    product_slide: config.productSlide,
    hooks: hooks,
  }

  const engine = loadPrompt('universal_engine_v1.md')
  const brandMod = loadPrompt(`brands/${config.brandSlug}_core_v1.md`)
  const campMod = config.campSlug !== 'none' ? loadPrompt(`campaigns/${config.campSlug}.md`) : ''

  const sys = mergePrompts(engine, brandMod, campMod, ctx)
  const csv = await callClaude(sys)
  
  // Validate
  const errors = validateCSV(csv, getHeader(config.blueprint).split(',').length)
  
  return {
    hooks,
    csv,
    errors: errors.length > 0 ? errors : undefined
  }
}