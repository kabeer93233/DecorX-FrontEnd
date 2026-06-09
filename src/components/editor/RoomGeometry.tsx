import React from 'react';
import { RoomTemplate } from '../../data/rooms';

interface Props { room: RoomTemplate }

// Deterministic floor plank pattern
function FloorPlanks({ width, depth }: { width: number; depth: number }) {
  const plankW  = 0.16;
  const plankGap = 0.01;
  const unit = plankW + plankGap;
  const cols = Math.ceil(width  / unit) + 2;
  const rows = Math.ceil(depth  / unit) + 2;
  const planks: JSX.Element[] = [];

  const SHADES = ['#C4A070', '#BF9B6A', '#C9A878', '#BA9565', '#CDB07E'];

  for (let r = 0; r < rows; r++) {
    const offsetX = (r % 2) * unit * 0.5;
    for (let c = 0; c < cols; c++) {
      const px = -width  / 2 + (c - 0.5) * unit + offsetX;
      const pz = -depth  / 2 + (r + 0.5) * unit;
      const shade = SHADES[(r * 3 + c) % SHADES.length];
      planks.push(
        <mesh key={`${r}-${c}`} rotation={[-Math.PI / 2, 0, 0]} position={[px, 0.001, pz]} receiveShadow>
          <planeGeometry args={[plankW * 3.5, unit * 0.94]} />
          <meshLambertMaterial color={shade} />
        </mesh>
      );
    }
  }
  return <>{planks}</>;
}

// Area rug (living room / dining room)
function AreaRug({ width, depth }: { width: number; depth: number }) {
  const rw = Math.min(width * 0.6, 3.6);
  const rd = Math.min(depth * 0.55, 2.8);
  return (
    <group>
      {/* Rug border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} receiveShadow>
        <planeGeometry args={[rw + 0.12, rd + 0.12]} />
        <meshLambertMaterial color="#8B6048" />
      </mesh>
      {/* Rug main field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow>
        <planeGeometry args={[rw, rd]} />
        <meshLambertMaterial color="#D4905A" />
      </mesh>
      {/* Rug inner pattern (simplified) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0045, 0]}>
        <planeGeometry args={[rw * 0.7, rd * 0.7]} />
        <meshLambertMaterial color="#C47A48" />
      </mesh>
    </group>
  );
}

// Window frame on back wall
function WindowOnWall({ wallH, wallW }: { wallH: number; wallW: number }) {
  const winW = 1.2;
  const winH = 1.4;
  const sillY = wallH * 0.38;
  const frameDepth = 0.035;
  const FRAME_C  = '#F0EDE8';
  const GLASS_C  = '#B8D4E8';

  return (
    <group position={[wallW * 0.22, sillY + winH / 2, -0.01]}>
      {/* Glass pane */}
      <mesh>
        <planeGeometry args={[winW, winH]} />
        <meshLambertMaterial color={GLASS_C} transparent opacity={0.35} />
      </mesh>
      {/* Frame top */}
      <mesh position={[0, winH / 2 + frameDepth / 2, 0.01]}>
        <boxGeometry args={[winW + frameDepth * 2, frameDepth, 0.04]} />
        <meshLambertMaterial color={FRAME_C} />
      </mesh>
      {/* Frame bottom */}
      <mesh position={[0, -winH / 2 - frameDepth / 2, 0.01]}>
        <boxGeometry args={[winW + frameDepth * 2, frameDepth, 0.04]} />
        <meshLambertMaterial color={FRAME_C} />
      </mesh>
      {/* Frame left */}
      <mesh position={[-winW / 2 - frameDepth / 2, 0, 0.01]}>
        <boxGeometry args={[frameDepth, winH, 0.04]} />
        <meshLambertMaterial color={FRAME_C} />
      </mesh>
      {/* Frame right */}
      <mesh position={[winW / 2 + frameDepth / 2, 0, 0.01]}>
        <boxGeometry args={[frameDepth, winH, 0.04]} />
        <meshLambertMaterial color={FRAME_C} />
      </mesh>
      {/* Horizontal mid-bar */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[winW, frameDepth * 0.6, 0.04]} />
        <meshLambertMaterial color={FRAME_C} />
      </mesh>
      {/* Vertical mid-bar */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[frameDepth * 0.6, winH, 0.04]} />
        <meshLambertMaterial color={FRAME_C} />
      </mesh>
      {/* Window sill */}
      <mesh position={[0, -winH / 2 - 0.03, 0.06]}>
        <boxGeometry args={[winW + 0.18, 0.04, 0.14]} />
        <meshLambertMaterial color={FRAME_C} />
      </mesh>
    </group>
  );
}

export default function RoomGeometry({ room }: Props) {
  const { width, depth, height, wallColor, floorColor } = room;
  const hw = width  / 2;
  const hd = depth  / 2;

  const TRIM_W   = 0.055;
  const TRIM_H   = 0.14;
  const CROWN_H  = 0.12;
  const CORNER_W = 0.065;

  const WALL_C   = wallColor;
  // Slightly lighter accent for side walls, warmer tone
  const SIDE_WALL_C = '#F0EBE3';
  const TRIM_C   = '#EDE8E0';
  const CROWN_C  = '#F0ECE6';
  const CORNER_C = '#E8E4DC';
  const CEIL_C   = '#F8F5F0';

  return (
    <group>
      {/* ── FLOOR ─────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 0.2, depth + 0.2]} />
        <meshLambertMaterial color={floorColor} />
      </mesh>
      <FloorPlanks width={width} depth={depth} />
      <AreaRug width={width} depth={depth} />

      {/* ── CEILING ───────────────────────────────────────────────── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width + 0.2, depth + 0.2]} />
        <meshLambertMaterial color={CEIL_C} />
      </mesh>

      {/* ── BACK WALL (accent wall — slightly deeper) ──────────────── */}
      <mesh position={[0, height / 2, -hd]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshLambertMaterial color={WALL_C} />
      </mesh>
      <WindowOnWall wallH={height} wallW={width} />

      {/* ── LEFT WALL ─────────────────────────────────────────────── */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-hw, height / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshLambertMaterial color={SIDE_WALL_C} />
      </mesh>

      {/* ── RIGHT WALL ────────────────────────────────────────────── */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[hw, height / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshLambertMaterial color={SIDE_WALL_C} />
      </mesh>

      {/* ── CORNER COLUMNS ────────────────────────────────────────── */}
      {[[-hw,-hd],[hw,-hd],[-hw,hd],[hw,hd]].map(([x,z],i) => (
        <mesh key={i} position={[x, height / 2, z]}>
          <boxGeometry args={[CORNER_W, height, CORNER_W]} />
          <meshLambertMaterial color={CORNER_C} />
        </mesh>
      ))}

      {/* ── BASEBOARDS ────────────────────────────────────────────── */}
      {/* Back */}
      <mesh position={[0, TRIM_H / 2, -hd + TRIM_W / 2]}>
        <boxGeometry args={[width, TRIM_H, TRIM_W]} />
        <meshLambertMaterial color={TRIM_C} />
      </mesh>
      {/* Left */}
      <mesh position={[-hw + TRIM_W / 2, TRIM_H / 2, 0]}>
        <boxGeometry args={[TRIM_W, TRIM_H, depth]} />
        <meshLambertMaterial color={TRIM_C} />
      </mesh>
      {/* Right */}
      <mesh position={[hw - TRIM_W / 2, TRIM_H / 2, 0]}>
        <boxGeometry args={[TRIM_W, TRIM_H, depth]} />
        <meshLambertMaterial color={TRIM_C} />
      </mesh>
      {/* Front */}
      <mesh position={[0, TRIM_H / 2, hd - TRIM_W / 2]}>
        <boxGeometry args={[width, TRIM_H, TRIM_W]} />
        <meshLambertMaterial color={TRIM_C} />
      </mesh>

      {/* ── CROWN MOULDING ────────────────────────────────────────── */}
      {/* Back */}
      <mesh position={[0, height - CROWN_H / 2, -hd + TRIM_W / 2]}>
        <boxGeometry args={[width + CORNER_W * 2, CROWN_H, TRIM_W]} />
        <meshLambertMaterial color={CROWN_C} />
      </mesh>
      {/* Left */}
      <mesh position={[-hw + TRIM_W / 2, height - CROWN_H / 2, 0]}>
        <boxGeometry args={[TRIM_W, CROWN_H, depth]} />
        <meshLambertMaterial color={CROWN_C} />
      </mesh>
      {/* Right */}
      <mesh position={[hw - TRIM_W / 2, height - CROWN_H / 2, 0]}>
        <boxGeometry args={[TRIM_W, CROWN_H, depth]} />
        <meshLambertMaterial color={CROWN_C} />
      </mesh>
      {/* Front */}
      <mesh position={[0, height - CROWN_H / 2, hd - TRIM_W / 2]}>
        <boxGeometry args={[width + CORNER_W * 2, CROWN_H, TRIM_W]} />
        <meshLambertMaterial color={CROWN_C} />
      </mesh>

      {/* ── CEILING CENTRE LIGHT ROSE ─────────────────────────────── */}
      <mesh position={[0, height - 0.005, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.012, 20]} />
        <meshLambertMaterial color="#F0EDE6" />
      </mesh>
      {/* Rose ring detail */}
      <mesh position={[0, height - 0.005, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.006, 20]} />
        <meshLambertMaterial color="#E8E4DC" />
      </mesh>
      {/* Pendant cord */}
      <mesh position={[0, height - 0.34, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.56, 6]} />
        <meshLambertMaterial color="#5A5048" />
      </mesh>
      {/* Pendant shade */}
      <mesh position={[0, height - 0.7, 0]}>
        <cylinderGeometry args={[0.14, 0.09, 0.22, 12]} />
        <meshLambertMaterial color="#C8A870" />
      </mesh>
      {/* Shade inner glow ring */}
      <mesh position={[0, height - 0.825, 0]}>
        <cylinderGeometry args={[0.088, 0.088, 0.01, 12]} />
        <meshLambertMaterial color="#FFECC0" />
      </mesh>
    </group>
  );
}
