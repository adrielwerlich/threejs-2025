import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import * as THREE from 'three';

// Basic vertex shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shaders for different effects
const fragmentShaders = {
  gradient: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vec3 color = vec3(vUv, 0.5 + 0.5 * sin(time));
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  waves: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      float wave = sin(vUv.x * 10.0 + time) * 0.5 + 0.5;
      vec3 color = vec3(wave, vUv.y, 0.8);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  circles: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      float circle = sin(dist * 20.0 - time * 5.0) * 0.5 + 0.5;
      vec3 color = vec3(circle, 0.3, 0.7);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  noise: `
    uniform float time;
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    void main() {
      vec2 st = vUv * 10.0;
      float noise = random(st + time * 0.1);
      vec3 color = vec3(noise, noise * 0.5, noise * 0.8);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  plasma: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      float x = vUv.x;
      float y = vUv.y;
      float v = sin((x * 10.0 + time));
      v += sin((y * 10.0 + time) / 2.0);
      v += sin((x * 10.0 + y * 10.0 + time) / 2.0);
      vec3 color = vec3(sin(v), sin(v + 2.0), sin(v + 4.0)) * 0.5 + 0.5;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  spiral: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vec2 center = vUv - 0.5;
      float angle = atan(center.y, center.x);
      float radius = length(center);
      float spiral = sin(angle * 5.0 + radius * 20.0 - time * 3.0);
      vec3 color = vec3(spiral * 0.5 + 0.5, radius, 0.8 - radius);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  checkerboard: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vec2 grid = floor(vUv * 8.0 + time * 0.5);
      float checker = mod(grid.x + grid.y, 2.0);
      vec3 color = vec3(checker, 1.0 - checker, 0.5);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  pulse: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);
      float pulse = abs(sin(time * 2.0)) * 0.5 + 0.5;
      float ring = 1.0 - smoothstep(pulse - 0.1, pulse + 0.1, dist);
      vec3 color = vec3(ring, ring * 0.5, 1.0 - ring);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  fractal: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vec2 z = (vUv - 0.5) * 3.0;
      vec2 c = vec2(sin(time * 0.1), cos(time * 0.1));
      
      int iterations = 0;
      for(int i = 0; i < 50; i++) {
        if(dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iterations++;
      }
      
      float color = float(iterations) / 50.0;
      gl_FragColor = vec4(vec3(color, color * 0.5, 1.0 - color), 1.0);
    }
  `
};

interface ShaderPlaneProps {
  fragmentShader: string;
  title: string;
}

function ShaderPlane({ fragmentShader, title }: ShaderPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          time: { value: 0 }
        }}
      />
    </mesh>
  );
}

const shaderData = [
  { name: 'Gradient', shader: fragmentShaders.gradient },
  { name: 'Waves', shader: fragmentShaders.waves },
  { name: 'Circles', shader: fragmentShaders.circles },
  { name: 'Noise', shader: fragmentShaders.noise },
  { name: 'Plasma', shader: fragmentShaders.plasma },
  { name: 'Spiral', shader: fragmentShaders.spiral },
  { name: 'Checkerboard', shader: fragmentShaders.checkerboard },
  { name: 'Pulse', shader: fragmentShaders.pulse },
  { name: 'Fractal', shader: fragmentShaders.fractal }
];

export default function Shaders() {
  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: '#f5f5f5',
        position: 'relative',
        overflowY: 'auto',
        flexGrow: 1
      }}
      className="Shaders"
    >
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#333' }}>
        Shader Gallery
      </Typography>

      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        {shaderData.map((item, index) => (
          <Grid size={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s ease-in-out'
                }
              }}
            >
              <Box sx={{ height: 300, overflow: 'hidden' }}>
                <Canvas camera={{ position: [0, 0, 3] }}>
                  <ShaderPlane
                    fragmentShader={item.shader}
                    title={item.name}
                  />
                </Canvas>
              </Box>

              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h6" component="h2">
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Custom shader effect #{index + 1}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}