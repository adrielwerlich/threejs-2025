import React, { useEffect, useRef, useState } from 'react'
import { Text, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
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

// ✅ Separate component for the interaction text - won't cause Car to re-render
const CarInteractionText = ({ isPlayerNearCar, carPosition, isDriving }: { isPlayerNearCar: React.MutableRefObject<boolean>, carPosition: [number, number, number], isDriving: boolean }) => {
  const { camera } = useThree()
  const textRef = useRef<THREE.Mesh>(null)
  const [showText, setShowText] = useState(false)

  useFrame(() => {
    if (textRef.current) {
      textRef.current.lookAt(camera.position)
    }
  })

  // ✅ This state change only affects THIS component, not the Car
  const handleCollisionEnter = () => {
    if (!isDriving && !showText) {
      setShowText(true)
    }
  }

  const handleCollisionExit = () => {
    if (showText) {
      setShowText(false)
    }
  }

  if (isDriving || !isPlayerNearCar.current) return null

  return (
    <>
      {/* <CuboidCollider
        args={[1.5, 1, 3.4]}
        position={[carPosition[0] - 26.2, carPosition[1] + 26.8, carPosition[2] - 45.6]}
        onIntersectionEnter={handleCollisionEnter}
        onIntersectionExit={handleCollisionExit}
      /> */}
      <Text
        ref={textRef}
        position={[carPosition[0] - 36.2, carPosition[1] + 15.8, carPosition[2] - 16.6]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Press E to Drive the Car
      </Text>
    </>
  )
}

export const Car: React.FC<CarProps> = ({
  position = [45, -15.38, 3],
  rotation = [0, Math.PI / 2, 0],
  scale = 1.5,
}) => {
  const dispatch = useAppDispatch()
  const carState = useAppSelector((state) => state.car)
  const { scene } = useGLTF('/models/vehicles/RacingCar2.gltf')
  
  const [startupFinished, setStartupFinished] = useState(false)

  const lastUpdateTime = useRef(0)
  const UPDATE_INTERVAL = 1000 / 30

  const chassisRef = useRef<any>(null)
  const carGroupRef = useRef<THREE.Group>(null)
  const currentRPM = useRef(0.5)

  const startupSoundRef = useRef<HTMLAudioElement | null>(null)
  const engineSoundRef = useRef<HTMLAudioElement | null>(null)

  // ✅ Track if player is near car for E key
  const isPlayerNearCar = useRef(false)

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
    minRPM: 0.5,
    maxRPM: 2.0,
    rpmLerpSpeed: 0.05,
  })

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

      engineSoundRef.current = new Audio('/sounds/car_engine/idle2.wav')
      engineSoundRef.current.loop = true
      engineSoundRef.current.volume = 0.6
      engineSoundRef.current.playbackRate = vehicleParams.current.minRPM
    }
    stopAllEngineSounds()

    return () => {
      stopAllEngineSounds()
    }
  }, [])

  useEffect(() => {
    if (startupFinished && carState.isDriving && engineSoundRef.current) {
      engineSoundRef.current.currentTime = 0
      engineSoundRef.current.play()
    } else {
      engineSoundRef.current?.pause()
    }
  }, [startupFinished, carState.isDriving])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      // ✅ Use ref to check proximity - no state changes
      if (key === 'e' && isPlayerNearCar.current && !carState.isDriving) {
        handleStartDriving()
      } else if (key === 'q' && carState.isDriving) {
        handleStopDriving()
      }

      if (!carState.isDriving) return

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
      if (!carState.isDriving) return
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
  }, [carState.isDriving])

  const handleStartDriving = () => {
    if (chassisRef.current) {
      chassisRef.current.setBodyType(1, true)
    }
    dispatch(startDriving({ position, rotation }))
    setStartupFinished(false)
    playEngineStartupSequence()
  }

  const handleStopDriving = () => {
    if (chassisRef.current) {
      chassisRef.current.setBodyType(0, true)
      chassisRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      chassisRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
    dispatch(stopDriving())
    stopAllEngineSounds()
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
    engineSoundRef.current?.pause()
    setStartupFinished(false)

    if (startupSoundRef.current) startupSoundRef.current.currentTime = 0
    if (engineSoundRef.current) engineSoundRef.current.currentTime = 0
  }

  const handleStartAcceleration = () => {
    if (!carState.isAccelerating) {
      dispatch(setAccelerating(true))
    }
  }

  const handleStopAcceleration = () => {
    if (!controls.current.forward && !controls.current.backward) {
      dispatch(setAccelerating(false))
    }
  }

  useFrame((state) => {
    if (!carState.isDriving || !chassisRef.current) return

    const { forward, backward, left, right, brake } = controls.current
    const { engineForce, maxSteerValue, minRPM, maxRPM, rpmLerpSpeed } = vehicleParams.current

    const currentVelocity = chassisRef.current.linvel()
    const currentRotation = chassisRef.current.rotation()

    const speed = Math.sqrt(
      currentVelocity.x ** 2 + currentVelocity.z ** 2
    )

    let targetRPM = minRPM

    if (forward || backward) {
      const speedFactor = Math.min(speed / 30, 1)
      targetRPM = minRPM + (maxRPM - minRPM) * speedFactor

      if (speed < 5) {
        targetRPM = Math.max(targetRPM, minRPM + 0.3)
      }
    } else if (brake) {
      targetRPM = minRPM
    } else {
      const speedFactor = Math.min(speed / 30, 1)
      targetRPM = minRPM + (maxRPM - minRPM) * speedFactor * 0.5
    }

    currentRPM.current += (targetRPM - currentRPM.current) * rpmLerpSpeed

    if (engineSoundRef.current && startupFinished) {
      engineSoundRef.current.playbackRate = currentRPM.current
      const volumeFactor = 0.4 + (currentRPM.current - minRPM) / (maxRPM - minRPM) * 0.3
      engineSoundRef.current.volume = Math.min(volumeFactor, 0.8)
    }

    let force = 0
    if (forward && !backward) {
      force = engineForce
    } else if (backward && !forward) {
      force = -engineForce * 0.5
    }

    let steerValue = 0
    if (left && !right) {
      steerValue = maxSteerValue
    } else if (right && !left) {
      steerValue = -maxSteerValue
    }

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

    const quat = new THREE.Quaternion(
      currentRotation.x,
      currentRotation.y,
      currentRotation.z,
      currentRotation.w
    )

    const rightDir = new THREE.Vector3(1, 0, 0)
    rightDir.applyQuaternion(quat)

    const lateralVelocity = new THREE.Vector3(
      currentVelocity.x,
      0,
      currentVelocity.z
    )
    const lateralSpeed = lateralVelocity.dot(rightDir)

    const lateralDamping = 0.2
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

    if (steerValue !== 0) {
      const speed = Math.sqrt(
        currentVelocity.x ** 2 + currentVelocity.z ** 2
      )

      const minSteerForce = 0.05
      const speedBasedSteer = Math.min(speed * 0.1, 1)
      const steerForce = steerValue * Math.max(speedBasedSteer, minSteerForce)

      chassisRef.current.applyTorqueImpulse(
        {
          x: 0,
          y: steerForce * (forward ? 1 : backward ? -1 : 1),
          z: 0,
        },
        true
      )
    }

    if (brake) {
      const brakeForce = 0.96

      chassisRef.current.setLinvel(
        {
          x: currentVelocity.x * brakeForce,
          y: currentVelocity.y,
          z: currentVelocity.z * brakeForce,
        },
        true
      )

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
  })

  return (
    <>
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

        {/* ✅ Detection collider - updates ref only */}
        <CuboidCollider
          args={[1.5, 1, 3.4]}
          position={[position[0] - 26.2, position[1] + 26.8, position[2] - 45.6]}
          onCollisionEnter={() => {
            isPlayerNearCar.current = true
          }}
          onCollisionExit={() => {
            isPlayerNearCar.current = false
          }}
        />
      </RigidBody>

      {/* ✅ Separate component - its re-renders won't affect Car */}
      <CarInteractionText isPlayerNearCar={isPlayerNearCar} carPosition={position} isDriving={carState.isDriving} />
    </>
  )
}

useGLTF.preload('/models/vehicles/RacingCar2.gltf')