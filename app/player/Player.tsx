import React, { useRef, useEffect, forwardRef } from 'react'
import { useFBX, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { usePlayerInput } from './usePlayerInput'
import { usePlayerMovement } from './usePlayerMovement'
import { type CameraControllerRef } from './CameraController'

interface PlayerProps {
  position?: [number, number, number]
  scale?: number
  rigidBodyRef?: React.RefObject<any>
  cameraController?: React.RefObject<CameraControllerRef>
}

export const Player = forwardRef<THREE.Group, PlayerProps>(
  ({ position = [5, -4.95, 5], scale = 0.01, rigidBodyRef, cameraController }, ref) => {

    const internalRigidBodyRef = useRef<any>(null)
    const actualRigidBodyRef = rigidBodyRef || internalRigidBodyRef

    const idleAnimationGroup = useRef<THREE.Group>(null)
    const walkingAnimationGroup = useRef<THREE.Group>(null)
    const runningAnimationGroup = useRef<THREE.Group>(null)

    // Load all FBX files
    const idleFBX = useFBX('/models/player/idle.fbx')
    const walkingFBX = useFBX('/models/player/walking.fbx')
    const runningFBX = useFBX('/models/player/running.fbx')

    const { mixer: idleMixer, actions: idleActions } = useAnimations(idleFBX.animations, idleAnimationGroup)
    const { mixer: walkingMixer, actions: walkingActions } = useAnimations(walkingFBX.animations, walkingAnimationGroup)
    const { mixer: runningMixer, actions: runningActions } = useAnimations(runningFBX.animations, runningAnimationGroup)

    // Player input and movement
    const controls = usePlayerInput()
    const { playerRef, currentAnimation } = usePlayerMovement(
      controls,
      position,
      actualRigidBodyRef,
      cameraController
    )

    // Expose the playerRef to parent component
    React.useImperativeHandle(ref, () => playerRef.current!, [playerRef.current])


    // Handle idle animations
    useEffect(() => {
      if (currentAnimation === 'idle' && idleActions && Object.keys(idleActions).length > 0) {

        // Stop walking animations
        Object.values(walkingActions).forEach(action => {
          if (action && action.isRunning()) {
            action.stop()
          }
        })

        Object.values(runningActions).forEach(action => {
          if (action && action.isRunning()) {
            action.stop()
          }
        })

        // Play idle animation
        const idleAction = idleActions[Object.keys(idleActions)[0]]
        if (idleAction) {
          idleAction.reset().play()
        }
      }
    }, [currentAnimation, idleActions, walkingActions])

    // Handle walking animations
    useEffect(() => {
      if (currentAnimation === 'walking' && walkingActions && Object.keys(walkingActions).length > 0) {

        // Stop idle animations
        Object.values(idleActions).forEach(action => {
          if (action && action.isRunning()) {
            action.stop()
          }
        })

        Object.values(runningActions).forEach(action => {
          if (action && action.isRunning()) {
            action.stop()
          }
        })

        // Play walking animation
        const walkingAction = walkingActions[Object.keys(walkingActions)[0]]
        if (walkingAction) {
          walkingAction.reset().play()
        }
      }
    }, [currentAnimation, idleActions, walkingActions])

    // Handle running animations
    useEffect(() => {
      if (currentAnimation === 'running' && runningActions && Object.keys(runningActions).length > 0) {

        // Stop other animations
        Object.values(idleActions).forEach(action => {
          if (action && action.isRunning()) {
            action.stop()
          }
        })
        Object.values(walkingActions).forEach(action => {
          if (action && action.isRunning()) {
            action.stop()
          }
        })

        // Play running animation
        const runningAction = runningActions[Object.keys(runningActions)[0]]
        if (runningAction) {
          runningAction.reset().play()
        }
      }
    }, [currentAnimation, idleActions, walkingActions, runningActions])

    const isFirstPersonMode = cameraController?.current?.isFirstPerson() || false

    return (
      <RigidBody
        ref={actualRigidBodyRef}
        type="dynamic"
        position={position}
        mass={1}
        lockRotations
        colliders={false}
        onCollisionEnter={(event) => {

          const currentPosition = actualRigidBodyRef.current.translation();
          actualRigidBodyRef.current.setTranslation({
            x: currentPosition.x ,
            y: currentPosition.y,
            z: currentPosition.z,
          });
        }}
        onCollisionExit={(event) => {
          console.log(`Player Collision ended with: ${event.collider}`);
        }}
      >
        <CapsuleCollider args={[0.8, 0.4]} position={[0, 1, 0]} />

        <group ref={playerRef} visible={!isFirstPersonMode}>
          {currentAnimation === 'idle' && (
            <group ref={idleAnimationGroup} position={[-.1, -0.13, 0]}>
              <primitive object={idleFBX} scale={scale} />
            </group>
          )}
          {currentAnimation === 'walking' && (
            <group ref={walkingAnimationGroup} position={[-.1, -0.13, 0]}>
              <primitive object={walkingFBX} scale={scale} />
            </group>
          )}
          {currentAnimation === 'running' && (
            <group ref={runningAnimationGroup} position={[-.1, -0.13, 0]}>
              <primitive object={runningFBX} scale={scale} />
            </group>
          )}
        </group>

      </RigidBody>
    )
  }
)
Player.displayName = 'Player'

useFBX.preload('/models/player/idle.fbx')
useFBX.preload('/models/player/walking.fbx')
useFBX.preload('/models/player/running.fbx')