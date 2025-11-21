import { useEffect, useRef } from 'react'
import { GUI } from 'lil-gui'
import * as THREE from 'three'

interface CameraDebugParams {
  carCameraOffset: THREE.Vector3
  carLookAtOffset: THREE.Vector3
  lerpFactor: number
  playerCameraOffset: THREE.Vector3
  playerLookAtOffset: THREE.Vector3
}

export const useDebugPanel = (params: CameraDebugParams) => {
  const guiRef = useRef<GUI | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Create GUI
    guiRef.current = new GUI({ title: 'Camera Debug' })
    
    // Car Camera Settings
    const carFolder = guiRef.current.addFolder('Car Camera')
    
    // Car Camera Offset
    const carOffsetFolder = carFolder.addFolder('Camera Offset')
    carOffsetFolder.add(params.carCameraOffset, 'x', -50, 50, 0.1)
    carOffsetFolder.add(params.carCameraOffset, 'y', -50, 50, 0.1)
    carOffsetFolder.add(params.carCameraOffset, 'z', -150, 50, 0.1)
    
    // Car Look At Offset
    const carLookAtFolder = carFolder.addFolder('Look At Offset')
    carLookAtFolder.add(params.carLookAtOffset, 'x', -50, 50, 0.1)
    carLookAtFolder.add(params.carLookAtOffset, 'y', -50, 50, 0.1)
    carLookAtFolder.add(params.carLookAtOffset, 'z', -50, 50, 0.1)
    
    // Player Camera Settings
    const playerFolder = guiRef.current.addFolder('Player Camera')
    
    // Player Camera Offset
    const playerOffsetFolder = playerFolder.addFolder('Camera Offset')
    playerOffsetFolder.add(params.playerCameraOffset, 'x', -20, 20, 0.1)
    playerOffsetFolder.add(params.playerCameraOffset, 'y', -20, 20, 0.1)
    playerOffsetFolder.add(params.playerCameraOffset, 'z', -20, 20, 0.1)
    
    // Player Look At Offset
    const playerLookAtFolder = playerFolder.addFolder('Look At Offset')
    playerLookAtFolder.add(params.playerLookAtOffset, 'x', -10, 10, 0.1)
    playerLookAtFolder.add(params.playerLookAtOffset, 'y', -10, 10, 0.1)
    playerLookAtFolder.add(params.playerLookAtOffset, 'z', -10, 10, 0.1)
    
    // General Settings
    guiRef.current.add(params, 'lerpFactor', 0.01, 0.5, 0.01).name('Lerp Factor')
    
    // Export/Import buttons
    guiRef.current.add({
      exportSettings: () => {
        const settings = {
          carCameraOffset: params.carCameraOffset.toArray(),
          carLookAtOffset: params.carLookAtOffset.toArray(),
          playerCameraOffset: params.playerCameraOffset.toArray(),
          playerLookAtOffset: params.playerLookAtOffset.toArray(),
          lerpFactor: params.lerpFactor
        }
        console.log('Camera Settings:', JSON.stringify(settings, null, 2))
        navigator.clipboard?.writeText(JSON.stringify(settings, null, 2))
      }
    }, 'exportSettings').name('Export Settings')

    return () => {
      guiRef.current?.destroy()
    }
  }, [params])

  return guiRef.current
}