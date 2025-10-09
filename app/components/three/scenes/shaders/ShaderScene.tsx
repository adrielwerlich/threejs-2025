import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Box, Typography } from '@mui/material';

function BlueBox() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}

export default function Shaders() {
  return (

    <Box sx={{ width: 400, height: 400 }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <BlueBox />
      </Canvas>
    </Box>

  );
}