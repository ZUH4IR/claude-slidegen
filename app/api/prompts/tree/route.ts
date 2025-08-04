import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

interface TreeNode {
  name: string
  type: 'section' | 'brand' | 'campaign' | 'file' | 'template'
  children?: TreeNode[]
  hasPrompt?: boolean
}

export async function GET() {
  try {
    const tree: TreeNode[] = []
    
    // Universal section
    const universalNode: TreeNode = {
      name: 'Universal',
      type: 'section',
      children: []
    }
    
    // Check for global-rules.md in the root
    try {
      await fs.access(path.join(process.cwd(), 'global-rules.md'))
      universalNode.children!.push({
        name: 'Global Rules',
        type: 'file',
        hasPrompt: true
      })
    } catch {}
    
    tree.push(universalNode)
    
    // Templates section (blueprints)
    const templatesNode: TreeNode = {
      name: 'Templates',
      type: 'section',
      children: []
    }
    
    try {
      const blueprintsDir = path.join(process.cwd(), 'blueprints')
      const blueprints = await fs.readdir(blueprintsDir)
      
      for (const blueprint of blueprints) {
        if (blueprint.endsWith('.md')) {
          templatesNode.children!.push({
            name: blueprint.replace('.md', ''),
            type: 'template',
            hasPrompt: true
          })
        }
      }
    } catch (err) {
      console.log('Blueprints directory not found')
    }
    
    tree.push(templatesNode)
    
    // Clients section
    const clientsNode: TreeNode = {
      name: 'Clients',
      type: 'section',
      children: []
    }
    
    const promptsDir = path.join(process.cwd(), 'prompts')
    
    try {
      const brands = await fs.readdir(promptsDir, { withFileTypes: true })
      
      for (const brand of brands) {
        if (brand.isDirectory() && !brand.name.startsWith('.')) {
          const brandNode: TreeNode = {
            name: brand.name,
            type: 'brand',
            children: []
          }
          
          // Check if brand has a prompt.md file
          try {
            await fs.access(path.join(promptsDir, brand.name, 'prompt.md'))
            brandNode.hasPrompt = true
          } catch {}
          
          // Get campaigns
          const brandDir = path.join(promptsDir, brand.name)
          const items = await fs.readdir(brandDir, { withFileTypes: true })
          
          for (const item of items) {
            if (item.isDirectory() && !item.name.startsWith('.')) {
              const campaignNode: TreeNode = {
                name: item.name,
                type: 'campaign'
              }
              
              // Check if campaign has a prompt.md file
              try {
                await fs.access(path.join(brandDir, item.name, 'prompt.md'))
                campaignNode.hasPrompt = true
              } catch {}
              
              brandNode.children!.push(campaignNode)
            }
          }
          
          clientsNode.children!.push(brandNode)
        }
      }
    } catch (err) {
      console.log('Prompts directory not found')
    }
    
    tree.push(clientsNode)
    
    return NextResponse.json({ tree })
  } catch (error) {
    console.error('Error building tree:', error)
    return NextResponse.json({ tree: [] })
  }
}