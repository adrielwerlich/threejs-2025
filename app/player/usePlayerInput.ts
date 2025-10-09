import { useState, useEffect } from 'react'
import type { PlayerControls } from './types'

export function usePlayerInput() {
  const [controls, setControls] = useState<PlayerControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    toggleCamera: false,
    toggleDebug: false
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          setControls(prev => ({ ...prev, forward: true }))
          break
        case 'KeyS':
        case 'ArrowDown':
          setControls(prev => ({ ...prev, backward: true }))
          break
        case 'KeyA':
        case 'ArrowLeft':
          setControls(prev => ({ ...prev, left: true }))
          break
        case 'KeyD':
        case 'ArrowRight':
          setControls(prev => ({ ...prev, right: true }))
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          setControls(prev => ({ ...prev, run: true }))
          break
        case 'KeyC':
          setControls(prev => ({ ...prev, toggleCamera: true }))
          break
        case 'KeyX':
          setControls(prev => ({ ...prev, toggleDebug: true }))
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          setControls(prev => ({ ...prev, forward: false }))
          break
        case 'KeyS':
        case 'ArrowDown':
          setControls(prev => ({ ...prev, backward: false }))
          break
        case 'KeyA':
        case 'ArrowLeft':
          setControls(prev => ({ ...prev, left: false }))
          break
        case 'KeyD':
        case 'ArrowRight':
          setControls(prev => ({ ...prev, right: false }))
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          setControls(prev => ({ ...prev, run: false }))
          break
        case 'KeyC':
          setControls(prev => ({ ...prev, toggleCamera: false }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return controls
}