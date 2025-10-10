export interface PlayerState {
  position: [number, number, number]
  rotation: [number, number, number]
  isMoving: boolean
  currentAnimation: string
  speed: number
}

export interface PlayerControls {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  run: boolean
  toggleCamera: boolean
  toggleDebug: boolean
  useOrbitControls: boolean
}

export type AnimationType = 'idle' | 'walking' | 'running'