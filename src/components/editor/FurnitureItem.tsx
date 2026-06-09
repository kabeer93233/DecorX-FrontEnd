import React, { useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { DesignItem } from '../../types/editor';
import { useEditorStore } from '../../store/editorStore';

// ── Real dimensions (W × H × D in metres) ─────────────────────────────────
export const CATEGORY_DIMS: Record<string, [number, number, number]> = {
  sofa:       [2.2,  0.85, 0.95],
  loveseat:   [1.4,  0.85, 0.9],
  chair:      [0.65, 0.85, 0.65],
  table:      [1.2,  0.5,  0.7],
  stool:      [0.45, 0.48, 0.45],
  decoration: [0.35, 1.1,  0.35],
  cabinet:    [1.0,  1.75, 0.42],
};

// ── Detect real furniture type from product name ───────────────────────────
export function getDisplayCategory(productName: string, dbCategory: string): string {
  const n = productName.toLowerCase();
  if (n.includes('armchair') || n.includes('arm chair') || n.includes('accent chair')
      || n.includes('lounge chair') || n.includes('reading chair')) return 'chair';
  if (n.includes('loveseat') || n.includes('love seat') || n.includes('2 seater') || n.includes('two seater')) return 'loveseat';
  if (n.includes('stool') || n.includes('ottoman') || n.includes('pouf') || n.includes('bench')) return 'stool';
  if (n.includes('table') || n.includes('desk') || n.includes('counter') || n.includes('coffee')) return 'table';
  if (n.includes('wardrobe') || n.includes('cabinet') || n.includes('shelf') || n.includes('bookcase') || n.includes('dresser')) return 'cabinet';
  if (n.includes('lamp') || n.includes('plant') || n.includes('vase') || n.includes('decor') || n.includes('rug') || n.includes('cushion')) return 'decoration';
  if (n.includes('sofa') || n.includes('couch') || n.includes('sectional')) return 'sofa';
  return dbCategory.toLowerCase();
}

// ── Deterministic color variant from product id ───────────────────────────
const SOFA_PALETTES = [
  { body: '#7A6858', fabric: '#B89E82', leg: '#3D2A1E' },
  { body: '#5C7A6E', fabric: '#8EB0A8', leg: '#2E3D38' },
  { body: '#7A5860', fabric: '#B89298', leg: '#3D1E24' },
  { body: '#7A7058', fabric: '#B8A882', leg: '#3D3020' },
  { body: '#5C6A7A', fabric: '#8898B0', leg: '#1E2E3D' },
];
const CHAIR_PALETTES = [
  { wood: '#6B5238', fabric: '#9A7A62' },
  { wood: '#2E4A3E', fabric: '#5A8070' },
  { wood: '#4E3A68', fabric: '#7A5A98' },
  { wood: '#5C4830', fabric: '#9A7848' },
];
function nameHash(s: string): number {
  return Math.abs(s.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0));
}

// ── Main component ────────────────────────────────────────────────────────
interface Props { item: DesignItem }

export default function FurnitureItem({ item }: Props) {
  const { selectedItemId, selectItem, setDragItemId } = useEditorStore();
  const isSelected = selectedItemId === item.id;

  const wasSelectedRef = useRef(false);
  const pointerDownPt   = useRef<THREE.Vector3 | null>(null);

  const displayCat = getDisplayCategory(item.productName, item.category);
  const h = nameHash(item.productId + item.productName);

  const handlers = {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      if (e.button !== 0) return;            // ignore right-click / two-finger
      e.stopPropagation();
      wasSelectedRef.current = selectedItemId === item.id;
      pointerDownPt.current  = e.point.clone();
      selectItem(item.id);
      setDragItemId(item.id);
    },
    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      setDragItemId(null);
      // Tap on already-selected item (no drag movement) → deselect
      if (wasSelectedRef.current && pointerDownPt.current) {
        const dist = e.point.distanceTo(pointerDownPt.current);
        if (dist < 0.08) selectItem(null);
      }
      pointerDownPt.current = null;
    },
    onContextMenu: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); },
  };

  return (
    <group position={item.position} rotation={item.rotation}>
      {isSelected && <SelectionRing displayCat={displayCat} />}
      <FurnitureShape displayCat={displayCat} isSelected={isSelected} hash={h} handlers={handlers} />
    </group>
  );
}

// ── Selection ring ────────────────────────────────────────────────────────
function SelectionRing({ displayCat }: { displayCat: string }) {
  const dims = CATEGORY_DIMS[displayCat] ?? [1, 1, 1];
  const r = Math.max(dims[0], dims[2]) / 2 + 0.12;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
      <ringGeometry args={[r - 0.08, r, 40]} />
      <meshBasicMaterial color="#F97316" transparent opacity={0.75} />
    </mesh>
  );
}

// ── Shape dispatcher ──────────────────────────────────────────────────────
interface ShapeProps {
  displayCat: string;
  isSelected: boolean;
  hash: number;
  handlers: any;
}
function FurnitureShape({ displayCat, isSelected, hash, handlers }: ShapeProps) {
  switch (displayCat) {
    case 'sofa':      return <Sofa      sel={isSelected} hash={hash} {...handlers} />;
    case 'loveseat':  return <Loveseat  sel={isSelected} hash={hash} {...handlers} />;
    case 'chair':     return <Chair     sel={isSelected} hash={hash} {...handlers} />;
    case 'table':     return <Table     sel={isSelected} hash={hash} {...handlers} />;
    case 'stool':     return <Stool     sel={isSelected} hash={hash} {...handlers} />;
    case 'cabinet':   return <Cabinet   sel={isSelected} hash={hash} {...handlers} />;
    case 'decoration':return <Decoration sel={isSelected} hash={hash} {...handlers} />;
    default:          return <DefaultBox sel={isSelected} {...handlers} />;
  }
}

type BaseProps = {
  sel: boolean; hash: number;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp:   (e: ThreeEvent<PointerEvent>) => void;
  onContextMenu: (e: ThreeEvent<MouseEvent>) => void;
};

// ── SOFA (3-seat) ─────────────────────────────────────────────────────────
function Sofa({ sel, hash, ...h }: BaseProps) {
  const pal = SOFA_PALETTES[hash % SOFA_PALETTES.length];
  const body   = sel ? '#D4956A' : pal.body;
  const fabric = sel ? '#F0C898' : pal.fabric;
  const leg    = pal.leg;
  return (
    <group {...h}>
      {/* Legs */}
      {([ [-0.95, 0.1], [0.95, 0.1], [-0.95, -0.38], [0.95, -0.38] ] as [number,number][]).map(([x,z],i)=>(
        <mesh key={i} position={[x, 0.07, z]} castShadow><boxGeometry args={[0.08,0.14,0.08]}/><meshLambertMaterial color={leg}/></mesh>
      ))}
      {/* Seat */}
      <mesh position={[0,0.255,0]} castShadow><boxGeometry args={[2.1,0.2,0.88]}/><meshLambertMaterial color={body}/></mesh>
      {/* Cushions */}
      {([-0.65,0,0.65] as number[]).map((x,i)=>(
        <mesh key={i} position={[x,0.39,0.04]} castShadow><boxGeometry args={[0.6,0.11,0.66]}/><meshLambertMaterial color={fabric}/></mesh>
      ))}
      {/* Backrest */}
      <mesh position={[0,0.6,-0.36]} castShadow><boxGeometry args={[2.1,0.42,0.16]}/><meshLambertMaterial color={body}/></mesh>
      {/* Back cushions */}
      {([-0.65,0,0.65] as number[]).map((x,i)=>(
        <mesh key={i} position={[x,0.62,-0.27]} castShadow><boxGeometry args={[0.6,0.32,0.09]}/><meshLambertMaterial color={fabric}/></mesh>
      ))}
      {/* Armrests */}
      {([-1.02,1.02] as number[]).map((x,i)=>(
        <mesh key={i} position={[x,0.48,-0.06]} castShadow><boxGeometry args={[0.12,0.36,0.86]}/><meshLambertMaterial color={body}/></mesh>
      ))}
    </group>
  );
}

// ── LOVESEAT (2-seat) ─────────────────────────────────────────────────────
function Loveseat({ sel, hash, ...h }: BaseProps) {
  const pal = SOFA_PALETTES[(hash + 2) % SOFA_PALETTES.length];
  const body   = sel ? '#D4956A' : pal.body;
  const fabric = sel ? '#F0C898' : pal.fabric;
  const leg    = pal.leg;
  return (
    <group {...h}>
      {([ [-0.58, 0.1], [0.58, 0.1], [-0.58, -0.35], [0.58, -0.35] ] as [number,number][]).map(([x,z],i)=>(
        <mesh key={i} position={[x, 0.07, z]} castShadow><boxGeometry args={[0.07,0.14,0.07]}/><meshLambertMaterial color={leg}/></mesh>
      ))}
      <mesh position={[0,0.25,0]} castShadow><boxGeometry args={[1.26,0.2,0.86]}/><meshLambertMaterial color={body}/></mesh>
      {([-0.3,0.3] as number[]).map((x,i)=>(
        <mesh key={i} position={[x,0.38,0.03]} castShadow><boxGeometry args={[0.56,0.1,0.64]}/><meshLambertMaterial color={fabric}/></mesh>
      ))}
      <mesh position={[0,0.58,-0.34]} castShadow><boxGeometry args={[1.26,0.4,0.14]}/><meshLambertMaterial color={body}/></mesh>
      {([-0.3,0.3] as number[]).map((x,i)=>(
        <mesh key={i} position={[x,0.6,-0.26]} castShadow><boxGeometry args={[0.56,0.3,0.08]}/><meshLambertMaterial color={fabric}/></mesh>
      ))}
      {([-0.66,0.66] as number[]).map((x,i)=>(
        <mesh key={i} position={[x,0.46,-0.05]} castShadow><boxGeometry args={[0.11,0.34,0.84]}/><meshLambertMaterial color={body}/></mesh>
      ))}
    </group>
  );
}

// ── CHAIR ─────────────────────────────────────────────────────────────────
function Chair({ sel, hash, ...h }: BaseProps) {
  const pal = CHAIR_PALETTES[hash % CHAIR_PALETTES.length];
  const wood   = sel ? '#C07840' : pal.wood;
  const fabric = sel ? '#E09868' : pal.fabric;
  return (
    <group {...h}>
      {([ [-0.22,0.22],[0.22,0.22],[-0.22,-0.22],[0.22,-0.22] ] as [number,number][]).map(([x,z],i)=>(
        <mesh key={i} position={[x,0.225,z]} castShadow><boxGeometry args={[0.05,0.45,0.05]}/><meshLambertMaterial color={wood}/></mesh>
      ))}
      <mesh position={[0,0.47,0.02]} castShadow><boxGeometry args={[0.52,0.07,0.48]}/><meshLambertMaterial color={fabric}/></mesh>
      {([-0.18,0,0.18] as number[]).map((x,i)=>(
        <mesh key={i} position={[x,0.73,-0.21]} castShadow><boxGeometry args={[0.04,0.52,0.04]}/><meshLambertMaterial color={wood}/></mesh>
      ))}
      <mesh position={[0,0.97,-0.21]} castShadow><boxGeometry args={[0.52,0.06,0.06]}/><meshLambertMaterial color={wood}/></mesh>
    </group>
  );
}

// ── TABLE ─────────────────────────────────────────────────────────────────
function Table({ sel, hash, ...h }: BaseProps) {
  const tops   = ['#D4A860','#B89A68','#C4B888','#A8886A'];
  const legs_c = ['#8B6848','#6B5038','#8B7848','#685038'];
  const top = sel ? '#E4B868' : tops[hash % tops.length];
  const leg = sel ? '#A07848' : legs_c[hash % legs_c.length];
  return (
    <group {...h}>
      {([ [-0.54,0.3],[0.54,0.3],[-0.54,-0.3],[0.54,-0.3] ] as [number,number][]).map(([x,z],i)=>(
        <mesh key={i} position={[x,0.22,z]} castShadow><boxGeometry args={[0.06,0.44,0.06]}/><meshLambertMaterial color={leg}/></mesh>
      ))}
      <mesh position={[0,0.47,0]} castShadow><boxGeometry args={[1.18,0.05,0.68]}/><meshLambertMaterial color={top}/></mesh>
      <mesh position={[0,0.476,0]}><boxGeometry args={[1.22,0.018,0.72]}/><meshLambertMaterial color={leg}/></mesh>
    </group>
  );
}

// ── STOOL ─────────────────────────────────────────────────────────────────
function Stool({ sel, hash, ...h }: BaseProps) {
  const cols = ['#A07840','#6A8048','#7A5868','#985830'];
  const wood = sel ? '#C09860' : cols[hash % cols.length];
  return (
    <group {...h}>
      {([ [-0.16,0.16],[0.16,0.16],[-0.16,-0.16],[0.16,-0.16] ] as [number,number][]).map(([x,z],i)=>(
        <mesh key={i} position={[x,0.21,z]} castShadow><boxGeometry args={[0.04,0.42,0.04]}/><meshLambertMaterial color={wood}/></mesh>
      ))}
      <mesh position={[0,0.445,0]} castShadow>
        <cylinderGeometry args={[0.21,0.21,0.06,8]}/>
        <meshLambertMaterial color={wood}/>
      </mesh>
    </group>
  );
}

// ── CABINET ───────────────────────────────────────────────────────────────
function Cabinet({ sel, hash, ...h }: BaseProps) {
  const bodies = ['#5A3C2A','#3A4A58','#4A3A58','#384A38'];
  const doors_ = ['#7A5848','#5A6878','#6A5878','#506858'];
  const body   = sel ? '#7A5040' : bodies[hash % bodies.length];
  const door   = sel ? '#9A7060' : doors_[hash % doors_.length];
  const handle = '#C8A870';
  return (
    <group {...h}>
      <mesh position={[0,0.875,0]} castShadow><boxGeometry args={[0.96,1.75,0.38]}/><meshLambertMaterial color={body}/></mesh>
      {([1.28,0.45] as number[]).flatMap((y,row)=>
        ([-0.23,0.23] as number[]).map((x,col)=>(
          <mesh key={`${row}-${col}`} position={[x,y,0.2]} castShadow>
            <boxGeometry args={[0.42,row===0?0.72:0.7,0.025]}/>
            <meshLambertMaterial color={door}/>
          </mesh>
        ))
      )}
      {([1.28,0.45] as number[]).flatMap((y,row)=>
        ([-0.08,0.08] as number[]).map((x,col)=>(
          <mesh key={`h${row}-${col}`} position={[x,y,0.216]}>
            <sphereGeometry args={[0.022,6,6]}/>
            <meshLambertMaterial color={handle}/>
          </mesh>
        ))
      )}
    </group>
  );
}

// ── DECORATION (plant) ────────────────────────────────────────────────────
function Decoration({ sel, hash, ...h }: BaseProps) {
  const pots    = ['#B86838','#5A8848','#887040','#6848A8'];
  const plants  = ['#5A9E4A','#4A7888','#786840','#5858A8'];
  const pot   = sel ? '#D47840' : pots[hash % pots.length];
  const plant = sel ? '#78C870' : plants[hash % plants.length];
  return (
    <group {...h}>
      <mesh position={[0,0.14,0]} castShadow>
        <cylinderGeometry args={[0.12,0.09,0.27,10]}/>
        <meshLambertMaterial color={pot}/>
      </mesh>
      <mesh position={[0,0.28,0]}>
        <cylinderGeometry args={[0.115,0.115,0.018,10]}/>
        <meshLambertMaterial color="#4A3020"/>
      </mesh>
      <mesh position={[0,0.54,0]} castShadow>
        <cylinderGeometry args={[0.022,0.022,0.48,6]}/>
        <meshLambertMaterial color="#3A6020"/>
      </mesh>
      {([[0,0.84,0],[-0.11,0.76,0.04],[0.10,0.77,-0.05]] as [number,number,number][]).map(([x,y,z],i)=>(
        <mesh key={i} position={[x,y,z]} castShadow>
          <sphereGeometry args={[0.15-i*0.015,7,7]}/>
          <meshLambertMaterial color={plant}/>
        </mesh>
      ))}
    </group>
  );
}

function DefaultBox({ sel, ...h }: Omit<BaseProps,'hash'>) {
  return (
    <mesh position={[0,0.5,0]} castShadow {...h}>
      <boxGeometry args={[1,1,1]}/>
      <meshLambertMaterial color={sel?'#F97316':'#C0A888'}/>
    </mesh>
  );
}
