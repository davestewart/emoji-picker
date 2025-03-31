/**
 * Creates a filter function for emoji data structures
 * @param emojis The nested emoji data structure
 * @param keywords The flat map of emoji to keywords
 */
export function makeFilter (emojis: Record<string, any>, keywords: Record<string, string>) {
  // Process the emojis into a searchable structure
  const processedEmojis = processEmojiStructure(emojis, keywords)

  return function (value?: string) {
    if (!value) return processedEmojis
    return filterEmojiStructure(processedEmojis, value.toLowerCase())
  }
}

interface ProcessedEmoji {
  emoji: string
  keywords: string
}

function processEmojiStructure (
  emojis: Record<string, any>,
  keywords: Record<string, string>,
  parentKeys: string[] = [],
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(emojis)) {
    if (key.startsWith('_')) {
      continue
    }
    const currentPath = [...parentKeys, key]
    if (typeof value === 'string') {
      // Process leaf node
      const emojiList = value.split(' ').filter(Boolean)
      result[key] = emojiList.map(emoji => {
        const keywordString = keywords[emoji] || ''
        return {
          emoji,
          keywords: [keywordString, ...currentPath].join(',').toLowerCase(),
        }
      })
    }
    else {
      // Process branch node
      result[key] = processEmojiStructure(value, keywords, currentPath)
    }
  }

  return result
}

function filterEmojiStructure (
  emojis: Record<string, any>,
  filterValue: string,
): Record<string, any> | null {
  const result: Record<string, any> = {}
  let hasValidChildren = false

  for (const [key, value] of Object.entries(emojis)) {
    if (Array.isArray(value)) {
      // Leaf node
      const filteredEmojis = value.filter((item: ProcessedEmoji) =>
        item.keywords.includes(filterValue),
      )
      if (filteredEmojis.length > 0) {
        result[key] = filteredEmojis
        hasValidChildren = true
      }
    }
    else {
      // Branch node
      const filteredBranch = filterEmojiStructure(value, filterValue)
      if (filteredBranch) {
        result[key] = filteredBranch
        hasValidChildren = true
      }
    }
  }

  return hasValidChildren ? result : null
}
