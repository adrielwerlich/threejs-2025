import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import {
  useGLTF,
  useFBX,
  OrbitControls,
  useProgress
} from '@react-three/drei'
import React, { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Player } from '../../../../player/Player'
import { CameraController, type CameraControllerRef } from '../../../../player/CameraController'
import { PhysicsHouse } from '../../physics/PhysicsHouse'
import { LoadingScreen } from '../../../ui/LoadingScreen'
import GradientSky from './SkyBox'
import Trees from './Trees'


// Import DebugPanel
import { DebugPanel } from '../../../../player/useDebugPanel'

import { usePlayerInput } from '../../../../player/usePlayerInput'

import Floor from './Floor'

function CameraSetup() {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(15, 4, 15)
    camera.updateProjectionMatrix()
  }, [camera])

  return null
}

function LoadingManager() {
  const { progress } = useProgress()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (progress === 100) {
      // Add a small delay for better UX
      setTimeout(() => setIsLoaded(true), 500)
    }
  }, [progress])

  if (!isLoaded) {
    return <LoadingScreen progress={progress} />
  }

  return null
}


export const Welcome = React.memo(() => {
  const playerRef = useRef<THREE.Group>(null)
  const playerRigidBodyRef = useRef<any>(null)
  const controls = usePlayerInput()
  const cameraControllerRef = useRef<CameraControllerRef>(null)
  const [contextLost, setContextLost] = useState(false)

  const { useOrbitControls } = controls


  // useEffect(() => {
  //   const canvas = document.querySelector('canvas');
  //   canvas?.addEventListener('webglcontextlost', (event) => {
  //     console.error('WebGL context lost:', event);
  //   });
  // }, []);

  useEffect(() => {
    const canvas = document.querySelector('canvas');

    const handleContextLost = (event: Event) => {
      console.error('WebGL context lost:', event);
      event.preventDefault(); // Prevent default handling
      setContextLost(true)
    };

    const handleContextRestored = (event: Event) => {
      console.log('WebGL context restored:', event);
      setContextLost(false)
      // Optionally reload the page or reinitialize resources
      window.location.reload()
    };

    canvas?.addEventListener('webglcontextlost', handleContextLost);
    canvas?.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas?.removeEventListener('webglcontextlost', handleContextLost);
      canvas?.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, []);

  if (contextLost) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '20px',
        borderRadius: '10px'
      }}>
        <h2>WebGL Context Lost</h2>
        <p>The 3D graphics context was lost. This may be due to:</p>
        <ul style={{ textAlign: 'left' }}>
          <li>GPU memory exhaustion</li>
          <li>Large model size</li>
          <li>Browser resource limits</li>
        </ul>
        <button onClick={() => window.location.reload()}>
          Reload Application
        </button>
      </div>
    );
  }

  return (
    <div id="canvas-container" style={{ width: '100vw', height: '100vh' }}>
      {/* <DebugPanel playerRef={playerRef} rigidBodyRef={null} controls={controls} /> */}

      <Suspense fallback={<LoadingManager />}>
        <Canvas
          shadows
          camera={{
            fov: 50
          }}
          gl={{
            // Add these WebGL context settings
            powerPreference: "high-performance",
            antialias: false, // Disable for better performance
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false,
            alpha: false,
            depth: true,
            stencil: false,
          }}
          onCreated={({ gl }) => {
            // Optimize renderer settings
            gl.shadowMap.enabled = true
            gl.shadowMap.type = THREE.PCFSoftShadowMap
            // gl.outputEncoding = THREE.sRGBEncoding
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.0

            // Set maximum texture size to prevent memory issues
            const maxTextureSize = Math.min(gl.capabilities.maxTextureSize, 2048)
            console.log('Max texture size:', maxTextureSize)
          }}
        >

          <CameraSetup />

          <GradientSky />

          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            color="#FFF8DC" // Warm sunlight
            // shadow-mapSize-width={1024}
            // shadow-mapSize-height={1024}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />

          <Physics gravity={[0, -9.81, 0]} debug={false}>
            <Floor />
            {/* <Trees /> */}
            {/* <HouseModel /> */}
            <PhysicsHouse cameraController={cameraControllerRef} />
            <Player
              ref={playerRef}
              rigidBodyRef={playerRigidBodyRef}
              position={[5, -4.95, 5]}
              cameraController={cameraControllerRef} // Pass camera ref
            />
            {!useOrbitControls && (
              <CameraController
                ref={cameraControllerRef}
                target={playerRef as React.RefObject<THREE.Group>}
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
        </Canvas>
      </Suspense>


    </div>
  );
})

// Preload models
// useGLTF.preload('/models/House_To_Export.glb')
useGLTF.preload('/models/House_To_Export_2.glb')
useFBX.preload('/models/player/idle.fbx')
useFBX.preload('/models/player/walking.fbx')
useFBX.preload('/models/player/running.fbx')
useGLTF.preload('/models/environment/Trees.glb')