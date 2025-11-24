import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

let lastUpdateTime = 0
const UPDATE_THROTTLE = 16 // ~60fps

const DEFAULT_POSITION: [number, number, number] = [0, 0, 0]

interface CarState {
  isDriving: boolean
  position: [number, number, number]
  rotation: [number, number, number]
  isAccelerating: boolean
  isEngineStarted: boolean
  wasDriving: boolean
  exitPosition?: [number, number, number]
}

const initialState: CarState = {
  isDriving: false,
  position: DEFAULT_POSITION,
  exitPosition: DEFAULT_POSITION,
  rotation: [0, 0, 0],
  isAccelerating: false,
  isEngineStarted: false,
  wasDriving: false,
}

const carSlice = createSlice({
  name: 'car',
  initialState,
  reducers: {
    resetState: (state) => {
      state = initialState
      return state
    },
    startDriving: (state, action: PayloadAction<{ position: [number, number, number], rotation: [number, number, number] }>) => {
      state.isDriving = true
      state.isEngineStarted = true
      state.position = action.payload.position
      state.rotation = action.payload.rotation
    },
    stopDriving: (state) => {
      state.isDriving = false
      state.isAccelerating = false
      state.isEngineStarted = false
      state.wasDriving = true

      if (state.position) {
        const [x, y, z] = state.position
        const [rx, ry, rz] = state.rotation

        // Offset to the left side of the car (driver's side)
        const offsetDistance = 3
        const exitX = x - 40 + Math.cos(ry + Math.PI / 2) * offsetDistance
        const exitZ = z - 22 + Math.sin(ry + Math.PI / 2) * offsetDistance

        state.exitPosition = [exitX, y, exitZ]
        console.log('Car exit position set to:', state.exitPosition)
      }
    },
    updateCarTransform: (state, action: PayloadAction<{ position: [number, number, number], rotation: [number, number, number] }>) => {

      const now = Date.now()
      // ✅ Throttle updates to prevent spam
      if (now - lastUpdateTime < UPDATE_THROTTLE) {
        return
      }
      lastUpdateTime = now

      if (state.isDriving) {
        state.position = action.payload.position
        state.rotation = action.payload.rotation
      }
    },
    setAccelerating: (state, action: PayloadAction<boolean>) => {
      if (state.isDriving) {
        state.isAccelerating = action.payload
      }
    }
  }
})

export const {
  startDriving,
  stopDriving,
  updateCarTransform,
  setAccelerating,
  resetState
} = carSlice.actions
export default carSlice.reducer