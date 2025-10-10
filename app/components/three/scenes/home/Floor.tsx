import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

import { grassVertexShader, grassFragmentShader } from '../../../../assets/shaders'

export default function Floor() {
  const grassMaterialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (grassMaterialRef.current) {
      grassMaterialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -5, 0]}
        receiveShadow
      >
        <planeGeometry args={[150, 150]} />
        <shaderMaterial
          ref={grassMaterialRef}
          vertexShader={grassVertexShader}
          fragmentShader={grassFragmentShader}
          uniforms={{
            time: { value: 0 },
            grassColor1: { value: new THREE.Color(0x2d5016) }, // Dark green
            grassColor2: { value: new THREE.Color(0x4a7c23) }, // Medium green  
            grassColor3: { value: new THREE.Color(0x6b9632) }, // Light green
            dirtColor: { value: new THREE.Color(0x8b4513) }    // Brown dirt
          }}
          side={THREE.DoubleSide}
        />
      </mesh>
      <CuboidCollider args={[75, 1, 75]} position={[0, -6, 0]} />
    </RigidBody>
  )
}