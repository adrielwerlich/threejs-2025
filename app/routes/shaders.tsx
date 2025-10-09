import type { Route } from "./+types/shaders";
import React from 'react';
import { Box, Typography } from '@mui/material';
import ShaderScene from "../components/three/scenes/shaders/ShaderScene";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Shaders - Threejs-House" },
    { name: "description", content: "Shader experiments and demos" },
  ];
}

export default function Shaders() {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        p: 3,
      }}
    >
      <Typography variant="h2" component="h1" gutterBottom>
        Shaders Page
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This is where your shader experiments will go!
        <ShaderScene />
      </Typography>
    </Box>
  );
}