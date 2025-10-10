import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default  function GradientSky() {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
      // Slowly rotate stars
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.0002
      }
    })

    return (
      <mesh ref={meshRef}>
        <sphereGeometry args={[500, 64, 64]} />
        <shaderMaterial
          side={THREE.BackSide}
          vertexShader={`
          varying vec3 vWorldPosition;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
          fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform vec3 moonColor;
          uniform float offset;
          uniform float exponent;
          uniform float time;
          varying vec3 vWorldPosition;
          varying vec2 vUv;
          
          // Simple noise function for stars
          float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
          }
          
          // Create stars
          float stars(vec2 uv, float threshold) {
            vec2 grid = floor(uv * 200.0);
            vec2 id = fract(uv * 200.0);
            float n = random(grid);
            
            if (n > threshold) {
              float d = distance(id, vec2(0.5));
              float star = 1.0 - smoothstep(0.0, 0.3, d);
              return star * (0.5 + 0.5 * sin(time + n * 10.0)); // Twinkling effect
            }
            return 0.0;
          }
          
          // Create moon
          float moon(vec2 uv) {
            vec2 moonPos = vec2(0.7, 0.8); // Moon position
            float moonSize = 0.04;
            float d = distance(uv, moonPos);
            
            // Main moon circle
            float moon = 1.0 - smoothstep(moonSize - 0.02, moonSize, d);
            
            // Moon craters (simple circles)
            vec2 crater1 = moonPos + vec2(-0.01, 0.007);
            vec2 crater2 = moonPos + vec2(0.01, -0.02);
            float c1 = 1.0 - smoothstep(0.008, 0.012, distance(uv, crater1));
            float c2 = 1.0 - smoothstep(0.005, 0.008, distance(uv, crater2));
            
            return moon - c1 * 0.3 - c2 * 0.2;
          }
          
          void main() {
            // Night sky gradient
            float h = normalize(vWorldPosition + offset).y;
            vec3 skyColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
            
            // Add stars
            float starField = stars(vUv, 0.85);
            skyColor += vec3(starField) * 0.8;
            
            // Add moon
            float moonMask = moon(vUv);
            skyColor = mix(skyColor, moonColor, moonMask);
            
            // Add some atmospheric glow near horizon
            float horizon = 1.0 - abs(h);
            vec3 horizonGlow = vec3(0.1, 0.05, 0.2) * horizon * 0.3;
            skyColor += horizonGlow;
            
            gl_FragColor = vec4(skyColor, 1.0);
          }
        `}
          uniforms={{
            topColor: { value: new THREE.Color(0x000428) }, // Deep night blue
            bottomColor: { value: new THREE.Color(0x004e92) }, // Darker blue at horizon
            moonColor: { value: new THREE.Color(0xffffcc) }, // Pale yellow moon
            offset: { value: 33 },
            exponent: { value: 1.2 },
            time: { value: 0 }
          }}
        />
      </mesh>
    )
  }
