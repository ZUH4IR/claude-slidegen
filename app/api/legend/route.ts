import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

interface Variable {
  key: string
  scope: 'global' | 'client' | 'campaign'
  default: any
  overrides?: {
    client?: any
    campaign?: any
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const client = searchParams.get('client')
    const campaign = searchParams.get('campaign')
    
    if (!client) {
      return NextResponse.json({ error: 'Client parameter required' }, { status: 400 })
    }

    const variables: Record<string, Variable> = {}
    
    // Load global rules
    const globalDir = path.join(process.cwd(), 'prompts', 'global')
    try {
      const globalFiles = await fs.readdir(globalDir)
      for (const file of globalFiles) {
        if (file.endsWith('.md')) {
          const content = await fs.readFile(path.join(globalDir, file), 'utf-8')
          const { data } = matter(content)
          
          // Extract variables (excluding meta keys)
          const metaKeys = ['version', 'status', 'description']
          Object.entries(data).forEach(([key, value]) => {
            if (!metaKeys.includes(key)) {
              variables[key] = {
                key,
                scope: 'global',
                default: value
              }
            }
          })
        }
      }
    } catch (err) {
      // Global directory might not exist
    }
    
    // Load client variables
    const clientPath = path.join(process.cwd(), 'prompts', 'clients', client, '_client.md')
    try {
      const clientContent = await fs.readFile(clientPath, 'utf-8')
      const { data: clientData } = matter(clientContent)
      
      const metaKeys = ['version', 'status', 'description']
      Object.entries(clientData).forEach(([key, value]) => {
        if (!metaKeys.includes(key)) {
          if (variables[key]) {
            // Override global
            variables[key].overrides = { client: value }
          } else {
            variables[key] = {
              key,
              scope: 'client',
              default: value
            }
          }
        }
      })
    } catch (err) {
      // Client file might not exist
    }
    
    // Load campaign variables if specified
    if (campaign) {
      const campaignPath = path.join(process.cwd(), 'prompts', 'clients', client, `${campaign}.md`)
      try {
        const campaignContent = await fs.readFile(campaignPath, 'utf-8')
        const { data: campaignData } = matter(campaignContent)
        
        const metaKeys = ['version', 'status', 'description']
        Object.entries(campaignData).forEach(([key, value]) => {
          if (!metaKeys.includes(key)) {
            if (variables[key]) {
              // Override client or global
              if (!variables[key].overrides) {
                variables[key].overrides = {}
              }
              variables[key].overrides.campaign = value
            } else {
              variables[key] = {
                key,
                scope: 'campaign',
                default: value
              }
            }
          }
        })
      } catch (err) {
        // Campaign file might not exist
      }
    }
    
    // Convert to array for easier display
    const variableList = Object.values(variables).map(v => ({
      ...v,
      effectiveValue: v.overrides?.campaign ?? v.overrides?.client ?? v.default
    }))
    
    return NextResponse.json({ variables: variableList })
  } catch (error) {
    console.error('Error loading variable legend:', error)
    return NextResponse.json(
      { error: 'Failed to load variable legend' },
      { status: 500 }
    )
  }
}