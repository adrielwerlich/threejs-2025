import React from 'react'
import { useAsphaltMaterial } from '../../../materials/AsphaltMaterial'
import * as THREE from 'three'

interface RoadProps {
  startPosition?: [number, number, number]
  endPosition?: [number, number, number]
  width?: number
  rotation?: [number, number, number]
}

export const Road: React.FC<RoadProps> = ({
  startPosition = [43, -4.99, 15],
  endPosition = [41, -4.99, -45],
  width = 8,
  rotation = [0, Math.PI / 2, 0]
}) => {



  const asphaltMaterial = useAsphaltMaterial({
    textureRepeat: [1, 10], // Repeat texture along length
    roughness: 0.8
  })

  const length = 64
  const centerZ = (startPosition[2] + endPosition[2]) / 2

  return (
    <group
      position={[startPosition[0], startPosition[1], centerZ]}
      rotation={rotation}
    >
      {/* Main road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <primitive object={asphaltMaterial} />
      </mesh>

      {/* Road markings - center line */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, length]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>

      {/* Road edges */}
      <mesh position={[-width / 2 - 0.5, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, length]} />
        <meshBasicMaterial color="#888888" />
      </mesh>

      <mesh position={[width / 2 + 0.5, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, length]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
    </group>
  )
}