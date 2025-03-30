import type { EmojiConfig, EmojiKeywords } from './types'

/**
 * Split string into emojis, keeping composite emojis together
 */
export function splitEmojis(str: string): string[] {
  console.log('Splitting emoji string:', str)
  // Use Array.from to correctly handle multi-codepoint Unicode emojis (grapheme clusters)
  const emojis = Array.from(str).filter(part => !/\s/.test(part)) // Also filter out whitespace characters
  console.log('Split emojis:', emojis)
  return emojis
}

/**
 * Process a config value, ensuring it's a string
 */
function processConfigValue(value: string): string {
  return value
}

/**
 * Parses a config object into an EmojiConfig object
 */
export function parseConfig(config: unknown): EmojiConfig | EmojiKeywords {
  try {    
    // Check if this is a keywords file (array of emoji: name pairs)
    if (Array.isArray(config)) {
      const keywords: EmojiKeywords = {}
      for (const item of config) {
        const [emoji, name] = Object.entries(item)[0]
        if (typeof emoji === 'string' && typeof name === 'string') {
          keywords[emoji] = name
        }
      }
      return keywords
    }
    
    // Otherwise, treat as emoji config
    const processedConfig: EmojiConfig = {}
    if (typeof config === 'object' && config !== null) {
      for (const [category, items] of Object.entries(config)) {
        processedConfig[category] = {}
        
        // Items is an array of objects
        if (Array.isArray(items)) {
          for (const item of items) {
            // Each item is an object with a single key-value pair
            const [subcategory, emojis] = Object.entries(item)[0]
            if (typeof subcategory === 'string' && typeof emojis === 'string') {
              processedConfig[category][subcategory] = processConfigValue(emojis)
            }
          }
        }
      }
    }

    return processedConfig
  } catch (error) {
    console.error('Failed to parse emoji config:', error)
    throw new Error('Invalid emoji configuration format')
  }
}

/**
 * Enriches keywords with category and subcategory information
 */
export function enrichKeywords(keywords: EmojiKeywords, config: EmojiConfig): EmojiKeywords {
  const enriched: EmojiKeywords = { ...keywords }
  
  for (const [category, subcategories] of Object.entries(config)) {
    for (const [subcategory, value] of Object.entries(subcategories)) {
      const emojis = typeof value === 'string' ? splitEmojis(value) : []
      for (const emoji of emojis) {
        if (enriched[emoji]) {
          enriched[emoji] = `${enriched[emoji]}, ${category}, ${subcategory}`
        }
      }
    }
  }
  
  return enriched
} 