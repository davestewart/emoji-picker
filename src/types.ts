export interface EmojiCategory {
  [subcategory: string]: string[]
}

export interface EmojiConfig {
  [category: string]: EmojiCategory
}

export interface EmojiPickerOptions {
  config?: string | EmojiConfig
  onSelect?: (emoji: string, options: { keepFocus: boolean }) => void
  editor?: HTMLTextAreaElement | HTMLInputElement
} 