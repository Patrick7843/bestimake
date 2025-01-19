import React, { useState } from 'react'
import './Sidebar.css'
import About from './About'
import { FaInfoCircle, FaInstagram, FaTwitter } from 'react-icons/fa'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const [isAboutOpen, setIsAboutOpen] = useState(false)

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h2>Alvan AI Rakib</h2>
        </div>
      </div>
      <button 
        className="about-button"
        onClick={() => setIsAboutOpen(true)}
      >
        <FaInfoCircle /> About You
      </button>
      <div className="sidebar-footer">
        <a href="https://x.com/alvanalrakib" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
        <a href="https://www.instagram.com/Alvanalrakib/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
      </div>
      <button 
        className="sidebar-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        <span className="toggle-icon"></span>
      </button>
      <About isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </aside>
  )
}

export default Sidebar
