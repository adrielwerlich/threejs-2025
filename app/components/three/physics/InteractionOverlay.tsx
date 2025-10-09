import React, { useRef } from 'react'
import { RoundedBox, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Group } from 'three'
import * as THREE from 'three'

interface InteractionOverlayProps {
  visible: boolean
  text: string
  distance?: number
}

export const InteractionOverlay: React.FC<InteractionOverlayProps> = ({
  visible,
  text,
  distance = 2
}) => {
  const groupRef = useRef<Group>(null)
  const { camera } = useThree()

  // Make the overlay always face the camera
  useFrame(() => {
    if (groupRef.current && visible) {
      groupRef.current.lookAt(camera.position)

      // Position it in front of the camera
      const direction = camera.getWorldDirection(new THREE.Vector3())
      const position = camera.position.clone().add(direction.multiplyScalar(distance))
      groupRef.current.position.copy(position)
    }
  })

  if (!visible) return null

  return (
    <group ref={groupRef}>
      {/* Semi-transparent background */}
      <RoundedBox
        args={[1.3, 0.8, 0.02]}
        radius={0.1}
        smoothness={4}
        position={[0, 0, -0.01]}
      >
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.8}
        />
      </RoundedBox>

      {/* Border */}
      <RoundedBox
        args={[1.3, 0.85, 0.02]}
        radius={0.1}
        smoothness={4}
        position={[0, 0, -0.005]}
      >
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          side={2}
        />
      </RoundedBox>

      {/* Text */}
      <Text
        position={[0, 0, 1]}
        fontSize={0.06}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.5}
        textAlign="center"
        // font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff"
      >
        {text}
      </Text>
    </group>
  )
}