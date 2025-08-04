import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const clientsDir = path.join(process.cwd(), 'prompts', 'clients')
    
    // Get brands (subdirectories in clients folder)
    const brands: string[] = []
    const campaigns: { [brand: string]: string[] } = {}
    
    try {
      const items = await fs.readdir(clientsDir, { withFileTypes: true })
      
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.')) {
          brands.push(item.name)
          campaigns[item.name] = []
          
          // Get campaigns for this brand (files matching pattern)
          const brandDir = path.join(clientsDir, item.name)
          const brandFiles = await fs.readdir(brandDir)
          
          for (const file of brandFiles) {
            // Extract campaign name from files like "older_v1.md"
            if (file.endsWith('.md') && !file.startsWith('_client')) {
              const campaignName = file.replace(/_v\d+\.md$/, '')
              if (!campaigns[item.name].includes(campaignName)) {
                campaigns[item.name].push(campaignName)
              }
            }
          }
        }
      }
    } catch (err) {
      // Clients directory might not exist yet
      console.error('Error reading clients directory:', err)
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
      clients: brands, // Return as clients for consistency
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