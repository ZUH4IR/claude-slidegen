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
    
    // Add common default variables
    const commonVariables = {
      client_name: { key: 'client_name', scope: 'global' as const, default: client || 'client' },
      campaign_name: { key: 'campaign_name', scope: 'global' as const, default: campaign || 'campaign' },
      product_slide: { key: 'product_slide', scope: 'global' as const, default: 5 },
      tone_strength: { key: 'tone_strength', scope: 'global' as const, default: 80 },
      rage_bait_intensity: { key: 'rage_bait_intensity', scope: 'global' as const, default: 50 },
      hook_style: { key: 'hook_style', scope: 'global' as const, default: 'curiosity' },
      cta_variant: { key: 'cta_variant', scope: 'global' as const, default: 'soft' },
      audience: { key: 'audience', scope: 'campaign' as const, default: 'general' },
      primary_benefit: { key: 'primary_benefit', scope: 'client' as const, default: 'main benefit' },
      secondary_benefit: { key: 'secondary_benefit', scope: 'client' as const, default: 'additional benefit' },
      product_type: { key: 'product_type', scope: 'client' as const, default: 'product' },
      integration_style: { key: 'integration_style', scope: 'client' as const, default: 'natural' },
      relationship: { key: 'relationship', scope: 'campaign' as const, default: 'partner' },
      betrayal_type: { key: 'betrayal_type', scope: 'campaign' as const, default: 'trust violation' },
      discovery_method: { key: 'discovery_method', scope: 'campaign' as const, default: 'accidentally found' },
      consequence: { key: 'consequence', scope: 'campaign' as const, default: 'confrontation' },
      symptom_start: { key: 'symptom_start', scope: 'campaign' as const, default: 'suddenly felt' },
      misdiagnosis: { key: 'misdiagnosis', scope: 'campaign' as const, default: 'stress' },
      real_condition: { key: 'real_condition', scope: 'campaign' as const, default: 'actual issue' },
      villain_type: { key: 'villain_type', scope: 'campaign' as const, default: 'boss' },
      injustice: { key: 'injustice', scope: 'campaign' as const, default: 'unfair treatment' }
    }
    
    // Initialize with common variables
    Object.assign(variables, commonVariables)
    
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
    const clientDir = path.join(process.cwd(), 'prompts', 'clients', client)
    try {
      const files = await fs.readdir(clientDir)
      const clientFile = files.find(f => f.startsWith('_client_v') && f.endsWith('.md'))
      
      if (clientFile) {
        const clientPath = path.join(clientDir, clientFile)
        const clientContent = await fs.readFile(clientPath, 'utf-8')
        const { data: clientData } = matter(clientContent)
      
        const metaKeys = ['version', 'status', 'description']
        
        // Handle client_variables if present
        if (clientData.client_variables && typeof clientData.client_variables === 'object') {
          Object.entries(clientData.client_variables).forEach(([key, value]) => {
            if (variables[key]) {
              variables[key].overrides = { client: value }
            } else {
              variables[key] = {
                key,
                scope: 'client',
                default: value
              }
            }
          })
        }
        
        Object.entries(clientData).forEach(([key, value]) => {
          if (!metaKeys.includes(key) && key !== 'client_variables') {
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
      }
    } catch (err) {
      // Client file might not exist
    }
    
    // Load campaign variables if specified
    if (campaign) {
      try {
        const campaignFiles = await fs.readdir(clientDir)
        const campaignFile = campaignFiles.find(f => f.startsWith(`${campaign}_v`) && f.endsWith('.md'))
        
        if (campaignFile) {
          const campaignPath = path.join(clientDir, campaignFile)
          const campaignContent = await fs.readFile(campaignPath, 'utf-8')
          const { data: campaignData } = matter(campaignContent)
        
          const metaKeys = ['version', 'status', 'description']
          
          // Handle campaign_variables if present
          if (campaignData.campaign_variables && typeof campaignData.campaign_variables === 'object') {
            Object.entries(campaignData.campaign_variables).forEach(([key, value]) => {
              if (variables[key]) {
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
            })
          }
          
          Object.entries(campaignData).forEach(([key, value]) => {
            if (!metaKeys.includes(key) && key !== 'campaign_variables') {
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
        }
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