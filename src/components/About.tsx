import React, { useEffect, useState } from 'react'
import './About.css'

interface AboutProps {
  isOpen: boolean
  onClose: () => void
}

const About: React.FC<AboutProps> = ({ isOpen, onClose }) => {
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([])

  useEffect(() => {
    if (isOpen) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          transform: `scale(${Math.random() * 1.5 + 0.5})`,
          opacity: Math.random() * 0.3 + 0.1,
          animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 2}s`,
        },
      }))
      setParticles(newParticles)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-dialog" onClick={e => e.stopPropagation()}>
        <div className="about-particles">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="about-particle"
              style={particle.style}
            />
          ))}
        </div>
        <button className="close-about" onClick={onClose} aria-label="Close dialog" />
        <div className="about-content">
          <h2>💎 Welcome to the Alvan Family! 💎</h2>
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
