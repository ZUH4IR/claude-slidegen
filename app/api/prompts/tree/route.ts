import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function GET() {
  try {
    const promptsDir = path.join(process.cwd(), 'prompts')
    const globalDir = path.join(promptsDir, 'global')
    const clientsDir = path.join(promptsDir, 'clients')
    
    const result = {
      global: [] as any[],
      blueprints: [] as any[],
      clients: {} as Record<string, any>
    }
    
    // Load global files
    try {
      const globalFiles = await fs.readdir(globalDir)
      for (const file of globalFiles) {
        if (file.endsWith('.md')) {
          const fullPath = path.join(globalDir, file)
          const content = await fs.readFile(fullPath, 'utf-8')
          const { data } = matter(content)
          
          result.global.push({
            name: file,
            type: 'file',
            path: `global/${file.replace('.md', '')}`,
            metadata: {
              version: data.version || 1,
              status: data.status,
              isGlobal: true
            }
          })
        }
      }
    } catch (err) {
      // Global directory might not exist
    }
    
    // Load blueprints
    const blueprintsDir = path.join(process.cwd(), 'blueprints')
    try {
      const blueprintFiles = await fs.readdir(blueprintsDir)
      for (const file of blueprintFiles) {
        if (file.endsWith('.md')) {
          result.blueprints.push({
            name: file,
            type: 'file',
            path: `blueprints/${file.replace('.md', '')}`,
            metadata: {
              isBlueprint: true
            }
          })
        }
      }
    } catch (err) {
      // Blueprints directory might not exist
    }
    
    // Load clients and their campaigns
    try {
      const clientDirs = await fs.readdir(clientsDir)
      
      for (const clientName of clientDirs) {
        const clientPath = path.join(clientsDir, clientName)
        const stat = await fs.stat(clientPath)
        
        if (stat.isDirectory()) {
          result.clients[clientName] = {
            _version: 1,
            campaigns: []
          }
          
          const clientFiles = await fs.readdir(clientPath)
          
          // Find client file version
          const clientFile = clientFiles.find(f => f.startsWith('_client_v') && f.endsWith('.md'))
          if (clientFile) {
            const match = clientFile.match(/_v(\d+)\.md$/)
            if (match) {
              result.clients[clientName]._version = parseInt(match[1])
            }
          }
          
          // Find campaigns
          for (const file of clientFiles) {
            if (file.endsWith('.md') && !file.startsWith('_client')) {
              // Extract campaign name without version
              const campaignName = file.replace(/_v\d+\.md$/, '').replace('.md', '')
              if (!result.clients[clientName].campaigns.includes(campaignName)) {
                result.clients[clientName].campaigns.push(campaignName)
              }
            }
          }
        }
      }
    } catch (err) {
      // Clients directory might not exist
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error loading prompts tree:', error)
    return NextResponse.json(
      { error: 'Failed to load prompts tree' },
      { status: 500 }
    )
  }
}