import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect, useState } from 'react'
import type { PlayerControls, PlayerState, AnimationType } from './types'
import * as THREE from 'three'
import { type CameraControllerRef } from './CameraController'

export function usePlayerMovement(
  controls: PlayerControls,
  initialPosition: [number, number, number] = [0, -4.95, 0],
  rigidBodyRef?: React.RefObject<any>,
  cameraController?: React.RefObject<CameraControllerRef>,
) {
  const playerRef = useRef<THREE.Group>(null)
  const velocityRef = useRef(new THREE.Vector3())
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>('idle')
  const rotationSpeed = 3

  const { camera } = useThree()

  const state = useRef<PlayerState>({
    position: initialPosition,
    rotation: [0, 0, 0],
    isMoving: false,
    currentAnimation: 'idle',
    speed: 2
  })

  useEffect(() => {
    if (rigidBodyRef?.current) {
      rigidBodyRef.current.setTranslation({ x: initialPosition[0], y: initialPosition[1], z: initialPosition[2] }, true)
    }
  }, [])

  useFrame((r3fState, delta) => {
    if (!playerRef.current || !rigidBodyRef?.current) return

    const { forward, backward, left, right, run } = controls
    const speed = run ? 4 : 2

    // Calculate movement direction
    let direction = new THREE.Vector3()


    const isFirstPersonMode = cameraController?.current?.isFirstPerson() || false

    if (isFirstPersonMode) {
      const camera = r3fState.camera

      if (forward || backward || left || right) {
        // Get camera's forward direction (flattened to XZ plane)
        const cameraForward = new THREE.Vector3()
        camera.getWorldDirection(cameraForward)
        cameraForward.y = 0
        cameraForward.normalize()

        // Get camera's right direction
        const cameraRight = new THREE.Vector3()
        cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0))

        // Apply movement based on camera orientation
        if (forward) direction.add(cameraForward)
        if (backward) direction.sub(cameraForward)
        if (left) direction.sub(cameraRight)
        if (right) direction.add(cameraRight)
      }
    } else {
      if (forward) direction.z -= 1
      if (backward) direction.z += 1
      if (left) direction.x -= 1
      if (right) direction.x += 1
    }

    direction.normalize()
    const isMoving = direction.length() > 0

    if (isMoving) {

      direction.normalize()

      // Get current position
      const currentPos = rigidBodyRef.current.translation()

      // Calculate new position
      const newPosition = {
        x: currentPos.x + direction.x * speed * delta,
        y: currentPos.y, // Keep Y position (no gravity with kinematic)
        z: currentPos.z + direction.z * speed * delta
      }


      // Set new position (kinematic bodies move by setting position)
      rigidBodyRef.current.setTranslation(newPosition, true)

      // Only update player rotation in third-person mode
      if (!isFirstPersonMode) {
        const angle = Math.atan2(direction.x, direction.z)
        playerRef.current.rotation.y = angle
      }

    }
    // Update animation based on current controls
    let newAnimation: AnimationType = 'idle'
    if (!isMoving) {
      newAnimation = 'idle'
    } else if (run) {
      newAnimation = 'running'
    } else {
      newAnimation = 'walking'
    }

    if (newAnimation !== currentAnimation) {
      setCurrentAnimation(newAnimation)
      state.current.currentAnimation = newAnimation
    }

  })

  return {
    playerRef,
    playerState: state.current,
    currentAnimation
  }
}
