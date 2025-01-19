import React, { useState, useRef } from 'react'
import './MainLayout.css'
import Sidebar from '../components/Sidebar'
import MainWindow, { MainWindowRef } from '../components/MainWindow'
import BottomInput from '../components/BottomInput'
import ModelSelector from '../components/ModelSelector'
import LoadingScreen from '../components/LoadingScreen'

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState('Alvan-TEXT')
  const [isLoading, setIsLoading] = useState(true)
  const mainWindowRef = useRef<MainWindowRef>(null)

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  const handleSendMessage = (message: string, command?: string) => {
    if (command) {
      // If it's a command, pass it directly to MainWindow
      mainWindowRef.current?.generateResponse(message, command)
    } else {
      // If it's a regular message, pass the selected model
      mainWindowRef.current?.generateResponse(message)
    }
  }

  const handleInputFocus = () => {
    mainWindowRef.current?.hideLogo()
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
  }

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}
      <div className={`main-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="main-content">
          <ModelSelector onModelChange={handleModelChange} isSidebarOpen={isSidebarOpen} />
          <MainWindow ref={mainWindowRef} model={selectedModel} />
          <BottomInput onSendMessage={handleSendMessage} onInputFocus={handleInputFocus} />
        </main>
      </div>
    </>
  )
}

export default MainLayout
