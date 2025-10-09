// Create a new file: DebugPanelHTML.tsx
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import type { PlayerControls } from './types'

interface DebugPanelProps {
    playerRef: React.RefObject<THREE.Group | null>
    rigidBodyRef: React.RefObject<any> | null
    controls: PlayerControls
}

export function DebugPanel({ playerRef, rigidBodyRef, controls }: DebugPanelProps) {
    const [debugInfo, setDebugInfo] = useState({
        position: 'N/A',
        rotation: 'N/A',
        controls: '{}',
        moving: false
    })

    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && rigidBodyRef?.current) {
                const pos = rigidBodyRef.current.translation()
                setDebugInfo({
                    position: `${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`,
                    rotation: `${(playerRef.current.rotation.y * 180 / Math.PI).toFixed(1)}°`,
                    controls: JSON.stringify(controls),
                    moving: !!(controls.forward || controls.backward || controls.left || controls.right)
                })
            }
        }, 100)

        return () => clearInterval(interval)
    }, [playerRef, rigidBodyRef, controls])

    return (
        <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 1000
        }}>
            <div>Position: {debugInfo.position}</div>
            <div>Rotation: {debugInfo.rotation}</div>
            <div>Controls: {debugInfo.controls}</div>
            <div>Moving: {debugInfo.moving ? 'Yes' : 'No'}</div>
        </div>
    )
}