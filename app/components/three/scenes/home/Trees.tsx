import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import React, { useEffect } from 'react'

export default function Trees() {
  const { scene } = useGLTF('/models/environment/Trees.glb')
  
  // Clone the scene to avoid issues if used multiple times
  const treeScene = scene.clone()
  
  useEffect(() => {
    // Configure shadows for trees
    treeScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Optionally adjust materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.needsUpdate = true
              }
            })
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.needsUpdate = true
          }
        }
      }
    })
  }, [treeScene])

  return (
    <primitive 
      object={treeScene} 
      position={[0, -5, 0]} // Adjust position as needed
      scale={[1, 1, 1]} // Adjust scale as needed
    />
  )
}