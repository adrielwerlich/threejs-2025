import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

interface AsphaltMaterialOptions {
  textureRepeat?: [number, number]
  roughness?: number
  metalness?: number
  normalScale?: number
  color?: string | number
  useTextures?: boolean
}

export const useAsphaltMaterial = (options: AsphaltMaterialOptions = {}) => {
  const {
    textureRepeat = [1, 1],
    roughness = 0.9,
    metalness = 0.1,
    normalScale = 1.0,
    color = '#2c2c2c',
    useTextures = true
  } = options

  const textures = useTextures ? useTexture([
    '/textures/asphalt/alternating-asphalt-shingle_albedo.png',
    '/textures/asphalt/alternating-asphalt-shingle_normal-ogl.png',
    '/textures/asphalt/alternating-asphalt-shingle_ao.png',
    '/textures/asphalt/alternating-asphalt-shingle_height.png'
  ]) : [null, null, null, null]

  const [colorMap, normalMap, aoMap, heightMap] = textures

  const material = useMemo(() => {
    if (!useTextures) {
      return new THREE.MeshStandardMaterial({
        color: color,
        roughness: roughness,
        metalness: metalness,
      })
    }

    // Configure texture repeating
    colorMap?.repeat.set(...textureRepeat)
    normalMap?.repeat.set(...textureRepeat)
    aoMap?.repeat.set(...textureRepeat)
    heightMap?.repeat.set(...textureRepeat)

    // Set texture wrapping
    const textures = [colorMap, normalMap, aoMap, heightMap]
    textures.forEach(texture => {
      if (!texture) return
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      texture.anisotropy = 4 // Better quality filtering
    })

    return new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(normalScale, normalScale),
      aoMap: aoMap, // Ambient occlusion for better depth
      displacementMap: heightMap,
      displacementScale: 0.02, // Subtle height displacement
      roughness: roughness,
      metalness: metalness,
      color: color,
    })
  }, [colorMap, normalMap, aoMap, heightMap, textureRepeat, roughness, metalness, normalScale, color, useTextures])

  return material
}

// High quality asphalt with all available PBR maps
export const createDetailedAsphaltMaterial = (textureRepeat: [number, number] = [1, 1]) => {
  const loader = new THREE.TextureLoader()

  const colorMap = loader.load('/textures/asphalt/alternating-asphalt-shingle_albedo.png')
  const normalMap = loader.load('/textures/asphalt/alternating-asphalt-shingle_normal-ogl.png')
  const aoMap = loader.load('/textures/asphalt/alternating-asphalt-shingle_ao.png')
  const heightMap = loader.load('/textures/asphalt/alternating-asphalt-shingle_height.png')

  // Configure all textures
  const textures = [colorMap, normalMap, aoMap, heightMap]
  textures.forEach(texture => {
    texture.repeat.set(...textureRepeat)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.anisotropy = 4
  })

  return new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    aoMap: aoMap,
    displacementMap: heightMap,
    displacementScale: 0.01,
    roughness: 0.9,
    metalness: 0.1,
  })
}

// Alternative: Direct material creation function without React hooks
export const createAsphaltMaterial = (options: AsphaltMaterialOptions = {}) => {
  const {
    roughness = 0.9,
    metalness = 0.1,
    color = '#2c2c2c'
  } = options

  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: roughness,
    metalness: metalness,
  })
}

// Simple asphalt material without textures (for fallback)
export const createSimpleAsphaltMaterial = (color: string | number = '#2c2c2c') => {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.9,
    metalness: 0.1,
  })
}

// Road marking material
export const createRoadMarkingMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.8,
    metalness: 0.0,
  })
}