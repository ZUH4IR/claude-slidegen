// This is a mock API layer that would connect to the backend
// In a real implementation, this would make HTTP requests to a Node.js server

export async function generateSlides(config) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock response based on the config
  const hooks = [
    `doctor said never run again but i proved him wrong with ${config.brand_name}`,
    `this ${config.persona} person transformed their life in just 30 days`,
    `the secret ${config.brand_name} doesn't want you to know about`
  ].slice(0, config.rows)

  const csvHeaders = config.blueprint_id === 'story_6' 
    ? 'hook_top_text,slide1_top,slide1_bottom,slide2_top,slide2_bottom,slide3_top,slide3_bottom,slide4_top,slide4_bottom,slide5_top,slide5_bottom,slide6_top,slide6_bottom,caption'
    : 'hook_top_text,slide1_top,slide1_bottom,slide2_top,slide2_bottom,slide3_top,slide3_bottom,slide4_top,slide4_bottom,slide5_top,slide5_bottom,caption'

  const csvRows = hooks.map((hook, index) => {
    const baseRow = [
      hook,
      `slide ${index + 1} top content`,
      `slide ${index + 1} bottom content`,
      `slide ${index + 2} top content`,
      `slide ${index + 2} bottom content`,
      `slide ${index + 3} top content`,
      `slide ${index + 3} bottom content`,
      `slide ${index + 4} top content`,
      `slide ${index + 4} bottom content`,
      `slide ${index + 5} top content`,
      `slide ${index + 5} bottom content`
    ]

    if (config.blueprint_id === 'story_6') {
      baseRow.push(`slide ${index + 6} top content`)
      baseRow.push(`slide ${index + 6} bottom content`)
    }

    baseRow.push(`caption with ${config.brand_name} hashtags`)

    return baseRow.join(',')
  })

  const csv = [csvHeaders, ...csvRows].join('\n')

  // Mock validation
  const validation = {
    passed: true,
    message: 'CSV format is valid'
  }

  return {
    hooks,
    csv,
    validation,
    config
  }
}

// In a real implementation, this would make actual API calls:
/*
export async function generateSlides(config) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config)
  })
  
  if (!response.ok) {
    throw new Error('Failed to generate slides')
  }
  
  return response.json()
}
*/ 