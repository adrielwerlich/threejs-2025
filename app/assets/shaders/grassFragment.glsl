uniform float time;
uniform vec3 grassColor1;
uniform vec3 grassColor2;
uniform vec3 grassColor3;
uniform vec3 dirtColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Noise functions
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal noise
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 0.0;
  
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Grass blade pattern
float grassPattern(vec2 uv, float scale) {
  vec2 grid = fract(uv * scale);
  vec2 id = floor(uv * scale);
  
  float n = random(id);
  
  // Create grass blade shapes
  float blade1 = 1.0 - smoothstep(0.1, 0.3, abs(grid.x - 0.3 - n * 0.2));
  float blade2 = 1.0 - smoothstep(0.1, 0.3, abs(grid.x - 0.7 - n * 0.2));
  float blade3 = 1.0 - smoothstep(0.1, 0.25, abs(grid.x - 0.5 - n * 0.15));
  
  // Vary blade heights
  blade1 *= smoothstep(0.0, 0.2 + n * 0.3, grid.y);
  blade2 *= smoothstep(0.0, 0.15 + n * 0.4, grid.y);
  blade3 *= smoothstep(0.0, 0.25 + n * 0.2, grid.y);
  
  return max(max(blade1, blade2), blade3);
}

void main() {
  vec2 uv = vUv * 50.0; // Scale up the UV for detail
  
  // Base grass color variation
  float grassNoise = fbm(uv * 0.5 + time * 0.1);
  float grassVariation = fbm(uv * 2.0);
  
  // Create different grass densities
  float grassDensity1 = grassPattern(uv, 20.0);
  float grassDensity2 = grassPattern(uv + vec2(0.5), 25.0);
  float grassDensity3 = grassPattern(uv + vec2(0.25, 0.75), 30.0);
  
  float totalGrass = max(max(grassDensity1, grassDensity2), grassDensity3);
  
  // Color mixing
  vec3 grass1 = mix(grassColor1, grassColor2, grassNoise);
  vec3 grass2 = mix(grassColor2, grassColor3, grassVariation);
  vec3 grassColor = mix(grass1, grass2, totalGrass);
  
  // Add some dirt patches
  float dirtNoise = fbm(uv * 0.1);
  float dirtMask = smoothstep(0.6, 0.8, dirtNoise);
  
  // Wind effect (subtle movement)
  float wind = sin(uv.x * 0.5 + time * 2.0) * cos(uv.y * 0.3 + time * 1.5) * 0.1;
  grassColor = mix(grassColor, grassColor * 1.1, wind);
  
  // Final color mixing
  vec3 finalColor = mix(grassColor, dirtColor, dirtMask * 0.3);
  
  // Add some overall variation
  finalColor *= 0.8 + 0.4 * grassNoise;
  
  gl_FragColor = vec4(finalColor, 1.0);
}