import React, { useEffect, useRef, useState } from 'react'
import { Text, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, useRapier, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks'
import {
  startDriving,
  stopDriving,
  setAccelerating,
  updateCarTransform
} from '../../../../../store/slices/carSlice'

interface CarProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

export const Car: React.FC<CarProps> = ({
  position = [45, -15.38, 3],
  rotation = [0, Math.PI / 2, 0],
  scale = 1.5,
}) => {
  const dispatch = useAppDispatch()
  const carState = useAppSelector((state) => state.car)
  const { scene } = useGLTF('/models/vehicles/RacingCar2.gltf')
  const { camera } = useThree()
  const [textVisibility, setTextVisibility] = useState(false)
  const [startupFinished, setStartupFinished] = useState(false)

  const lastUpdateTime = useRef(0)
  const UPDATE_INTERVAL = 1000 / 30 // 30 FPS for Redux updates


  // Refs
  const chassisRef = useRef<any>(null)
  const carGroupRef = useRef<THREE.Group>(null)

  // Engine sound refs
  const startupSoundRef = useRef<HTMLAudioElement | null>(null)
  const idleSoundRef = useRef<HTMLAudioElement | null>(null)
  const accelerationSoundRef = useRef<HTMLAudioElement | null>(null)

  // Vehicle physics parameters
  const vehicleParams = useRef({
    engineForce: 500,
    maxSteerValue: 5,
    maxBrakeForce: 50,
    wheelRadius: 0.4,
    wheelWidth: 0.3,
    suspensionStiffness: 30,
    suspensionDamping: 10,
    maxSuspensionTravel: 0.3,
    frictionSlip: 5,
    lateralDamping: 1,
  })

  // Keyboard controls
  const controls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      startupSoundRef.current = new Audio('/sounds/car_engine/startup.wav')
      startupSoundRef.current.volume = 0.7

      idleSoundRef.current = new Audio('/sounds/car_engine/idle.wav')
      idleSoundRef.current.loop = true
      idleSoundRef.current.volume = 0.5

      accelerationSoundRef.current = new Audio('/sounds/car_engine/low_on.wav')
      accelerationSoundRef.current.loop = true
      accelerationSoundRef.current.volume = 0.6
    }
    stopAllEngineSounds();

    return () => {
      stopAllEngineSounds();
    }
  }, [])

  useEffect(() => {
    if (startupFinished && carState.isDriving && !carState.isAccelerating && idleSoundRef.current) {
      idleSoundRef.current.currentTime = 0
      idleSoundRef.current.play()
    } else {
      idleSoundRef.current?.pause()
    }
  }, [startupFinished, carState.isDriving, carState.isAccelerating])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (key === 'e' && textVisibility && !carState.isDriving) {
        handleStartDriving()
      } else if (key === 'q' && carState.isDriving) {
        handleStopDriving()
      }

      if (!carState.isDriving) return

      // Driving controls
      switch (key) {
        case 'w':
        case 'arrowup':
          controls.current.forward = true
          handleStartAcceleration()
          break
        case 's':
        case 'arrowdown':
          controls.current.backward = true
          handleStartAcceleration()
          break
        case 'a':
        case 'arrowleft':
          controls.current.left = true
          break
        case 'd':
        case 'arrowright':
          controls.current.right = true
          break
        case ' ':
          controls.current.brake = true
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!carState.isDriving) return;
      const key = event.key.toLowerCase()

      switch (key) {
        case 'w':
        case 'arrowup':
          controls.current.forward = false
          handleStopAcceleration()
          break
        case 's':
        case 'arrowdown':
          controls.current.backward = false
          handleStopAcceleration()
          break
        case 'a':
        case 'arrowleft':
          controls.current.left = false
          break
        case 'd':
        case 'arrowright':
          controls.current.right = false
          break
        case ' ':
          controls.current.brake = false
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [textVisibility, carState.isDriving])

  const handleStartDriving = () => {
    if (chassisRef.current) {
      // Switch to dynamic rigid body when driving starts
      chassisRef.current.setBodyType(1, true) // 1 = Dynamic
    }
    dispatch(startDriving({ position, rotation }))
    setTextVisibility(false)
    setStartupFinished(false)
    playEngineStartupSequence()
  }

  const handleStopDriving = () => {
    if (chassisRef.current) {
      // Switch back to kinematic/fixed when exiting
      chassisRef.current.setBodyType(0, true) // 0 = Fixed/Static
      chassisRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      chassisRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
    dispatch(stopDriving())
    stopAllEngineSounds()
  }

  const handleStartAcceleration = () => {
    if (!carState.isAccelerating) {
      dispatch(setAccelerating(true))
      idleSoundRef.current?.pause()

      if (accelerationSoundRef.current) {
        accelerationSoundRef.current.currentTime = 0
        accelerationSoundRef.current.play()
      }
    }
  }

  const handleStopAcceleration = () => {
    accelerationSoundRef.current?.pause()
    if (!controls.current.forward && !controls.current.backward) {
      idleSoundRef.current?.play()
      dispatch(setAccelerating(false))
      accelerationSoundRef.current?.pause()

      if (idleSoundRef.current && carState.isDriving) {
        idleSoundRef.current.currentTime = 0
        idleSoundRef.current.play()
      }
    }
  }

  const playEngineStartupSequence = () => {
    stopAllEngineSounds()

    if (startupSoundRef.current) {
      startupSoundRef.current.currentTime = 0
      startupSoundRef.current.play()

      startupSoundRef.current.onended = () => setStartupFinished(true)
    }
  }

  const stopAllEngineSounds = () => {
    startupSoundRef.current?.pause()
    idleSoundRef.current?.pause()
    accelerationSoundRef.current?.pause()
    setStartupFinished(false)

    if (startupSoundRef.current) startupSoundRef.current.currentTime = 0
    if (idleSoundRef.current) idleSoundRef.current.currentTime = 0
    if (accelerationSoundRef.current) accelerationSoundRef.current.currentTime = 0
  }

  // Apply vehicle physics each frame
  useFrame((state) => {
    if (!carState.isDriving || !chassisRef.current) return

    const { forward, backward, left, right, brake } = controls.current
    const { engineForce, maxSteerValue, maxBrakeForce } = vehicleParams.current

    // Get current velocity and rotation
    const currentVelocity = chassisRef.current.linvel()
    const currentRotation = chassisRef.current.rotation()

    // Calculate engine force
    let force = 0
    if (forward && !backward) {
      force = engineForce
    } else if (backward && !forward) {
      force = -engineForce * 0.5 // Reverse is slower
    }

    // Calculate steering
    let steerValue = 0
    if (left && !right) {
      steerValue = maxSteerValue
    } else if (right && !left) {
      steerValue = -maxSteerValue
    }

    // Apply forces based on car's forward direction
    if (force !== 0) {
      const forwardDir = new THREE.Vector3(0, 0, 1)
      const quat = new THREE.Quaternion(
        currentRotation.x,
        currentRotation.y,
        currentRotation.z,
        currentRotation.w
      )
      forwardDir.applyQuaternion(quat)

      chassisRef.current.applyImpulse(
        {
          x: forwardDir.x * force * 0.01,
          y: 0,
          z: forwardDir.z * force * 0.01,
        },
        true
      )
    }

    // Counter lateral drift (sideways sliding)
    const quat = new THREE.Quaternion(
      currentRotation.x,
      currentRotation.y,
      currentRotation.z,
      currentRotation.w
    )

    // Get car's right direction
    const rightDir = new THREE.Vector3(1, 0, 0)
    rightDir.applyQuaternion(quat)

    // Calculate lateral (sideways) velocity
    const lateralVelocity = new THREE.Vector3(
      currentVelocity.x,
      0,
      currentVelocity.z
    )
    const lateralSpeed = lateralVelocity.dot(rightDir)

    // Apply counter-force to reduce sideways drift
    const lateralDamping = 0.2 // Adjust this value (0.9 = more grip, 0.99 = more drift)
    if (Math.abs(lateralSpeed) > 0.1) {
      chassisRef.current.setLinvel(
        {
          x: currentVelocity.x - rightDir.x * lateralSpeed * (1 - lateralDamping),
          y: currentVelocity.y,
          z: currentVelocity.z - rightDir.z * lateralSpeed * (1 - lateralDamping),
        },
        true
      )
    }

    // Apply steering (angular velocity)
    if (steerValue !== 0) {
      const speed = Math.sqrt(
        currentVelocity.x ** 2 + currentVelocity.z ** 2
      )

      const minSteerForce = 0.05 // Base steering force even when stopped
      const speedBasedSteer = Math.min(speed * 0.1, 1)
      const steerForce = steerValue * Math.max(speedBasedSteer, minSteerForce)

      chassisRef.current.applyTorqueImpulse(
        {
          x: 0,
          y: steerForce * (forward ? 1 : backward ? -1 : 1), // Still reverse direction when backing up
          z: 0,
        },
        true
      )
    }

    // Apply braking
    if (brake) {
      const speed = Math.sqrt(
        currentVelocity.x ** 2 + currentVelocity.z ** 2
      )

      // Progressive braking - stronger at higher speeds
      const brakeForce = 0.96 // 0.95 = moderate braking, 0.98 = gentle, 0.92 = aggressive

      chassisRef.current.setLinvel(
        {
          x: currentVelocity.x * brakeForce,
          y: currentVelocity.y,
          z: currentVelocity.z * brakeForce,
        },
        true
      )

      // Also slow down rotation when braking
      const currentAngularVel = chassisRef.current.angvel()
      chassisRef.current.setAngvel(
        {
          x: currentAngularVel.x * 0.95,
          y: currentAngularVel.y * 0.95,
          z: currentAngularVel.z * 0.95,
        },
        true
      )
    }

    const now = state.clock.elapsedTime * 1000
    if (now - lastUpdateTime.current > UPDATE_INTERVAL) {
      const pos = chassisRef.current.translation()
      const rot = chassisRef.current.rotation()
      const euler = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
      )

      dispatch(updateCarTransform({
        position: [pos.x, pos.y, pos.z],
        rotation: [euler.x, euler.y, euler.z],
      }))

      lastUpdateTime.current = now
    }

    // Update Redux with current position and rotation
    // const pos = chassisRef.current.translation()
    // const rot = chassisRef.current.rotation()
    // const euler = new THREE.Euler().setFromQuaternion(
    //   new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
    // )

    // dispatch(
    //   updateCarTransform({
    //     position: [pos.x, pos.y, pos.z],
    //     rotation: [euler.x, euler.y, euler.z],
    //   })
    // )
  })

  const FacingText = ({
    position,
    text,
  }: {
    position: [number, number, number]
    text: string
  }) => {
    const { camera } = useThree()
    const textRef = useRef<THREE.Mesh>(null)

    useFrame(() => {
      if (textRef.current) {
        textRef.current.lookAt(camera.position)
      }
    })

    if (carState.isDriving) return null

    return (
      <Text
        ref={textRef}
        position={position}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    )
  }

  return (
    <RigidBody
      ref={chassisRef}
      type={carState.isDriving ? 'dynamic' : 'fixed'}
      position={position}
      rotation={rotation}
      colliders={false}
      mass={500}
    >
      <group ref={carGroupRef} scale={scale}>
        <primitive object={scene} />
      </group>

      <CuboidCollider
        args={[1.5, 1, 3.4]}
        position={[position[0] - 26.2, position[1] + 26.8, position[2] - 45.6]}
        onCollisionEnter={() => {
          if (!carState.isDriving && !textVisibility) {
            setTextVisibility(true)
          }
        }}
        onCollisionExit={() => {
          if (textVisibility) { // ✅ Check if already hidden
            setTextVisibility(false)
          }
        }}
      />

      {textVisibility && !carState.isDriving && (
        <FacingText position={[15, 17, -38]} text="Press E to Drive the Car" />
      )}

    </RigidBody>
  )
}

useGLTF.preload('/models/vehicles/RacingCar2.gltf')