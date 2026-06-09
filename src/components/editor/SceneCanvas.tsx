import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import RoomGeometry from './RoomGeometry';
import FurnitureItem from './FurnitureItem';
import { useEditorStore } from '../../store/editorStore';
import { RoomTemplate } from '../../data/rooms';
import * as THREE from 'three';

export interface SceneCanvasRef {
  takeScreenshot: () => string;
  getCameraState: () => { position: number[]; target: number[] } | null;
  setCameraPreset: (preset: { position: [number, number, number]; target: [number, number, number] }) => void;
}

interface InnerProps {
  room: RoomTemplate;
  controlsRef: React.MutableRefObject<any>;
}

function SceneInner({ room, controlsRef }: InnerProps) {
  const { items, dragItemId, updateItem, selectItem } = useEditorStore();

  const handleFloorPointerDown = (e: ThreeEvent<PointerEvent>) => {
    // Suppress right-click at floor level so it can't bubble up to canvas context menu
    if (e.button !== 0) e.stopPropagation();
  };

  const handleFloorPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragItemId) return;
    e.stopPropagation();

    // Get dragged item's actual footprint so it can't go outside walls
    const store = useEditorStore.getState();
    const draggedItem = store.items.find((it) => it.id === dragItemId);
    const iHalfW = draggedItem ? draggedItem.scale[0] / 2 + 0.02 : 0.4;
    const iHalfD = draggedItem ? draggedItem.scale[2] / 2 + 0.02 : 0.4;

    const hw = room.width  / 2 - iHalfW;
    const hd = room.depth  / 2 - iHalfD;
    const x = Math.max(-hw, Math.min(hw, e.point.x));
    const z = Math.max(-hd, Math.min(hd, e.point.z));
    updateItem(dragItemId, { position: [x, 0, z] });
  };

  const handleFloorPointerUp = () => {
    useEditorStore.getState().setDragItemId(null);
  };

  const handleFloorClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.nativeEvent.button !== 0) return;
    e.stopPropagation();
    selectItem(null);
  };

  const handleFloorContextMenu = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
  };

  return (
    <>
      <color attach="background" args={['#E8E3DC']} />

      {/* Hemisphere light simulates sky + ground bounce */}
      <hemisphereLight args={['#FFF5E8', '#D4C4A8', 0.5]} />
      <ambientLight intensity={0.35} />

      {/* Main sun from upper-left */}
      <directionalLight
        position={[4, 9, 5]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.001}
      />
      {/* Fill light from opposite */}
      <directionalLight position={[-3, 5, -4]} intensity={0.4} />

      <OrbitControls
        ref={controlsRef}
        target={[0, 0.5, 0]}
        enabled={!dragItemId}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={2}
        maxDistance={14}
        enableDamping
        dampingFactor={0.1}
      />

      <RoomGeometry room={room} />

      {/* Invisible drag-catcher floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        onPointerDown={handleFloorPointerDown}
        onPointerMove={handleFloorPointerMove}
        onPointerUp={handleFloorPointerUp}
        onClick={handleFloorClick}
        onContextMenu={handleFloorContextMenu}
      >
        <planeGeometry args={[room.width, room.depth]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {items.map((item) => (
        <FurnitureItem key={item.id} item={item} />
      ))}
    </>
  );
}

const SceneCanvas = forwardRef<SceneCanvasRef, { room: RoomTemplate }>(({ room }, ref) => {
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    takeScreenshot: () => {
      if (!glRef.current) return '';
      return glRef.current.domElement.toDataURL('image/png');
    },
    getCameraState: () => {
      if (!controlsRef.current) return null;
      const cam = controlsRef.current.object as THREE.Camera;
      const target = controlsRef.current.target as THREE.Vector3;
      return { position: cam.position.toArray(), target: target.toArray() };
    },
    setCameraPreset: (preset) => {
      if (!controlsRef.current) return;
      const cam = controlsRef.current.object as THREE.Camera;
      cam.position.set(...preset.position);
      controlsRef.current.target.set(...preset.target);
      controlsRef.current.update();
    },
  }));

  return (
    <Canvas
      shadows
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: room.cameraPresets[0].position, fov: 55, near: 0.1, far: 100 }}
      onCreated={({ gl }) => {
        glRef.current = gl;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneInner room={room} controlsRef={controlsRef} />
    </Canvas>
  );
});

SceneCanvas.displayName = 'SceneCanvas';
export default SceneCanvas;
