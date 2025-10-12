import React from 'react'
import './LoadingScreen.css' // We'll create this CSS file

interface LoadingScreenProps {
  progress?: number
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress = 0 }) => {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        <h1 className="loading-title">React Three Fiber App</h1>
        <p className="loading-subtitle">Loading 3D Experience...</p>

        <div className="loading-bar-container">
          <div
            className="loading-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="loading-percentage">{Math.round(progress)}%</p>

        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>

        <div className="loading-tips">
          <p>💡 Use arrow keys to move around</p>
          <p>🎥 Press C to toggle camera perspective (First person vs Third Person)</p>
          <p>🚪 Press E to interact with doors</p>
          <p>🎮 Press P to toggle orbit controls or third person perspective</p>
          <p>🔧 Press X to toggle physics debug mode</p>
        </div>
      </div>
    </div>
  )
}