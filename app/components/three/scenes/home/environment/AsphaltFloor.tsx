import React from 'react'
import { useAsphaltMaterial } from '../../../materials/AsphaltMaterial'

interface AsphaltFloorProps {
  position?: [number, number, number]
  size?: [number, number]
  withTextures?: boolean
  quality?: 'low' | 'medium' | 'high'
}

export const AsphaltFloor: React.FC<AsphaltFloorProps> = ({ 
  position = [25, -4.99, 10], 
  size = [15, 20],
  withTextures = true,
  quality = 'medium'
}) => {
  // Calculate texture repeat based on size for realistic scaling
  // Asphalt shingle texture looks best at about 2-3 units per repeat
  const textureRepeat: [number, number] = [size[0] / 3, size[1] / 3]
  
  const asphaltMaterial = useAsphaltMaterial({
    textureRepeat: withTextures ? textureRepeat : [1, 1],
    roughness: quality === 'high' ? 0.95 : 0.9,
    metalness: 0.05, // Very low metalness for asphalt
    normalScale: quality === 'high' ? 1.2 : 0.8,
    color: '#2c2c2c',
    useTextures: withTextures
  })

  return (
    <mesh 
      position={position} 
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow
      castShadow={false}
    >
      <planeGeometry 
        args={[
          size[0], 
          size[1], 
          quality === 'high' ? 64 : quality === 'medium' ? 32 : 1, // More segments for displacement
          quality === 'high' ? 64 : quality === 'medium' ? 32 : 1
        ]} 
      />
      <primitive object={asphaltMaterial} />
    </mesh>
  )
}