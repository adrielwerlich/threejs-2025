import { Billboard, Text, useGLTF } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import React, { useEffect, useState, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber';
import { type CameraControllerRef } from '../../../player/CameraController'
import { InteractionOverlay } from './InteractionOverlay'

interface PhysicsHouseProps {
  cameraController?: React.RefObject<CameraControllerRef>
}


export const PhysicsHouse = React.memo(({ cameraController }: PhysicsHouseProps) => {


  const [isFirstPersonMode, setIsFirstPersonMode] = useState(false)
  const { scene } = useGLTF('/models/House_To_Export.glb')
  const [wallMeshes, setWallMeshes] = useState<THREE.Mesh[]>([])
  const [collidingMesh, setCollidingMesh] = useState<string | null>(null)
  const [colliderData, setColliderData] = useState<any[]>([])
  const [doorMeshes, setDoorMeshes] = useState<THREE.Mesh[]>([]);
  const [textVisibility, setTextVisibility] = useState<Record<string, boolean>>({});
  // const [collidingDoor, setCollidingDoor] = useState<React.RefObject<THREE.Group | null> | null>(null);
  const doorGroupRefs = useRef<Record<string, React.RefObject<THREE.Group | null>>>({});

  const [collidingDoor, setCollidingDoor] = useState<THREE.Object3D | null>(null);
  const [doorParents, setDoorParents] = useState<THREE.Object3D[]>([]);
  const [doorStates, setDoorStates] = useState<Record<string, boolean>>({});

  const shouldShowOverlay = Object.values(textVisibility).some(visible => visible) && isFirstPersonMode
  const overlayText = shouldShowOverlay ? 'Press E to Open/Close' : ''


  useFrame(() => {
    const currentMode = cameraController?.current?.isFirstPerson() || false
    if (currentMode !== isFirstPersonMode) {
      setIsFirstPersonMode(currentMode)
    }
  })

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'e' && collidingDoor) {
        // toggleDoor(collidingDoor.current);
        toggleDoor(collidingDoor);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [collidingDoor]);

  useEffect(() => {
    const walls: THREE.Mesh[] = []
    const doors: THREE.Mesh[] = [];
    const colliders: any[] = []
    const parents: THREE.Object3D[] = [];

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {

        if (child.name.toLowerCase().includes('wall') && !child.name.toLowerCase().includes('door')) {

          walls.push(child)

          const geom = child.geometry.clone()
          geom.applyMatrix4(child.matrixWorld)
          geom.computeBoundingBox()
          const bbox = geom.boundingBox

          if (bbox) {
            const size = new THREE.Vector3()
            bbox.getSize(size)
            const center = new THREE.Vector3()
            bbox.getCenter(center)

            colliders.push({
              name: child.name,
              center: center.clone(),
              size: size.clone(),
              position: child.position.clone()
            })
          }
        }
        else if (child instanceof THREE.Mesh && child.name === 'Door_1') {
          doors.push(child);

          if (child.parent) {
            parents.push(child.parent);

            // Initialize door state using parent's uuid as key
            setDoorStates(prev => ({
              ...prev,
              [child.parent!.uuid]: false
            }));
          }
        }
      }

    })

    setWallMeshes(walls)
    setColliderData(colliders)
    setDoorMeshes(doors);
    setDoorParents(parents);

  }, [scene]);

  const toggleTextVisibility = (doorName: string, isVisible: boolean) => {
    setTextVisibility((prev) => ({ ...prev, [doorName]: isVisible }));
  };


  const FacingText = ({ position, text }:
    { position: [number, number, number]; text: string }) => {
    const { camera } = useThree();
    const textRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
      if (textRef.current) {
        textRef.current.lookAt(camera.position); // Make the text face the camera
      }
    });

    if (isFirstPersonMode) return null

    return (
      <Text
        ref={textRef}
        position={position}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    );
  };

  const toggleDoor = (doorParent: THREE.Object3D) => {

    const isOpen = doorStates[doorParent.uuid] || false;
    const newRotation = isOpen ? 0 : Math.PI / 2; // 90 degrees


    // Rotate the parent - this will rotate all children (door + handle)
    doorParent.rotation.y = newRotation;

    setDoorStates(prev => ({
      ...prev,
      [doorParent.uuid]: !isOpen
    }));


    if (!!collidingMesh) {
      setTextVisibility((prev) => ({ ...prev, [collidingMesh]: false }));
    }
  };



  return (
    <>
      <InteractionOverlay
        visible={shouldShowOverlay}
        text={overlayText}
        distance={1.5}
      />

      <group position={[12, -5, 12]}>
        <primitive object={scene} scale={1} />

        {wallMeshes.map((mesh, index) => {
          const geom = mesh.geometry.clone()
          geom.applyMatrix4(mesh.matrixWorld)
          geom.computeBoundingBox()
          const bbox = geom.boundingBox

          if (!bbox) return null

          const size = new THREE.Vector3()
          bbox.getSize(size)
          const center = new THREE.Vector3()
          bbox.getCenter(center)

          const adjustedCenter = new THREE.Vector3(
            center.x - 12,
            center.y + 5,
            center.z - 12
          )

          return (
            <RigidBody
              key={`${mesh.name}-${index}`}
              type="fixed"
              position={adjustedCenter}
              onCollisionEnter={(event) => {
                console.log(`Collision started with: ${event.collider}`);
              }}
              onCollisionExit={(event) => {
                console.log(`Collision ended with: ${event.collider}`);
              }}
              mass={1}
            >
              <CuboidCollider args={[size.x / 2, size.y / 2, size.z / 2]} />
            </RigidBody>
          )
        })}

        {doorMeshes.map((mesh, index) => {
          const geom = mesh.geometry.clone();
          geom.applyMatrix4(mesh.matrixWorld);
          geom.computeBoundingBox();
          const bbox = geom.boundingBox;

          if (!bbox) return null;

          const size = new THREE.Vector3();
          bbox.getSize(size);
          const center = new THREE.Vector3();
          bbox.getCenter(center);

          const adjustedCenter = new THREE.Vector3(
            center.x - 3.61,
            center.y + 4.45,
            center.z - 7.765
          );

          const doorParent = mesh.parent;
          const doorGroupRef = doorGroupRefs.current[mesh.name];

          const isDoorOpen = doorParent ? doorStates[doorParent.uuid] : false;

          let rigidBodySize: [number, number, number];
          if (isDoorOpen) {
            rigidBodySize = [size.x * .8, size.y / 2, size.z * 3];
          } else {
            rigidBodySize = [size.x * 12, size.y / 2, size.z * 2];
          }


          return (
            <React.Fragment key={`door-${mesh.name}-${index}`}>

              <RigidBody
                key={`${mesh.name}-${index}`}
                type="fixed"
                position={adjustedCenter}
                onCollisionEnter={() => {

                  setTextVisibility((prev) => ({ ...prev, [mesh.name]: true }));
                  // setCollidingDoor(doorGroupRef);
                  setCollidingDoor(doorParent);
                  setCollidingMesh(mesh.name);
                }}
                onCollisionExit={() => {
                  setTextVisibility((prev) => ({ ...prev, [mesh.name]: false }));
                  setCollidingDoor(null);
                  setCollidingMesh(null);
                }}
              >
                <CuboidCollider
                  args={rigidBodySize}
                  position={adjustedCenter}
                />
                {textVisibility[mesh.name] && !isFirstPersonMode && (
                  <FacingText
                    position={[adjustedCenter.x, adjustedCenter.y + size.y + 0.5, adjustedCenter.z]}
                    text={'Press E to Open/Close'}
                  />
                )}
              </RigidBody>
            </React.Fragment>
          );
        })}
      </group>
    </>
  )


})