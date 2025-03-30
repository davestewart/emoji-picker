export interface EmojiData {
  [key: string]: EmojiData | string
}

export interface EmojiConfig {
  [category: string]: EmojiData
}

export interface EmojiKeywords {
  [emoji: string]: string
}

export interface EmojiPickerOptions {
  emojis?: EmojiConfig
  keywords?: EmojiKeywords
  onSelect?: (emoji: string) => void
}
