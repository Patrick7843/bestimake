import React, { useState, useRef } from 'react'
import './MainLayout.css'
import Sidebar from '../components/Sidebar'
import MainWindow, { MainWindowRef } from '../components/MainWindow'
import BottomInput from '../components/BottomInput'
import ModelSelector from '../components/ModelSelector'

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState('Alvan-TEXT')
  const mainWindowRef = useRef<MainWindowRef>(null)

  const handleSendMessage = (message: string) => {
    mainWindowRef.current?.generateResponse(message, selectedModel)
  }

  const handleInputFocus = () => {
    mainWindowRef.current?.hideLogo()
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
  }

  return (
    <div className={`main-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="main-content">
        <ModelSelector onModelChange={handleModelChange} isSidebarOpen={isSidebarOpen} />

        <MainWindow ref={mainWindowRef as React.Ref<MainWindowRef>} />
        <BottomInput onSendMessage={handleSendMessage} onInputFocus={handleInputFocus} />
      </main>
    </div>
  )

}
export default MainLayout
