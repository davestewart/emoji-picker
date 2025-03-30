import type { EmojiConfig, EmojiKeywords, EmojiData } from './types'

/**
 * Split string into emojis, keeping composite emojis together
 */
export function splitEmojis(str: string): string[] {
  console.log('Splitting emoji string:', str)
  
  // Regex for emoji matching - catches emoji sequences, including skin tone modifiers, 
  // ZWJ sequences, and variation selectors
  const emojiRegex = /\p{Emoji}(\p{Emoji_Modifier}|\u200D\p{Emoji})*|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu
  
  // Extract all emoji matches
  const emojis = Array.from(str.matchAll(emojiRegex), m => m[0])
  
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
 * Checks if a value is a leaf node (emoji string)
 */
function isEmojiString(value: unknown): value is string {
  return typeof value === 'string'
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
      for (const [category, value] of Object.entries(config)) {
        if (isEmojiString(value)) {
          // Create an object with a default property containing the string
          processedConfig[category] = { default: value }
        } else if (typeof value === 'object' && value !== null) {
          processedConfig[category] = parseConfigData(value)
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
 * Recursively parses emoji data objects
 */
function parseConfigData(data: unknown): EmojiData {
  const result: EmojiData = {}
  
  if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      if (isEmojiString(value)) {
        result[key] = processConfigValue(value)
      } else if (typeof value === 'object' && value !== null) {
        result[key] = parseConfigData(value)
      }
    }
  }
  
  return result
}

/**
 * Collects all emojis from a nested config structure
 */
function collectEmojis(data: EmojiData, path: string[] = []): Array<{emoji: string, path: string[]}> {
  let results: Array<{emoji: string, path: string[]}> = []
  
  for (const [key, value] of Object.entries(data)) {
    const currentPath = [...path, key]
    
    if (typeof value === 'string') {
      // This is a leaf node with emojis
      const emojis = splitEmojis(value)
      for (const emoji of emojis) {
        results.push({ emoji, path: currentPath })
      }
    } else {
      // This is a nested category
      results = results.concat(collectEmojis(value, currentPath))
    }
  }
  
  return results
}

/**
 * Enriches keywords with category path information
 */
export function enrichKeywords(keywords: EmojiKeywords, config: EmojiConfig): EmojiKeywords {
  const enriched: EmojiKeywords = { ...keywords }
  
  for (const [category, data] of Object.entries(config)) {
    const emojiEntries = collectEmojis(data, [category])
    
    for (const { emoji, path } of emojiEntries) {
      if (enriched[emoji]) {
        enriched[emoji] = `${enriched[emoji]}, ${path.join(', ')}`
      }
    }
  }
  
  return enriched
} 