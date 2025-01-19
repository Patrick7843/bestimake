import React from 'react'
import './About.css'
import { FaTimes } from 'react-icons/fa'

interface AboutProps {
  isOpen: boolean
  onClose: () => void
}

const About: React.FC<AboutProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="about-overlay">
      <div className="about-dialog">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>💎 Welcome to the Alvan Family! 💎</h2>
        <div className="about-content">
          <p>Hey, Private Family Member! 🎉</p>
          <p>If you're here, that means you've been invited to join the exclusive Alvan Family! Welcome aboard! 🌟</p>
          <p>You're now part of a journey to experience, create, and explore Alvan's AI world. 🧠💡</p>
          <h3>🎨 Let's Stay Creative! 🎨</h3>
          <p>The only limit is your imagination. Let's create magic together! 🌈✨</p>
          <h3>💌 Thank You 💌</h3>
          <p>🙏 From the bottom of our hearts, thank you for being part of the Alvan Family. We can't wait to see what you'll create!</p>
        </div>
      </div>
    </div>
  )
}

export default About
