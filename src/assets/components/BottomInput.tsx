import React, { useState, useRef, useEffect } from 'react'
import './BottomInput.css'

interface Command {
  name: string
  description: string
  prefix: string[]
}

const COMMANDS: Command[] = [
  {
    name: 'Image Generation (Stable Diffusion)',
    description: 'Generate an image using Stable Diffusion',
    prefix: ['/image', '/img']
  },
  {
    name: 'Image Generation (Ideogram)',
    description: 'Generate an image using Ideogram AI',
    prefix: ['/imagine', '/i']
  }
]

interface BottomInputProps {
  onSendMessage: (message: string, command?: string) => void
  onInputFocus: () => void
}

const BottomInput: React.FC<BottomInputProps> = ({ onSendMessage, onInputFocus }) => {
  const [input, setInput] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([])
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (input.startsWith('/')) {
      const searchTerm = input.toLowerCase()
      const filtered = COMMANDS.filter(cmd => 
        cmd.prefix.some(p => p.toLowerCase().startsWith(searchTerm))
      )
      setFilteredCommands(filtered)
      setShowCommands(filtered.length > 0)
      setSelectedCommandIndex(0)
    } else {
      setShowCommands(false)
    }
  }, [input])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      // Check if the input starts with any command prefix
      const command = COMMANDS.find(cmd => 
        cmd.prefix.some(prefix => input.toLowerCase().startsWith(prefix.toLowerCase()))
      )

      if (command) {
        // Remove the command prefix and trim
        const messageContent = input
          .slice(input.indexOf(' ') + 1)
          .trim()
        
        if (messageContent) {
          // Send with the first prefix as the command identifier
          onSendMessage(messageContent, command.prefix[0])
          setInput('')
          setShowCommands(false)
        }
      } else {
        // Regular message
        onSendMessage(input)
        setInput('')
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedCommandIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedCommandIndex(prev => prev > 0 ? prev - 1 : prev)
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedCommandIndex]) {
          setInput(filteredCommands[selectedCommandIndex].prefix[0] + ' ')
          setShowCommands(false)
          inputRef.current?.focus()
        }
      }
    }
  }

  return (
    <div className="bottom-input-container">
      <form className="bottom-input" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={onInputFocus}
          placeholder="Type / for commands or just ask me anything"
        />
        <button type="submit">
          <span className="send-icon">➤</span>
        </button>
      </form>
      {showCommands && (
        <div className="command-suggestions">
          {filteredCommands.map((cmd, index) => (
            <div
              key={cmd.prefix[0]}
              className={`command-item ${index === selectedCommandIndex ? 'selected' : ''}`}
              onClick={() => {
                setInput(cmd.prefix[0] + ' ')
                setShowCommands(false)
                inputRef.current?.focus()
              }}
            >
              <div className="command-name">{cmd.name}</div>
              <div className="command-description">{cmd.description}</div>
              <div className="command-prefix">{cmd.prefix.join(' or ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BottomInput
