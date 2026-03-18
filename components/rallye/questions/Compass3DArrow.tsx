/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import type {
  ExtrudeGeometryOptions,
  Group,
  Shape,
} from 'three';

// Match @react-three/fiber/native's CommonJS resolution to avoid
// Metro loading both the CJS and ESM Three.js builds.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const THREE: typeof import('three') = require('three');

type RendererProps = NonNullable<ConstructorParameters<typeof THREE.WebGLRenderer>[0]>;
type ExpoGlContext = WebGLRenderingContext & {
  __campusRallyePixelStoreiPatched?: boolean;
};
type ExpoCanvas = RendererProps['canvas'] & {
  __campusRallyeGetContextPatched?: boolean;
  getContext: (contextId?: string, contextAttributes?: { antialias?: boolean }) => ExpoGlContext;
};

const UNSUPPORTED_EXPO_PIXEL_STORE_PARAMS = new Set([
  0x9241, // UNPACK_PREMULTIPLY_ALPHA_WEBGL
  0x9243, // UNPACK_COLORSPACE_CONVERSION_WEBGL
]);

function patchExpoGlContext(glContext: ExpoGlContext) {
  if (glContext.__campusRallyePixelStoreiPatched) return;

  const originalPixelStorei = glContext.pixelStorei.bind(glContext);

  glContext.pixelStorei = ((pname: number, param: number) => {
    // Expo GL currently ignores these unpack flags and logs a warning for each call.
    if (UNSUPPORTED_EXPO_PIXEL_STORE_PARAMS.has(pname)) return;
    originalPixelStorei(pname, param);
  }) as typeof glContext.pixelStorei;

  glContext.__campusRallyePixelStoreiPatched = true;
}

function createExpoRenderer(defaultProps: RendererProps) {
  const canvas = defaultProps.canvas as ExpoCanvas;

  if (!canvas.__campusRallyeGetContextPatched) {
    const originalGetContext = canvas.getContext.bind(canvas);

    canvas.getContext = ((contextId?: string, contextAttributes?: { antialias?: boolean }) => {
      const glContext = originalGetContext(contextId, contextAttributes);
      patchExpoGlContext(glContext);
      return glContext;
    }) as ExpoCanvas['getContext'];

    canvas.__campusRallyeGetContextPatched = true;
  }

  return new THREE.WebGLRenderer(defaultProps);
}

// -- Types -------------------------------------------------------------------

interface Props {
  /** Mutable ref holding the continuous compass angle in degrees. */
  angleRef: React.MutableRefObject<number>;
  /** Mutable ref holding device pitch in degrees (forward/back tilt). */
  tiltXRef: React.MutableRefObject<number>;
  /** Mutable ref holding device roll in degrees (left/right tilt). */
  tiltYRef: React.MutableRefObject<number>;
}

// -- Chevron shape (same silhouette as the SVG arrow) ------------------------

/**
 * Builds the same chevron outline as the original SVG.
 *
 * SVG coordinates (120×140 viewBox):
 *   Tip        (60, 10)
 *   Right wing (108, 85)
 *   Notch      (60, 68)
 *   Left wing  (12, 85)
 *
 * Normalized to a ~1.3-unit-tall shape centered on origin.
 */
function createChevronShape(): Shape {
  // Scale factor chosen so the shape fills ~1.3 world units tall
  const s = 1.3 / 75;
  const cx = 60;
  const cy = 47.5;

  const toX = (svgX: number) => (svgX - cx) * s * 0.81;
  const toY = (svgY: number) => -(svgY - cy) * s;

  // Corner points
  const tip = { x: toX(60), y: toY(10) };
  const rWing = { x: toX(108), y: toY(85) };
  const notch = { x: toX(60), y: toY(68) };
  const lWing = { x: toX(12), y: toY(85) };

  // Rounding radius (in world units) — how far from each corner the curve starts
  const r = 0.12;

  // Helper: get a point that is `dist` along the line from `a` toward `b`
  const toward = (a: { x: number; y: number }, b: { x: number; y: number }, dist: number) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const t = dist / len;
    return { x: a.x + dx * t, y: a.y + dy * t };
  };

  const shape = new THREE.Shape();

  // Start near the tip, offset toward left wing
  const tipFromL = toward(tip, lWing, r);
  shape.moveTo(tipFromL.x, tipFromL.y);

  // Round tip corner → then line to right wing approach
  const tipToR = toward(tip, rWing, r);
  shape.quadraticCurveTo(tip.x, tip.y, tipToR.x, tipToR.y);

  // Line to right wing approach, then round right wing corner
  const rWingFromTip = toward(rWing, tip, r);
  shape.lineTo(rWingFromTip.x, rWingFromTip.y);
  const rWingToNotch = toward(rWing, notch, r);
  shape.quadraticCurveTo(rWing.x, rWing.y, rWingToNotch.x, rWingToNotch.y);

  // Line to notch approach, then round notch corner
  const notchFromR = toward(notch, rWing, r);
  shape.lineTo(notchFromR.x, notchFromR.y);
  const notchToL = toward(notch, lWing, r);
  shape.quadraticCurveTo(notch.x, notch.y, notchToL.x, notchToL.y);

  // Line to left wing approach, then round left wing corner
  const lWingFromNotch = toward(lWing, notch, r);
  shape.lineTo(lWingFromNotch.x, lWingFromNotch.y);
  const lWingToTip = toward(lWing, tip, r);
  shape.quadraticCurveTo(lWing.x, lWing.y, lWingToTip.x, lWingToTip.y);

  // Close back to start (near tip)
  shape.lineTo(tipFromL.x, tipFromL.y);

  return shape;
}

/** Clamp a number to a range. */
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

// -- Arrow mesh --------------------------------------------------------------

function ArrowMesh({ angleRef, tiltXRef, tiltYRef }: Props) {
  const groupRef = useRef<Group>(null);
  const initialized = useRef(false);
  // Smoothed tilt values for level compensation
  const smoothPitch = useRef(0);
  const smoothRoll = useRef(0);

  // Build geometry once
  const geometry = useMemo(() => {
    const shape = createChevronShape();
    const extrudeSettings: ExtrudeGeometryOptions = {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.10,
      bevelSize: 0.08,
      bevelSegments: 10,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center the extrusion on Z so it's symmetric
    geo.translate(0, 0, -0.09);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Single material for the entire mesh — the 3D lighting + bevel create
  // natural shading differences between the flat faces and rounded edges.
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#E53935',
        metalness: 0.3,
        roughness: 0.45,
        emissive: '#B71C1C',
        emissiveIntensity: 0.15,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const target = -(angleRef.current * Math.PI) / 180;
    const factor = 1 - Math.exp(-6 * delta);

    if (!initialized.current) {
      groupRef.current.rotation.y = target;
      smoothPitch.current = tiltXRef.current;
      smoothRoll.current = tiltYRef.current;
      initialized.current = true;
      return;
    }

    // Compass heading rotation
    groupRef.current.rotation.y +=
      (target - groupRef.current.rotation.y) * factor;

    // Compensate device tilt so the arrow stays level with the ground.
    // Apply inverse pitch (X) and roll (Z) to counter the phone's orientation.
    smoothPitch.current += (tiltXRef.current - smoothPitch.current) * factor;
    smoothRoll.current += (tiltYRef.current - smoothRoll.current) * factor;

    const pitchRad = clamp(smoothPitch.current, -20, 20) * (Math.PI / 180);
    const rollRad = clamp(smoothRoll.current, -20, 20) * (Math.PI / 180);

    groupRef.current.rotation.x = -pitchRad;
    groupRef.current.rotation.z = rollRad;
  });

  return (
    <group ref={groupRef}>
      {/* Lay the chevron flat in the XZ plane so it points "forward" */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={geometry} material={material} castShadow />
      </group>
    </group>
  );
}

// -- Camera rig that responds to device tilt ---------------------------------

function TiltCamera({ tiltXRef, tiltYRef }: Pick<Props, 'tiltXRef' | 'tiltYRef'>) {
  const initialized = useRef(false);
  const smoothX = useRef(0);
  const smoothY = useRef(0);

  useFrame(({ camera }, delta) => {
    if (!initialized.current) {
      smoothX.current = tiltXRef.current;
      smoothY.current = tiltYRef.current;
      initialized.current = true;
    }

    // Exponentially smooth the tilt values for fluid motion
    const factor = 1 - Math.exp(-5 * delta);
    smoothX.current += (tiltXRef.current - smoothX.current) * factor;
    smoothY.current += (tiltYRef.current - smoothY.current) * factor;

    // Convert clamped tilt degrees to camera orbital offset
    const pitchRad = clamp(smoothX.current, -50, 50) * (Math.PI / 180) * 0.35;
    const rollRad = clamp(smoothY.current, -50, 50) * (Math.PI / 180) * 0.35;

    // Base camera position: slightly above, looking down at arrow
    const baseY = 2.6;
    const baseZ = 2.4;

    // Orbit the camera around the arrow based on device tilt
    camera.position.set(
      Math.sin(rollRad) * baseZ,
      baseY - Math.sin(pitchRad) * 0.8,
      Math.cos(rollRad) * baseZ * Math.cos(pitchRad * 0.5),
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// -- Exported canvas component -----------------------------------------------

export default function Compass3DArrow({ angleRef, tiltXRef, tiltYRef }: Props) {
  return (
    <Canvas
      style={{ width: 200, height: 200 }}
      camera={{ position: [0, 2.6, 2.4], fov: 40 }}
      gl={createExpoRenderer}
      shadows="percentage"
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      {/* Ambient fill */}
      <ambientLight intensity={0.6} />

      {/* Key light from upper-right — lit right wing + casts shadow */}
      <directionalLight
        position={[4, 5, 3]}
        intensity={1.3}
        color="#FFF5F0"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      {/* Fill light from lower-left — subtle cool tone */}
      <directionalLight position={[-3, 1, -2]} intensity={0.35} color="#90CAF9" />

      {/* Rim light from behind */}
      <directionalLight position={[0, 2, -4]} intensity={0.2} />

      <TiltCamera tiltXRef={tiltXRef} tiltYRef={tiltYRef} />
      <ArrowMesh angleRef={angleRef} tiltXRef={tiltXRef} tiltYRef={tiltYRef} />

      {/* Invisible ground plane that receives the arrow's shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
    </Canvas>
  );
}
