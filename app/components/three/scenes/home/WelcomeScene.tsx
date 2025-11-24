import { Canvas, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import {
  useGLTF,
  useFBX,
  OrbitControls,
  useProgress,
  Html
} from '@react-three/drei'
import React, { Suspense, useEffect, useRef, useState, useMemo, memo, useCallback } from 'react'
import * as THREE from 'three'
import { Player } from '../../../../player/Player'
import { CameraController, type CameraControllerRef } from '../../../../player/CameraController'
import { Parking } from "./environment/index"
import { PhysicsHouse } from '../../physics/PhysicsHouse'
import { LoadingScreen } from '../../../ui/LoadingScreen'
import GradientSky from './SkyBox'
import Floor from './Floor'

import { resetState } from '../../../../store/slices/carSlice'
import { usePlayerInput } from '../../../../player/usePlayerInput'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'

// ✅ Preload models ONCE at module level
useGLTF.preload('/models/House_To_Export_2.glb')
useFBX.preload('/models/player/idle.fbx')
useFBX.preload('/models/player/walking.fbx')
useFBX.preload('/models/player/running.fbx')
useGLTF.preload('/models/environment/Trees.glb')

// ✅ Memoize CameraSetup
const CameraSetup = memo(() => {
  const { camera } = useThree()
  // console.log('📷 CameraSetup render')

  useEffect(() => {
    // console.log('📷 CameraSetup: Setting camera position')
    camera.position.set(15, 4, 15)
    camera.updateProjectionMatrix()
  }, [camera])

  return null
})
CameraSetup.displayName = 'CameraSetup'

// ✅ Memoize LoadingManager
const LoadingManager = memo(() => {
  const { progress } = useProgress()
  const [isLoaded, setIsLoaded] = useState(false)

  // console.log('⏳ LoadingManager render - progress:', progress, 'isLoaded:', isLoaded)

  useEffect(() => {
    if (progress === 100) {
      console.log('✅ Loading complete, setting isLoaded after 500ms')
      const timer = setTimeout(() => setIsLoaded(true), 500)
      return () => clearTimeout(timer)
    }
  }, [progress])

  if (!isLoaded) {
    return <LoadingScreen progress={progress} />
  }

  return null
})
LoadingManager.displayName = 'LoadingManager'

// ✅ Extract scene content
const SceneContent = memo(({
  playerRef,
  playerRigidBodyRef,
  cameraControllerRef,
  useOrbitControls,
  togglePhysicsDebug,
  isDriving,
  wasDriving,
  exitPosition
}: {
  playerRef: React.RefObject<THREE.Group>
  playerRigidBodyRef: React.RefObject<any>
  cameraControllerRef: React.RefObject<CameraControllerRef>
  useOrbitControls: boolean
  togglePhysicsDebug: boolean
  isDriving: boolean
  wasDriving: boolean
  exitPosition: [number, number, number]
}) => {
  // console.log('🎬 SceneContent render:', {
  //   useOrbitControls,
  //   togglePhysicsDebug,
  //   isDriving,
  //   wasDriving,
  //   exitPosition
  // })

  return (
    <>
      <CameraSetup />
      <GradientSky />

      <ambientLight intensity={0.9} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        color="#FFF8DC"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <Physics gravity={[0, -9.81, 0]} debug={togglePhysicsDebug}>
        <Floor />
        <Parking position={[3.6, -4.99, -15]} />
        <PhysicsHouse cameraController={cameraControllerRef} />

        {!isDriving && (
          <Player
            ref={playerRef}
            rigidBodyRef={playerRigidBodyRef}
            position={
              wasDriving ?
                [exitPosition[0], -4.99, exitPosition[2]] :
                [10, -4.99, -15]
            }
            cameraController={cameraControllerRef}
          />
        )}

        {!useOrbitControls && (
          <CameraController
            ref={cameraControllerRef}
            target={playerRef}
            rigidBodyTarget={playerRigidBodyRef}
          />
        )}
      </Physics>

      {useOrbitControls && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[1, -3, 0]}
        />
      )}
    </>
  )
}, (prev, next) => {
  const changes = {
    useOrbitControls: prev.useOrbitControls !== next.useOrbitControls,
    togglePhysicsDebug: prev.togglePhysicsDebug !== next.togglePhysicsDebug,
    isDriving: prev.isDriving !== next.isDriving,
    wasDriving: prev.wasDriving !== next.wasDriving,
    exitPositionX: prev.exitPosition?.[0] !== next.exitPosition?.[0],
    exitPositionY: prev.exitPosition?.[1] !== next.exitPosition?.[1],
    exitPositionZ: prev.exitPosition?.[2] !== next.exitPosition?.[2],
  }

  const isEqual =
    prev.useOrbitControls === next.useOrbitControls &&
    prev.togglePhysicsDebug === next.togglePhysicsDebug &&
    prev.isDriving === next.isDriving &&
    prev.wasDriving === next.wasDriving &&
    prev.exitPosition?.[0] === next.exitPosition?.[0] &&
    prev.exitPosition?.[1] === next.exitPosition?.[1] &&
    prev.exitPosition?.[2] === next.exitPosition?.[2]

  if (!isEqual) {
    // console.log('🔄 SceneContent RE-RENDERING due to prop changes:', changes)
    // console.log('  Previous props:', {
    //   useOrbitControls: prev.useOrbitControls,
    //   togglePhysicsDebug: prev.togglePhysicsDebug,
    //   isDriving: prev.isDriving,
    //   wasDriving: prev.wasDriving,
    //   exitPosition: prev.exitPosition
    // })
    // console.log('  Next props:', {
    //   useOrbitControls: next.useOrbitControls,
    //   togglePhysicsDebug: next.togglePhysicsDebug,
    //   isDriving: next.isDriving,
    //   wasDriving: next.wasDriving,
    //   exitPosition: next.exitPosition
    // })
  } else {
    // console.log('✅ SceneContent memo - SKIPPING re-render (props unchanged)')
  }

  return isEqual
})
SceneContent.displayName = 'SceneContent'

export const Welcome = memo(() => {
  // console.log('🏠 Welcome component render START')

  const playerRef = useRef<THREE.Group>(null)
  const playerRigidBodyRef = useRef<any>(null)
  const cameraControllerRef = useRef<CameraControllerRef>(null)
  const [contextLost, setContextLost] = useState(false)
  const [renderCount, setRenderCount] = useState(0)
  const [isReady, setIsReady] = useState(false) // ✅ Add ready state
  const [canvasReady, setCanvasReady] = useState(false) // ✅ Track canvas creation
  const { progress } = useProgress()


  const canvasKeyRef = useRef('canvas-' + Math.random().toString(36).substr(2, 9))

  useEffect(() => {
    setRenderCount(prev => prev + 1)
    // console.log(`🔄 Welcome render count: ${renderCount}`)
  }, [])

  const dispatch = useAppDispatch()
  const controls = usePlayerInput()

  // console.log('🎮 Controls from usePlayerInput:', controls)

  // ✅ FIX #1: Use separate selectors with default values to prevent new array creation
  const isDriving = useAppSelector((state: any) => {
    const value = state.car?.isDriving ?? false
    // console.log('📊 Redux selector: isDriving =', value)
    return value
  })

  const wasDriving = useAppSelector((state: any) => {
    const value = state.car?.wasDriving ?? false
    // console.log('📊 Redux selector: wasDriving =', value)
    return value
  })

  // ✅ FIX #2: Memoize exitPosition to prevent new array creation on every render
  const exitPosition = useAppSelector((state: any) => {
    const pos = state.car?.exitPosition
    const value = !pos ? [0, 0, 0] : pos
    // console.log('📊 Redux selector: exitPosition =', value, '(reference:', pos === value ? 'SAME' : 'NEW', ')')
    return value as [number, number, number]
  })

  // console.log('📊 Final state values:', {
  //   isDriving,
  //   wasDriving,
  //   exitPosition,
  //   useOrbitControls: controls.useOrbitControls,
  //   togglePhysicsDebug: controls.togglePhysicsDebug
  // })

  // ✅ Log only when values actually change
  useEffect(() => {
    // console.log('📊 State changed (useEffect triggered):', { isDriving, wasDriving, exitPosition })
  }, [isDriving, wasDriving, exitPosition])

  const { useOrbitControls, togglePhysicsDebug } = controls

  useEffect(() => {
    // console.log('🎬 Welcome MOUNTED - Setting ready state')
    dispatch(resetState())

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // console.log('✅ Setting isReady to true')
      setIsReady(true)
    })

    return () => {
      // console.log('🔚 Welcome UNMOUNTING')
    }
  }, [dispatch])


  // ✅ Context loss handlers
  useEffect(() => {
    if (!isReady) return

    // console.log('🔧 Setting up WebGL context handlers (isReady:', isReady, ')')

    // Use a small delay to ensure canvas is rendered
    const timer = setTimeout(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) {
        // console.warn('⚠️ Canvas not found after isReady=true')
        return
      }

      // console.log('✅ Canvas found, attaching context handlers')

      const handleContextLost = (event: Event) => {
        console.error('❌ WebGL context lost:', event)
        console.error('📊 Render count at context loss:', renderCount)
        console.error('📊 isReady at context loss:', isReady)
        console.error('📊 Canvas key:', canvasKeyRef.current)
        event.preventDefault()
        setContextLost(true)
      }

      const handleContextRestored = (event: Event) => {
        console.log('✅ WebGL context restored:', event)
        setContextLost(false)
        window.location.reload()
      }

      canvas.addEventListener('webglcontextlost', handleContextLost)
      canvas.addEventListener('webglcontextrestored', handleContextRestored)

      return () => {
        console.log('🧹 Cleaning up WebGL context handlers')
        canvas.removeEventListener('webglcontextlost', handleContextLost)
        canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isReady, renderCount])

  // ✅ Memoize canvas config
  const canvasConfig = useMemo(() => {
    console.log('🔧 Creating canvas config (this should only happen ONCE)')
    return {
      shadows: true,
      camera: { fov: 50, near: 0.1, far: 1000 },
      dpr: [1, 1.5],
      gl: {
        powerPreference: "high-performance" as const,
        antialias: false,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        alpha: false,
        depth: true,
        stencil: false,
      },
      frameloop: 'always' as const,
    }
  }, [])

  // ✅ Memoize onCreated
  const handleCreated = useCallback(({ gl }: any) => {
    // console.log('🎨 Canvas created with key:', canvasKeyRef.current)

    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.0

    const maxTextureSize = Math.min(gl.capabilities.maxTextureSize, 1024)
    // console.log('📊 Max texture size:', maxTextureSize)
    // console.log('📊 Max vertex uniforms:', gl.capabilities.maxVertexUniforms)
    // console.log('📊 Max fragment uniforms:', gl.capabilities.maxFragmentUniforms)

    const info = gl.info
    console.log('💾 WebGL Info:', {
      programs: info.programs?.length,
      geometries: info.memory?.geometries,
      textures: info.memory?.textures,
      renderer: gl.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1'
    })

    setTimeout(() => {
      console.log('✅ Canvas ready, hiding loader')
      setCanvasReady(true)
    }, 100)
  }, [])

  if (contextLost) {
    console.error('❌ Rendering context lost screen')
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '500px',
        zIndex: 9999
      }}>
        <h2 style={{ marginBottom: '20px' }}>⚠️ WebGL Context Lost</h2>
        <p style={{ marginBottom: '20px' }}>The 3D graphics context was lost after {renderCount} renders.</p>
        <p style={{ marginBottom: '20px' }}>Common causes:</p>
        <ul style={{ textAlign: 'left', marginBottom: '20px' }}>
          <li>🔥 GPU overheating or driver crash</li>
          <li>💾 Insufficient GPU memory (your models may be too large)</li>
          <li>🖥️ Too many browser tabs using GPU</li>
          <li>⚡ Power saving mode throttling GPU</li>
          <li>🔄 Too many component re-renders</li>
        </ul>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}
        >
          🔄 Reload Application
        </button>
      </div>
    )
  }

  console.log('🏠 Welcome component - isReady:', isReady, 'progress:', progress)

  if (!isReady && progress !== 100 ) {
    console.log('@@@ progress:', progress)
    return <LoadingManager />
  }

  console.log('🏠 Welcome component render END - Returning JSX')


  return (
    <div id="canvas-container" style={{ width: '100vw', height: '100vh' }}>
      {/* <div style={{
        position: 'fixed',
        top: '70px',
        left: '10px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        <div>🔄 Renders: {renderCount}</div>
        <div>🎮 Driving: {isDriving ? 'Yes' : 'No'}</div>
        <div>👁️ Orbit: {useOrbitControls ? 'Yes' : 'No'}</div>
        <div>🐛 Physics: {togglePhysicsDebug ? 'Yes' : 'No'}</div>
      </div> */}

      {/* <Suspense fallback={<LoadingManager />}> */}
      <Canvas key={canvasKeyRef.current} {...canvasConfig} onCreated={handleCreated}>
        <SceneContent
          playerRef={playerRef}
          playerRigidBodyRef={playerRigidBodyRef}
          cameraControllerRef={cameraControllerRef}
          useOrbitControls={useOrbitControls}
          togglePhysicsDebug={togglePhysicsDebug}
          isDriving={isDriving}
          wasDriving={wasDriving}
          exitPosition={exitPosition}
        />
      </Canvas>
      {/* </Suspense> */}
    </div>
  )
})

Welcome.displayName = 'Welcome'