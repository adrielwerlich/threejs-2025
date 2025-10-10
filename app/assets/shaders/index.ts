// Import shader files as text
import grassVertexShader from './grassVertex.glsl?raw';
import grassFragmentShader from './grassFragment.glsl?raw';

export { grassVertexShader, grassFragmentShader };

// You can also export them with more descriptive names
export const GRASS_VERTEX_SHADER = grassVertexShader;
export const GRASS_FRAGMENT_SHADER = grassFragmentShader;