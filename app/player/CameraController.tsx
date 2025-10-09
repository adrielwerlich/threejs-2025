import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { usePlayerInput } from './usePlayerInput'
import * as THREE from 'three'

interface CameraControllerProps {
  target: React.RefObject<THREE.Group>
  rigidBodyTarget: React.RefObject<any>
}

export interface CameraControllerRef {
  isFirstPerson: () => boolean
  getCameraRotation: () => number
}

export const CameraController = forwardRef<CameraControllerRef, CameraControllerProps>(
  ({ target, rigidBodyTarget }, ref) => {
    const { camera } = useThree()
    const controls = usePlayerInput()

    // Camera states
    const isFirstPerson = useRef(false)
    const previousCameraPressed = useRef(false)
    const cameraRotation = useRef({ x: 0, y: 0 })

    // Mouse movement for first-person camera
    const handleMouseMove = (event: MouseEvent) => {
      if (!isFirstPerson.current) return

      const sensitivity = 0.002
      cameraRotation.current.y -= event.movementX * sensitivity
      cameraRotation.current.x -= event.movementY * sensitivity

      // Clamp vertical rotation
      cameraRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.current.x))
    }

    useEffect(() => {
      document.addEventListener('mousemove', handleMouseMove)
      return () => document.removeEventListener('mousemove', handleMouseMove)
    }, [])

    // Third-person camera settings
    const cameraOffset = useRef(new THREE.Vector3(7, 10, 10)) // Behind and above player
    const cameraLookAtOffset = useRef(new THREE.Vector3(0, 2, 0)) // Look at player's head level

    // First-person camera settings  
    const firstPersonOffset = useRef(new THREE.Vector3(0, 1.5, 0)) // Eye level offset

    // Smooth camera movement
    const currentCameraPosition = useRef(new THREE.Vector3())
    const currentLookAtPosition = useRef(new THREE.Vector3())

    useEffect(() => {
      if (target.current) {
        // Initialize camera position
        if (!target.current.position) return;
        const playerPosition = target.current.position
        currentCameraPosition.current.copy(playerPosition).add(cameraOffset.current)
        currentLookAtPosition.current.copy(playerPosition).add(cameraLookAtOffset.current)

        camera.position.copy(currentCameraPosition.current)
        camera.lookAt(currentLookAtPosition.current)
      }
    }, [target, camera])

    useFrame((state, delta) => {
      if (!rigidBodyTarget.current || !target.current) return

      // Handle camera toggle (C key)
      if (controls.toggleCamera && !previousCameraPressed.current) {
        isFirstPerson.current = !isFirstPerson.current

        // Lock/unlock pointer for first-person
        if (isFirstPerson.current) {
          document.body.requestPointerLock()
        } else {
          document.exitPointerLock()
        }
      }
      previousCameraPressed.current = controls.toggleCamera

      // Get position from RigidBody (physics position)

      const physicsPos = rigidBodyTarget.current.translation()
      const playerPosition = new THREE.Vector3(physicsPos.x, physicsPos.y, physicsPos.z)

      // Get rotation from visual mesh
      const playerRotation = target.current.rotation


      let targetCameraPosition: THREE.Vector3
      let targetLookAtPosition: THREE.Vector3

      if (isFirstPerson.current) {
        targetCameraPosition = playerPosition.clone().add(firstPersonOffset.current)

        // Apply mouse rotation
        const lookDirection = new THREE.Vector3(0, 0, -1)
        lookDirection.applyEuler(new THREE.Euler(cameraRotation.current.x, cameraRotation.current.y, 0))
        targetLookAtPosition = targetCameraPosition.clone().add(lookDirection.multiplyScalar(10))

      } else {
        // Third-person camera
        targetCameraPosition = playerPosition.clone().add(cameraOffset.current)
        targetLookAtPosition = playerPosition.clone().add(cameraLookAtOffset.current)
      }

      // Smooth camera movement
      const lerpFactor = isFirstPerson.current ? 0.1 : 0.05

      currentCameraPosition.current.lerp(targetCameraPosition, lerpFactor)
      currentLookAtPosition.current.lerp(targetLookAtPosition, lerpFactor)

      camera.position.copy(currentCameraPosition.current)
      camera.lookAt(currentLookAtPosition.current)
    })

    const getCameraInfo = () => ({
      isFirstPerson: () => isFirstPerson.current,
      getCameraRotation: () => cameraRotation.current.y
    })

    useImperativeHandle(ref, () => ({
      isFirstPerson: () => isFirstPerson.current,
      getCameraRotation: () => cameraRotation.current.y
    }))

    return null
  });