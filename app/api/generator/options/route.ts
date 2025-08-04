import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const promptsDir = path.join(process.cwd(), 'prompts')
    
    // Get brands (subdirectories in prompts folder)
    const brands: string[] = []
    const campaigns: { [brand: string]: string[] } = {}
    
    try {
      const items = await fs.readdir(promptsDir, { withFileTypes: true })
      
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.')) {
          brands.push(item.name)
          
          // Get campaigns for this brand
          const brandDir = path.join(promptsDir, item.name)
          const brandItems = await fs.readdir(brandDir, { withFileTypes: true })
          
          campaigns[item.name] = brandItems
            .filter(bi => bi.isDirectory() && !bi.name.startsWith('.'))
            .map(bi => bi.name)
        }
      }
    } catch (err) {
      // Prompts directory might not exist yet
      console.error('Error reading prompts directory:', err)
    }
    
    // Get blueprints from the blueprints folder
    const blueprints: string[] = []
    const blueprintsDir = path.join(process.cwd(), 'blueprints')
    
    try {
      const files = await fs.readdir(blueprintsDir)
      for (const file of files) {
        if (file.endsWith('.md')) {
          blueprints.push(file.replace('.md', ''))
        }
      }
    } catch (err) {
      console.error('Error reading blueprints directory:', err)
    }
    
    return NextResponse.json({
      brands,
      campaigns,
      blueprints
    })
  } catch (error) {
    console.error('Error loading options:', error)
    return NextResponse.json(
      { error: 'Failed to load options' },
      { status: 500 }
    )
  }
}