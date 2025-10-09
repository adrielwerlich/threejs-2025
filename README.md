# React Three Fiber App - 3D House Explorer

A **React Three Fiber** application featuring an interactive 3D house environment with physics-based player movement and dynamic camera perspectives.

## Features

### 🏠 3D House Scene
- Interactive 3D house environment
- Physics-based collisions and interactions
- Detailed architectural elements including doors and walls

### 🎮 Player System
- **Player mesh** that represents you in the 3D world
- Smooth physics-based movement and collision detection
- Interactive overlays for user feedback

### 🎯 Navigation Controls
- **Arrow Keys**: Navigate the player through the 3D environment
  - ↑ Move forward
  - ↓ Move backward  
  - ← Move left
  - → Move right

### 📷 Camera Perspectives
- **C Key**: Toggle between first-person and third-person perspective
  - **Third Person**: View your player character from behind
  - **First Person**: Immersive first-person view with camera-following UI overlays

### 🚪 Interactive Elements
- **E Key**: Interact with objects in the environment
  - Open/close doors
  - Context-sensitive interaction prompts
  - Different UI displays for each camera mode:
    - Third person: 3D text floating in world space
    - First person: Screen-space overlay that follows the camera

## Technology Stack

- **React Three Fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers and components
- **@react-three/rapier**: Physics engine integration
- **Three.js**: 3D graphics library
- **TypeScript**: Type-safe development

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the local development URL

4. Use the controls mentioned above to explore the 3D house!

## Controls Summary

| Key | Action |
|-----|--------|
| ↑↓←→ | Move player |
| C | Toggle first/third person |
| E | Interact with objects |

Enjoy exploring your virtual house! 🏡