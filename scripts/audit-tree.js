#!/usr/bin/env node
const { promises: fs } = require('fs')
const path = require('path')
const ROOT_DIR = path.join(__dirname, '..')
const PROMPTS_DIR = path.join(ROOT_DIR, 'prompts')

// Valid file patterns
const VALID_PATTERNS = {
  global: [
    /^rules_v\d+\.md$/,
    /^engine_v\d+\.md$/,      // Engine files
    /^blueprints\.yaml$/
  ],
  client: [
    /^_brand_v\d+\.md$/,     // Brand files (renamed from _client_)
    /^[a-z0-9-]+_v\d+\.md$/   // Campaign files
  ]
}

// Files that should be in specific locations
const REQUIRED_FILES = {
  'prompts/global/rules_v1.md': 'Global rules file',
  'prompts/global/blueprints.yaml': 'Global blueprints configuration'
}

async function auditTree() {
  console.log('🔍 Auditing prompt tree structure...\n')
  
  const errors = []
  const warnings = []
  
  try {
    // Check if prompts directory exists
    await fs.access(PROMPTS_DIR)
  } catch {
    errors.push('Missing prompts/ directory')
    console.error('❌ Audit failed: prompts/ directory not found')
    process.exit(1)
  }
  
  // Check required files
  for (const [filePath, description] of Object.entries(REQUIRED_FILES)) {
    const fullPath = path.join(ROOT_DIR, filePath)
    try {
      await fs.access(fullPath)
      console.log(`✓ Found ${description}`)
    } catch {
      errors.push(`Missing required file: ${filePath} (${description})`)
    }
  }
  
  // Recursively check directory structure
  async function checkDirectory(dir, relativePath = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relPath = path.join(relativePath, entry.name)
      
      if (entry.isDirectory()) {
        // Check directory placement rules
        if (relativePath === '') {
          // Root level - only 'global' and 'clients' allowed
          if (entry.name !== 'global' && entry.name !== 'clients') {
            errors.push(`Invalid directory at root: ${relPath}`)
          }
        } else if (relativePath === 'clients') {
          // Client directories must be lowercase with hyphens
          if (!/^[a-z0-9-]+$/.test(entry.name)) {
            errors.push(`Invalid client directory name: ${relPath} (must be lowercase with hyphens)`)
          }
        } else if (relativePath.startsWith('clients/') && relativePath.split('/').length === 2) {
          // Inside a client directory - no subdirectories allowed
          warnings.push(`Subdirectory found in client folder: ${relPath} (campaigns should be files, not folders)`)
        }
        
        await checkDirectory(fullPath, relPath)
      } else if (entry.isFile()) {
        // Check file placement and naming
        if (relativePath === '') {
          // No files allowed at root
          errors.push(`File at root level: ${relPath}`)
        } else if (relativePath === 'global') {
          // Check global file patterns
          const isValid = VALID_PATTERNS.global.some(pattern => pattern.test(entry.name))
          if (!isValid) {
            errors.push(`Invalid file in global/: ${relPath}`)
          }
        } else if (relativePath.startsWith('clients/')) {
          const pathParts = relativePath.split('/')
          if (pathParts.length === 2) {
            // Inside a client directory
            const isValid = VALID_PATTERNS.client.some(pattern => pattern.test(entry.name))
            if (!isValid) {
              errors.push(`Invalid file in client directory: ${relPath}`)
            }
            
            // Check for old naming convention
            if (entry.name.startsWith('_client_')) {
              warnings.push(`Old naming convention: ${relPath} should be renamed to _brand_v*.md`)
            }
          }
        } else {
          errors.push(`File in unexpected location: ${relPath}`)
        }
        
        // Check file extension
        if (!entry.name.endsWith('.md') && !entry.name.endsWith('.yaml')) {
          errors.push(`Invalid file type: ${relPath} (only .md and .yaml allowed)`)
        }
      }
    }
  }
  
  await checkDirectory(PROMPTS_DIR)
  
  // Report results
  console.log('\n📊 Audit Summary:')
  console.log(`   Errors: ${errors.length}`)
  console.log(`   Warnings: ${warnings.length}`)
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    warnings.forEach(w => console.log(`   - ${w}`))
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach(e => console.log(`   - ${e}`))
    console.log('\n❌ Audit failed! Fix the errors above.')
    process.exit(1)
  } else {
    console.log('\n✅ Audit passed! Tree structure is valid.')
    process.exit(0)
  }
}

// Run audit
auditTree().catch(err => {
  console.error('❌ Audit script error:', err)
  process.exit(1)
})