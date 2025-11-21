import React from 'react'
import { AsphaltFloor } from './AsphaltFloor'
import { Car } from './Car'
import { Road } from './Road'

interface ParkingProps {
  position?: [number, number, number]
}

export const Parking: React.FC<ParkingProps> = ({
  position = [15, -5, 10],
}) => {
  // debugger;
  return (
    <group>
      {/* Asphalt parking area */}
      <AsphaltFloor
        position={[position[0], position[1] + 0.01, position[2]]}
        size={[15, 12]}
      />

      {/* Road leading to race track */}
      <Road />

      {/* Parking spaces with cars */}
      <Car />
    </group>
  )
}