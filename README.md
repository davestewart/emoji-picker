# Emoji Picker

A customizable emoji picker component for web applications.

## Features

- Support for hierarchical emoji categories
- Search functionality
- Keyboard navigation
- Customizable emoji sets

## Installation

```bash
npm install emoji-picker
```

## Usage

> [!WARNING]
> These docs are out of date

```javascript
import { EmojiPicker } from 'emoji-picker'

// Initialize with default emojis
const picker = new EmojiPicker({
  onSelect: (emoji) => console.log('Selected emoji:', emoji)
})

// Mount the picker to a DOM element
picker.mount(document.getElementById('emoji-container'))
```

## Development

This project uses a main package with a separate playground for testing and development.

### Setup

1. Clone the repository
2. Install dependencies for both the main package and playground:

```bash
npm run setup
```

### Development

Start the development server with:

```bash
npm run dev
```

This will:
1. Start the playground Vite dev server
2. Configure it to directly load source files from the main package
3. Enable hot module replacement for changes in both the playground and the main package

Vite will handle TypeScript compilation on-the-fly, and any changes to source files in the `src` directory will trigger hot reloading in the playground.

### Building

To build the package for production:

```bash
npm run build
```

## License

ISC 
