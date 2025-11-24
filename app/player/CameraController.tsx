import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { usePlayerInput } from './usePlayerInput'
import { useAppSelector } from '../store/hooks'
import { useDebugPanel } from '../debug/debugPanelHook'
import * as THREE from 'three'

interface CameraControllerProps {
  target: React.RefObject<THREE.Group>
  rigidBodyTarget: React.RefObject<any>
  debug?: boolean
}

export interface CameraControllerRef {
  isFirstPerson: () => boolean
  getCameraRotation: () => number
  updatePlayerCamera: (playerPosition: THREE.Vector3, playerRotation: number) => void
  updateCarCamera: (carPosition: THREE.Vector3, carRotation: number) => void
  resetCamera: () => void
}

const isRigidBodyReady = (rigidBody: any): boolean => {
  if (!rigidBody) return false
  
  // Check if handle exists and is valid (not 0 or null)
  const handle = rigidBody.handle
  if (handle === undefined || handle === null || handle === 0) {
    return false
  }
  
  // Verify translation method exists
  if (typeof rigidBody.translation !== 'function') {
    return false
  }
  
  return true
}

export const CameraController = forwardRef<CameraControllerRef, CameraControllerProps>(
  ({ target, rigidBodyTarget, debug = false }, ref) => {
    const { camera } = useThree()
    const controls = usePlayerInput()
    const carState = useAppSelector((state) => state.car)

    // Camera states
    const isFirstPerson = useRef(false)
    const previousCameraPressed = useRef(false)
    const cameraRotation = useRef({ x: 0, y: 0 })

    const debugParams = useRef({
      carCameraOffset: new THREE.Vector3(0, 3, -8),
      carLookAtOffset: new THREE.Vector3(0, 1, 2),
      playerCameraOffset: new THREE.Vector3(7, 10, 10),
      playerLookAtOffset: new THREE.Vector3(0, 2, 0),
      lerpFactor: 0.05
    })

    if (debug) {
      useDebugPanel(debugParams.current)
    }

    // Camera settings
    const cameraOffset = useRef(new THREE.Vector3(7, 10, 10))
    const cameraLookAtOffset = useRef(new THREE.Vector3(0, 2, 0))
    const firstPersonOffset = useRef(new THREE.Vector3(0, 1.5, 0))

    // const cameraOffset = useRef(new THREE.Vector3(18, 18, -70))
    // const cameraLookAtOffset = useRef(new THREE.Vector3(15, -1, 2))

    const carCameraOffset = useRef(new THREE.Vector3(18, 18, -70))
    const carLookAtOffset = useRef(new THREE.Vector3(15, -1, 2))

    const currentCameraPosition = useRef(new THREE.Vector3())
    const currentLookAtPosition = useRef(new THREE.Vector3())

    useEffect(() => {
      if (debug) {
        cameraOffset.current.copy(debugParams.current.playerCameraOffset)
        cameraLookAtOffset.current.copy(debugParams.current.playerLookAtOffset)
        carCameraOffset.current.copy(debugParams.current.carCameraOffset)
        carLookAtOffset.current.copy(debugParams.current.carLookAtOffset)
      }
    }, [debug])

    useEffect(() => {
      const handleMouseMove = (event: MouseEvent) => {
        if (!isFirstPerson.current || carState.isDriving) return

        const sensitivity = 0.002
        cameraRotation.current.y -= event.movementX * sensitivity
        cameraRotation.current.x -= event.movementY * sensitivity

        // Clamp vertical rotation
        cameraRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.current.x))
      }

      document.addEventListener('mousemove', handleMouseMove)
      return () => document.removeEventListener('mousemove', handleMouseMove)
    }, [carState.isDriving])

    useFrame(() => {

       if (!isRigidBodyReady(rigidBodyTarget?.current)) {
        return
      }

      if (debug) {
        cameraOffset.current.copy(debugParams.current.playerCameraOffset)
        cameraLookAtOffset.current.copy(debugParams.current.playerLookAtOffset)
        carCameraOffset.current.copy(debugParams.current.carCameraOffset)
        carLookAtOffset.current.copy(debugParams.current.carLookAtOffset)
      }

      if (carState.isDriving) {
        updateCarCamera()
      } else if (rigidBodyTarget.current && target.current) {
        updatePlayerCamera()
      }
    })

    const updateCarCamera = () => {
      const carPosition = new THREE.Vector3(...carState.position)
      const carRotation = new THREE.Euler(...carState.rotation)

      // Force third-person view when driving
      if (isFirstPerson.current) {
        isFirstPerson.current = false
        document.exitPointerLock()
      }

      // Disable camera toggle while driving
      // Camera toggle is not available in car mode

      // Always use third-person car view
      const offset = carCameraOffset.current.clone()
      offset.applyEuler(carRotation)
      const targetCameraPosition = carPosition.clone().add(offset)

      const lookAtOffset = carLookAtOffset.current.clone()
      lookAtOffset.applyEuler(carRotation)
      const targetLookAtPosition = carPosition.clone().add(lookAtOffset)

      const lerpFactor = 0.05
      currentCameraPosition.current.lerp(targetCameraPosition, lerpFactor)
      currentLookAtPosition.current.lerp(targetLookAtPosition, lerpFactor)

      camera.position.copy(currentCameraPosition.current)
      camera.lookAt(currentLookAtPosition.current)
    }

    const updatePlayerCamera = () => {
      // Handle camera toggle (C key)
      if (controls.toggleCamera && !previousCameraPressed.current) {
        isFirstPerson.current = !isFirstPerson.current

        if (isFirstPerson.current) {
          document.body.requestPointerLock()
        } else {
          document.exitPointerLock()
        }
      }
      previousCameraPressed.current = controls.toggleCamera

      if (!rigidBodyTarget?.current) {
        console.warn('⚠️ rigidBodyTarget is null, skipping camera update')
        return
      }

      try {
        // ✅ Check if translation method exists
        if (typeof rigidBodyTarget?.current?.translation !== 'function') return;

        const translation = rigidBodyTarget.current.translation?.()

        if (!translation) {
          console.warn('⚠️ translation() returned null')
          return
        }

        const playerPosition = new THREE.Vector3(translation.x, translation.y, translation.z)

        let targetCameraPosition: THREE.Vector3
        let targetLookAtPosition: THREE.Vector3

        if (isFirstPerson.current) {
          targetCameraPosition = playerPosition.clone().add(firstPersonOffset.current)
          const lookDirection = new THREE.Vector3(0, 0, -1)
          lookDirection.applyEuler(new THREE.Euler(cameraRotation.current.x, cameraRotation.current.y, 0))
          targetLookAtPosition = targetCameraPosition.clone().add(lookDirection.multiplyScalar(10))
        } else {
          targetCameraPosition = playerPosition.clone().add(cameraOffset.current)
          targetLookAtPosition = playerPosition.clone().add(cameraLookAtOffset.current)
        }

        const lerpFactor = isFirstPerson.current ? 0.1 : 0.05
        currentCameraPosition.current.lerp(targetCameraPosition, lerpFactor)
        currentLookAtPosition.current.lerp(targetLookAtPosition, lerpFactor)

        camera.position.copy(currentCameraPosition.current)
        camera.lookAt(currentLookAtPosition.current)
      } catch (error) {
        // ✅ Catch any Rapier/Rust errors silently
        console.error('❌ Error in updatePlayerCamera:', error)
      }
    }

    useImperativeHandle(ref, () => ({
      isFirstPerson: () => isFirstPerson.current,
      getCameraRotation: () => cameraRotation.current.y,
      updatePlayerCamera: (playerPosition: THREE.Vector3, playerRotation: number) => {
        // Manually update camera for external calls
        const targetCameraPosition = playerPosition.clone().add(cameraOffset.current)
        const targetLookAtPosition = playerPosition.clone().add(cameraLookAtOffset.current)

        currentCameraPosition.current.lerp(targetCameraPosition, 0.1)
        currentLookAtPosition.current.lerp(targetLookAtPosition, 0.1)

        camera.position.copy(currentCameraPosition.current)
        camera.lookAt(currentLookAtPosition.current)
      },
      updateCarCamera: (carPosition: THREE.Vector3, carRotation: number) => {
        // Manually update camera for external calls
        const carEuler = new THREE.Euler(0, carRotation, 0)
        const offset = carCameraOffset.current.clone()
        offset.applyEuler(carEuler)
        const targetCameraPosition = carPosition.clone().add(offset)

        currentCameraPosition.current.lerp(targetCameraPosition, 0.05)
        currentLookAtPosition.current.lerp(carPosition, 0.1)

        camera.position.copy(currentCameraPosition.current)
        camera.lookAt(currentLookAtPosition.current)
      },
      resetCamera: () => {
        camera.position.set(15, 4, 15)
        camera.lookAt(0, 0, 0)
      }
    }))

    return null
  }
)