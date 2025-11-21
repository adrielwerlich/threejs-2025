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

  // Engine sound refs
  const startupSoundRef = useRef<HTMLAudioElement | null>(null)
  const idleSoundRef = useRef<HTMLAudioElement | null>(null)
  const accelerationSoundRef = useRef<HTMLAudioElement | null>(null)
  const carGroupRef = useRef<THREE.Group>(null)

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
      } else if (carState.isDriving && (key === 'w' || key === 's' || key === 'arrowup' || key === 'arrowdown')) {
        handleStartAcceleration()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (carState.isDriving && (key === 'w' || key === 's' || key === 'arrowup' || key === 'arrowdown')) {
        handleStopAcceleration()
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
    dispatch(startDriving({ position, rotation }))
    setTextVisibility(false)
    setStartupFinished(false)
    playEngineStartupSequence()
  }

  const handleStopDriving = () => {
    dispatch(stopDriving())
    stopAllEngineSounds()
  }

  const handleStartAcceleration = () => {
    if (!carState.isAccelerating) {
      dispatch(setAccelerating(true))
      idleSoundRef.current?.pause()

      if (accelerationSoundRef.current) {
        accelerationSoundRef.current.currentTime = 0
        // accelerationSoundRef.current.play()
      }
    }
  }

  const handleStopAcceleration = () => {
    if (carState.isAccelerating) {
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

      startupSoundRef.current.onended = () => setStartupFinished(true);
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

  // Update Redux store with current car transform
  useFrame(() => {
    if (carState.isDriving) {
      dispatch(updateCarTransform({ position, rotation }))
    }
  })

  const FacingText = ({ position, text }: { position: [number, number, number]; text: string }) => {
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
      type="fixed"
      position={position}
      onCollisionEnter={() => {
        setTextVisibility(true)
        // console.log('Player entered car area')
      }}
      onCollisionExit={() => {
        setTextVisibility(false)
        // console.log('Player exited car area')
      }}
    >
      <group ref={carGroupRef} rotation={rotation} scale={scale}>
        <primitive object={scene} />
      </group>

      <CuboidCollider args={[2, 1, 4]} />

      {textVisibility && !carState.isDriving && (
        <FacingText
          position={[-40, 15, -20]}
          text="Press E to Drive the Car"
        />
      )}

      {/* {carState.isDriving && (
        <FacingText
          position={[0, 2, 0]}
          text="Press Q to Exit | WASD/Arrows to Drive"
        />
      )} */}
    </RigidBody>
  )
}

useGLTF.preload('/models/vehicles/RacingCar2.gltf')