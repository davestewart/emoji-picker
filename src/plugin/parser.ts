import { parse } from 'yaml'
import type { EmojiConfig, EmojiKeywords } from './types'

declare module 'yaml' {
  export function parse(yaml: string): any
}

/**
 * Split string into emojis, keeping composite emojis together
 */
function splitEmojis(str: string): string[] {
  // This regex matches:
  // - Individual emoji characters
  // - Emoji followed by variation selectors
  // - Zero-width joiner sequences
  return str.match(/\p{Emoji}(\u{FE0F}|\u{FE0E})?(?:\u{200D}\p{Emoji}(\u{FE0F}|\u{FE0E})?)*|\S/gu) || []
}

/**
 * Parses a YAML string into an EmojiConfig object
 */
export function parseConfig(yamlString: string): EmojiConfig | EmojiKeywords {
  try {
    const rawConfig = parse(yamlString)
    
    // Check if this is a keywords file (array of emoji: name pairs)
    if (Array.isArray(rawConfig)) {
      const keywords: EmojiKeywords = {}
      for (const item of rawConfig) {
        const [emoji, name] = Object.entries(item)[0]
        if (typeof emoji === 'string' && typeof name === 'string') {
          keywords[emoji] = name
        }
      }
      return keywords
    }
    
    // Otherwise, treat as emoji config
    const processedConfig: EmojiConfig = {}
    for (const [category, items] of Object.entries(rawConfig)) {
      processedConfig[category] = {}
      
      // Items is an array of objects
      for (const item of items as Array<Record<string, string>>) {
        // Each item is an object with a single key-value pair
        const [subcategory, emojis] = Object.entries(item)[0]
        if (typeof subcategory === 'string' && typeof emojis === 'string') {
          processedConfig[category][subcategory] = splitEmojis(emojis)
        }
      }
    }

    console.log('Processed config:', processedConfig)
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
    for (const [subcategory, emojis] of Object.entries(subcategories)) {
      for (const emoji of emojis) {
        if (enriched[emoji]) {
          enriched[emoji] = `${enriched[emoji]}, ${category}, ${subcategory}`
        }
      }
    }
  }
  
  return enriched
} 