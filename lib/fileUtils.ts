import fs from 'fs/promises'
import path from 'path'
import { PromptFile } from './types'

export async function getPromptFiles(): Promise<PromptFile[]> {
  const promptsDir = path.join(process.cwd(), 'prompts')
  const files: PromptFile[] = []
  
  // Get universal engine
  const universalPath = path.join(promptsDir, 'universal_engine_v1.md')
  const universalContent = await fs.readFile(universalPath, 'utf-8')
  files.push({
    name: 'Universal Engine',
    path: 'universal_engine_v1.md',
    content: universalContent
  })
  
  // Get brands
  const brandsDir = path.join(promptsDir, 'brands')
  const brandFiles = await fs.readdir(brandsDir)
  for (const file of brandFiles) {
    if (file.endsWith('.md')) {
      const content = await fs.readFile(path.join(brandsDir, file), 'utf-8')
      files.push({
        name: `Brand: ${file.replace('.md', '').replace('_core_v1', '')}`,
        path: `brands/${file}`,
        content
      })
    }
  }
  
  // Get campaigns
  const campaignsDir = path.join(promptsDir, 'campaigns')
  try {
    const campaignFiles = await fs.readdir(campaignsDir)
    for (const file of campaignFiles) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(campaignsDir, file), 'utf-8')
        files.push({
          name: `Campaign: ${file.replace('.md', '')}`,
          path: `campaigns/${file}`,
          content
        })
      }
    }
  } catch (e) {
    // Campaigns dir might not exist
  }
  
  // Get blueprints
  const blueprintsPath = path.join(promptsDir, 'blueprints.yaml')
  const blueprintsContent = await fs.readFile(blueprintsPath, 'utf-8')
  files.push({
    name: 'Blueprints',
    path: 'blueprints.yaml',
    content: blueprintsContent
  })
  
  // Get legacy client files
  const clientsDir = path.join(promptsDir, 'clients')
  try {
    const clientDirs = await fs.readdir(clientsDir)
    for (const clientDir of clientDirs) {
      const clientPath = path.join(clientsDir, clientDir)
      const stats = await fs.stat(clientPath)
      if (stats.isDirectory()) {
        const clientFiles = await fs.readdir(clientPath)
        for (const file of clientFiles) {
          if (file.endsWith('.md')) {
            const content = await fs.readFile(path.join(clientPath, file), 'utf-8')
            files.push({
              name: file,
              path: `clients/${clientDir}/${file}`,
              content
            })
          }
        }
      }
    }
  } catch (e) {
    // Clients dir might not exist
  }
  
  return files
}

export async function savePromptFile(filePath: string, content: string): Promise<void> {
  const fullPath = path.join(process.cwd(), 'prompts', filePath)
  await fs.writeFile(fullPath, content, 'utf-8')
}

export async function getBrandOptions(): Promise<string[]> {
  const brandsDir = path.join(process.cwd(), 'prompts', 'brands')
  const files = await fs.readdir(brandsDir)
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('_core_v1.md', ''))
}

export async function getCampaignOptions(): Promise<string[]> {
  const campaignsDir = path.join(process.cwd(), 'prompts', 'campaigns')
  try {
    const files = await fs.readdir(campaignsDir)
    return files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
  } catch (e) {
    return []
  }
}