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
  const { scene } = useGLTF('/models/House_To_Export_2.glb')
  const [wallMeshes, setWallMeshes] = useState<THREE.Mesh[]>([])
  const [collidingMesh, setCollidingMesh] = useState<string | null>(null)
  const [windowSide, setWindowSide] = useState<string | null>(null)
  const [doorMeshes, setDoorMeshes] = useState<THREE.Mesh[]>([]);
  const [furnitureMeshes, setFurnitureMeshes] = useState<THREE.Mesh[]>([]);
  const [windowMeshes, setWindowMeshes] = useState<THREE.Mesh[]>([]);
  const [textVisibility, setTextVisibility] = useState<Record<string, boolean>>({});
  const [collidingDoor, setCollidingDoor] = useState<THREE.Object3D | null>(null);
  const [collidingWindow, setCollidingWindow] = useState<THREE.Object3D | null>(null);
  // const [doorParents, setDoorParents] = useState<THREE.Object3D[]>([]);
  const [doorStates, setDoorStates] = useState<Record<string, boolean>>({});
  const [windowStates, setWindowStates] = useState<Record<string, boolean>>({});

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
      if (event.key === 'e') {
        if (collidingDoor) {
          toggleDoor(collidingDoor);
        } else if (collidingWindow) {
          openCloseWindow(collidingWindow);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [collidingDoor, collidingWindow]);

  useEffect(() => {
    const walls: THREE.Mesh[] = []
    const doors: THREE.Mesh[] = [];
    const colliders: any[] = []
    const parents: THREE.Object3D[] = [];
    const furniture: THREE.Mesh[] = [];
    const windows: THREE.Mesh[] = [];

    scene.traverse((child) => {

      // console.log(child.type, child.name);

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
        else if (child.name === 'Door_1' || child.name === 'Door') {
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

        if (
          child.name.toLowerCase().includes('open_close_object')
        ) {
          // console.log('Found window mesh:', child.name, child);
          windows.push(child);
        }
      } else if (child instanceof THREE.Object3D && child.name === 'Furniture') {
        child.children.forEach((furnitureChild, index) => {
          furniture.push(furnitureChild as THREE.Mesh);
        });
      }

    })

    console.log('Total windows found:', windows);

    setWindowMeshes(windows);
    setFurnitureMeshes(furniture);
    setWallMeshes(walls)
    // setColliderData(colliders)
    setDoorMeshes(doors);
    // setDoorParents(parents);

  }, [scene]);

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

  // useEffect(() => {
  //   const initialWindowStates: Record<string, boolean> = {};
  //   windowMeshes.forEach(window => {
  //     initialWindowStates[window.uuid] = false;
  //   });
  //   setWindowStates(initialWindowStates);
  // }, [windowMeshes]);

  const openCloseWindow = (windowMesh: THREE.Object3D) => {

    const isOpen = windowStates[windowMesh.uuid] || false;

    if (windowMesh.parent) {
      if (windowSide === 'left') {
        if (isOpen && windowMesh.position.x <= 70) {
          windowMesh.position.x += 70
        } else {
          windowMesh.position.x -= 70
        }
      } else {
        if (isOpen && windowMesh.position.x >= -70) {
          windowMesh.position.x -= 70
        } else {
          windowMesh.position.x += 70
        }
      }
    }

    windowStates[windowMesh.uuid] = !isOpen;

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


          let adjustedCenter;
          if (mesh.name === 'Door') {

            adjustedCenter = new THREE.Vector3(
              center.x - 3.6,
              center.y + 4.45,
              center.z - 7.765
            );
          } else {
            adjustedCenter = new THREE.Vector3(
              center.x - 11.45,
              center.y + 4.45,
              center.z - 9.7
            );
          }

          const doorParent = mesh.parent;
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
                    text={'Press E to Open/Close the door'}
                  />
                )}
              </RigidBody>
            </React.Fragment>
          );
        })}

        {furnitureMeshes.map((furnitureItem, index) => {
          // Only create colliders for mesh objects
          if (!(furnitureItem instanceof THREE.Mesh)) return null;

          const mesh = furnitureItem as THREE.Mesh;
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
            center.x - 12,
            center.y + 5,
            center.z - 12
          );

          return (
            <RigidBody
              key={`window-${mesh.name}-${index}`}
              type="fixed"
              position={adjustedCenter}
            >
              <CuboidCollider args={[size.x / 2, size.y / 2, size.z / 2]} />
            </RigidBody>
          );
        })}

        {windowMeshes.map((windowItem, index) => {
          // Only create colliders for mesh objects
          if (!(windowItem instanceof THREE.Mesh)) return null;

          const mesh = windowItem as THREE.Mesh;
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
            center.x - 12,
            center.y + 5,
            center.z - 12
          );

          // debugger;
          // console.log(mesh, mesh.parent)

          let meshNameUserFriendly, side;
          if (mesh.name.toLowerCase().includes('leftside')) {
            meshNameUserFriendly = 'Left Side Window';
            side = 'left';
          } else {
            meshNameUserFriendly = 'Right Side Window';
            side = 'right';
          }

          return (
            <RigidBody
              key={`window-${mesh.name}-${index}`}
              type="fixed"
              position={adjustedCenter}
              sensor={true}
              onIntersectionEnter={() => {
                const allTextHidden = Object.values(textVisibility).every(visible => !visible);
                if (allTextHidden) {
                  setTextVisibility((prev) => ({ ...prev, [mesh.name]: true }));
                  setTextVisibility((prev) => ({ ...prev, [mesh.name]: true }));
                  if (!collidingWindow) {
                    setCollidingWindow(mesh.parent);
                    setWindowSide(side);
                    console.log('Intersecting with window:', mesh);
                  }
                }
              }}
              onIntersectionExit={() => {
                setTextVisibility((prev) => ({ ...prev, [mesh.name]: false }));
                setCollidingWindow(null);
                console.log('Intersection with window ended');
              }}
            >
              <CuboidCollider args={[size.x * 6, size.y / 2, size.z / 5]} />

              {textVisibility[mesh.name] && !isFirstPersonMode && (
                <FacingText
                  // position={[adjustedCenter.x, adjustedCenter.y + size.y - 0.5, adjustedCenter.z + 12]}
                  position={[
                    mesh.position.x,
                    mesh.position.y + size.y + 0.5,
                    mesh.position.z
                  ]}
                  text={`Press E to Open/Close the ${meshNameUserFriendly}`}
                />
              )}
            </RigidBody>
          );
        })}
      </group>
    </>
  )


})