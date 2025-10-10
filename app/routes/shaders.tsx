import type { Route } from "./+types/shaders";
import React from 'react';
import { Box, Typography } from '@mui/material';
import ShaderScene from "../components/three/scenes/shaders/ShaderScene";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Shaders - Threejs-House" },
    { name: "description", content: "Shader experiments and demos" },
  ];
}

export default function Shaders() {
  return (
    <Box
    className="Shaders-container"
      sx={{
        height: '90%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        p: 3,
        marginTop: '14px',
        overflowY: 'auto',
      }}
    >
      <ShaderScene />
    </Box>
  );
}