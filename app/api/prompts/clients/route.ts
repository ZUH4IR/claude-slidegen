import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const promptsDir = path.join(process.cwd(), 'prompts', 'clients')
    const clients: any[] = []
    
    try {
      // Create the directory structure if it doesn't exist
      await fs.mkdir(promptsDir, { recursive: true })
      
      const items = await fs.readdir(promptsDir, { withFileTypes: true })
      
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.')) {
          const clientData = {
            name: item.name,
            campaigns: [] as string[],
            activeVersion: 1
          }
          
          // Get campaigns for this client
          const clientDir = path.join(promptsDir, item.name)
          const clientItems = await fs.readdir(clientDir)
          
          for (const file of clientItems) {
            // Extract campaign name from filename (e.g., "older_v1.md" -> "older")
            if (file.endsWith('.md') && !file.startsWith('_brand')) {
              const campaignName = file.replace(/_v\d+\.md$/, '')
              if (!clientData.campaigns.includes(campaignName)) {
                clientData.campaigns.push(campaignName)
              }
            }
            
            // Check for brand version
            if (file.startsWith('_brand_v') && file.endsWith('.md')) {
              const version = parseInt(file.match(/_v(\d+)\.md$/)?.[1] || '1')
              clientData.activeVersion = Math.max(clientData.activeVersion, version)
            }
          }
          
          clients.push(clientData)
        }
      }
    } catch (err) {
      console.log('Prompts directory not found, creating it')
    }
    
    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Error loading clients:', error)
    return NextResponse.json({ clients: [] })
  }
}