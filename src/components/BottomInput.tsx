import React, { useState } from 'react'
import './BottomInput.css'

interface BottomInputProps {
  onSendMessage: (message: string) => void
  onInputFocus: () => void  // Changed from onInputChange
}

const BottomInput: React.FC<BottomInputProps> = ({ onSendMessage, onInputFocus }) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  return (
    <div className="bottom-input-container">
      <form className="bottom-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={onInputFocus}  // Call onInputFocus when the input is focused
          placeholder="Ask Me Anything & Generate Image"
        />
        <button type="submit">
          <span className="send-icon">➤</span>
        </button>
      </form>
    </div>
  )
}

export default BottomInput
