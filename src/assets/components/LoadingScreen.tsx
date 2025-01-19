import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';
import alvanLogo from '../assets/alvan.png';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Create particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
      },
    }));
    setParticles(newParticles);

    // Start fade out after 2 seconds
    const timer = setTimeout(() => {
      setIsFading(true);
      // Complete loading after fade animation
      setTimeout(onLoadingComplete, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <div className={`loading-screen ${isFading ? 'fade-out' : ''}`}>
      <div className="loading-particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={particle.style}
          />
        ))}
      </div>
      <div className="loading-content">
        <img src={alvanLogo} alt="Alvan Logo" className="loading-logo" />
        <div className="loading-spinner" />
        <div className="loading-text">Initializing Alvan...</div>
      </div>
    </div>
  );
};

export default LoadingScreen; 