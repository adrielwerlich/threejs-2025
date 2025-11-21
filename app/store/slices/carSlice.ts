import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

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
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  isAccelerating: false,
  isEngineStarted: false,
  wasDriving: false,
  exitPosition: undefined
}

const carSlice = createSlice({
  name: 'car',
  initialState,
  reducers: {
    resetState: () => initialState,
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