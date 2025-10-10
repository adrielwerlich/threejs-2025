import { Canvas, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useGLTF, useFBX, OrbitControls, useProgress } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Player } from '../../../../player/Player'
import { CameraController, type CameraControllerRef } from '../../../../player/CameraController'
import { PhysicsHouse } from '../../physics/PhysicsHouse'
import { LoadingScreen } from '../../../ui/LoadingScreen'
import { RigidBody, CuboidCollider } from '@react-three/rapier'



// Import DebugPanel
import { DebugPanel } from '../../../../player/useDebugPanel'

import { usePlayerInput } from '../../../../player/usePlayerInput'

function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -5, 0]}
        receiveShadow
      >
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial
          color="#f0f0f0"
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Invisible thick floor for physics */}
      {/* <mesh position={[0, -6, 0]} visible={false}>
        <boxGeometry args={[150, 2, 150]} />
      </mesh> */}
      <CuboidCollider args={[75, 1, 75]} position={[0, -6, 0]} />
    </RigidBody>
  )
}

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


export function Welcome() {
  const playerRef = useRef<THREE.Group>(null)
  const playerRigidBodyRef = useRef<any>(null)
  const controls = usePlayerInput()
  const cameraControllerRef = useRef<CameraControllerRef>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    canvas?.addEventListener('webglcontextlost', (event) => {
      console.error('WebGL context lost:', event);
    });
  }, []);

  return (
    <div id="canvas-container" style={{ width: '100vw', height: '100vh' }}>
      {/* <DebugPanel playerRef={playerRef} rigidBodyRef={null} controls={controls} /> */}

      <LoadingManager />
      <Canvas
        shadows
        camera={{
          fov: 50
        }}>

        <CameraSetup />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
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

          <Suspense fallback={null}>
            <Floor />
            {/* <HouseModel /> */}
            <PhysicsHouse cameraController={cameraControllerRef} />
            <Player
              ref={playerRef}
              rigidBodyRef={playerRigidBodyRef}
              position={[5, -4.95, 5]}
              cameraController={cameraControllerRef} // Pass camera ref
            />
            <CameraController
              ref={cameraControllerRef}
              target={playerRef as React.RefObject<THREE.Group>}
              rigidBodyTarget={playerRigidBodyRef}
            />
          </Suspense>
        </Physics>

        {/* <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[1, -3, 0]}
        /> */}
      </Canvas>
    </div>
  );
}


// Preload models
useGLTF.preload('/models/House_To_Export.glb')
useFBX.preload('/models/player/idle.fbx')
useFBX.preload('/models/player/walking.fbx')
useFBX.preload('/models/player/running.fbx')