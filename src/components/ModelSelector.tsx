import React, { useState, useRef, useEffect } from 'react'
import './ModelSelector.css'

const models = [
  { name: 'Alvan-TEXT', description: 'For text-based conversations and queries' },
  { name: 'Alvan-IMAGE', description: 'For image generation tasks' },
  { name: 'Alvan-IDEOGRAM', description: 'For high-quality image generation using Ideogram AI' },
  { name: 'AlvanLocal', description: 'Local model for faster processing' }
]

interface ModelSelectorProps {
  onModelChange: (model: string) => void;
  isSidebarOpen: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange, isSidebarOpen }) => {
  const [selectedModel, setSelectedModel] = useState(models[0].name)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName)
    onModelChange(modelName)
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`model-selector-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} ref={dropdownRef}>
      <div className="model-selector" onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedModel}</span>
        <span className="dropdown-arrow">▼</span>
      </div>
      {isOpen && (
        <div className="model-dropdown">
          {models.map((model) => (
            <div
              key={model.name}
              className={`model-option ${selectedModel === model.name ? 'selected' : ''}`}
              onClick={() => handleModelChange(model.name)}
            >
              <span className="model-name">{model.name}</span>
              <span className="model-description">{model.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ModelSelector
