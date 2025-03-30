export interface EmojiConfig {
  [category: string]: {
    [subcategory: string]: {
      [emoji: string]: string
    } | string
  }
}

export interface EmojiKeywords {
  [emoji: string]: string
}

export interface EmojiPickerOptions {
  emojis?: EmojiConfig
  keywords?: EmojiKeywords
  onSelect?: (emoji: string) => void
}
