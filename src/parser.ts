import { parse } from 'yaml'
import type { EmojiConfig } from './types'

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
export function parseConfig(yamlString: string): EmojiConfig {
  try {
    const rawConfig = parse(yamlString)
    const processedConfig: EmojiConfig = {}

    // Transform the array structure into object structure
    for (const [category, items] of Object.entries(rawConfig)) {
      processedConfig[category] = {}
      
      // Items is an array of objects
      for (const item of items as Array<Record<string, string>>) {
        // Each item is an object with a single key-value pair
        const [subcategory, emojis] = Object.entries(item)[0]
        processedConfig[category][subcategory] = splitEmojis(emojis)
      }
    }

    console.log('Processed config:', processedConfig)
    return processedConfig
  } catch (error) {
    console.error('Failed to parse emoji config:', error)
    throw new Error('Invalid emoji configuration format')
  }
} 