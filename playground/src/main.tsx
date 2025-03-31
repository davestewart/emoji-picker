import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { makeView } from '../../src'

function App () {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<ReturnType<typeof makeView> | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const showPopover = (show: boolean, text = '') => {
    setIsOpen(show)
    if (show && pickerRef.current) {
      pickerRef.current.show(text)
    }
  }

  function getPreviousWord () {
    if (!editorRef.current) return
    const editor = editorRef.current
    const cursorPosition = editor.selectionStart
    const text = editor.value
    const lineStart = text.lastIndexOf('\n', cursorPosition - 1)
    const lineEnd = text.indexOf('\n', cursorPosition)
    const line = text.substring(lineStart + 1, lineEnd !== -1 ? lineEnd : text.length)
    const words = line.trim().split(' ')
    const wordIndex = words.findIndex((_, index) => {
      const wordStart = line.indexOf(words[index])
      return wordStart <= cursorPosition - (lineStart + 1) && cursorPosition - (lineStart + 1) <= wordStart + words[index].length
    })
    const previousWord = wordIndex !== -1 ? words[wordIndex] : ''
    return previousWord
  }

  function insertEmoji (emoji: string) {
    if (!editorRef.current) return
    const editor = editorRef.current

    const start = editor.selectionStart
    const end = editor.selectionEnd
    const text = editor.value
    
    if (start > 0 && text[start - 1].match(/[a-zA-Z]/)) {
      editor.value = text.substring(0, start) + ' ' + emoji + text.substring(end)
    } else {
      editor.value = text.substring(0, start) + emoji + text.substring(end)
    }

    // Update cursor position
    const newPosition = start + emoji.length
    editor.selectionStart = newPosition
    editor.selectionEnd = newPosition
  }

  useEffect(() => {
    if (!editorRef.current || !containerRef.current) {
      console.error('Editor or container ref not found')
      return
    }

    const editor = editorRef.current
    const container = containerRef.current

    const onSelect = (emoji: string, multiSelect: boolean) => {
      if (!editor) return

      insertEmoji(emoji)

      // Focus editor unless multiSelect is true
      if (!multiSelect) {
        editor.focus()
        showPopover(false)
      }
    }

    // Initialize emoji picker
    pickerRef.current = makeView({
      container,
      onSelect,
    })

    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        showPopover(true, getPreviousWord())
      }
    }

    editor.addEventListener('keydown', handleKeyDown)

    // Handle click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (
        container &&
        !container.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        showPopover(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      editor.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
      if (pickerRef.current) {
        pickerRef.current.destroy()
      }
    }
  }, [])

  // Handle button click
  const handleButtonClick = () => {
    showPopover(!isOpen)
  }

  return (
    <div className="App">
      <div className="editor-container">
        <div className="editor-toolbar">
          <button 
            ref={buttonRef} 
            className="picker-button"
            onClick={handleButtonClick}
          >
            🙂
          </button>
        </div>
        <textarea
          ref={editorRef}
          placeholder="Type something... (Cmd/Ctrl+E to open picker)"
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '1rem',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        />
      </div>

      <div 
        className="picker-container"
        style={{
          display: isOpen ? 'block' : 'none',
          position: 'absolute',
          top: buttonRef.current ? `${buttonRef.current.offsetTop + buttonRef.current.offsetHeight + 5}px` : 0,
          left: buttonRef.current ? `${buttonRef.current.offsetLeft}px` : 0,
          zIndex: 1000,
        }}
      >
        <div
          ref={containerRef}
          style={{
            maxHeight: '400px',
            border: '1px solid #eee',
            borderRadius: '4px',
            padding: '1rem',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
      </div>
    </div>
  )
}

// Add some basic styles
const style = document.createElement('style')
style.textContent = `
  .App {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 1rem;
    position: relative;
  }
  .editor-container {
    position: relative;
    margin-bottom: 1rem;
  }
  .editor-toolbar {
    margin-bottom: 0.5rem;
  }
  .picker-button {
    padding: 0.5rem;
    font-size: 1.2rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    cursor: pointer;
  }
  .picker-button:hover {
    background: #f5f5f5;
  }
  .picker-container {
    margin-top: 1rem;
  }
`
document.head.appendChild(style)

// Mount the app
const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')
const root = createRoot(container)
root.render(<App />)
