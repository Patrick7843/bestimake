import React, { useState, useRef, useEffect } from 'react';
import './ModelSelector.css';
import { apiService, useModels } from '../services/api';

interface ModelSelectorProps {
  onModelChange: (model: string) => void;
  isSidebarOpen: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange, isSidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showConfigInput, setShowConfigInput] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { models, loading, error, loadModels } = useModels();

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    apiService.setConfig(baseURL, apiKey);
    setShowConfigInput(false);
    await loadModels();
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    onModelChange(modelId);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
      onModelChange(models[0].id);
    }
  }, [models, selectedModel, onModelChange]);

  return (
    <div className={`model-selector-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {showConfigInput ? (
        <form onSubmit={handleConfigSubmit} className="api-config-form">
          <div className="input-group">
            <input
              type="url"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder="Enter API Base URL"
              required
              className="config-input"
            />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API Key"
              required
              className="config-input"
            />
          </div>
          <div className="button-group">
            <button type="submit" className="config-submit">Connect</button>
            <button 
              type="button" 
              className="config-cancel"
              onClick={() => setShowConfigInput(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="model-selector" onClick={() => setIsOpen(true)}>
            <span>{selectedModel || 'Select Model'}</span>
            <button 
              className="configure-api" 
              onClick={(e) => {
                e.stopPropagation();
                setShowConfigInput(true);
              }}
            >
              ⚙️
            </button>
            <span className="dropdown-arrow">▼</span>
          </div>
          {isOpen && (
            <div className="model-modal-overlay">
              <div className="model-modal" ref={modalRef}>
                <div className="model-modal-header">
                  <span className="model-modal-title">Select a Model</span>
                  <button 
                    className="model-modal-close"
                    onClick={() => setIsOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="model-modal-content">
                  {loading && <div className="model-option">Loading models...</div>}
                  {error && <div className="model-option error">Error: {error}</div>}
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
                      onClick={() => handleModelChange(model.id)}
                    >
                      <span className="model-name">{model.id}</span>
                      <span className="model-description">Owned by: {model.owned_by}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModelSelector;