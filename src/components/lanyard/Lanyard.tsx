'use client';

/**
 * Lanyard 3D Component
 *
 * Interactive 3D membership card with physics-based lanyard animation.
 * Uses React Three Fiber, Drei, Rapier physics, and MeshLine.
 *
 * IMPORTANT: Uses RenderTexture (not CanvasTexture) for proper texture mapping.
 * This approach renders a 3D scene directly to a texture, avoiding UV mapping issues.
 */

import { useEffect, useRef, useState, useMemo, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, extend, useLoader } from '@react-three/fiber';
import './Lanyard.css';

// WebGL Error Boundary to gracefully handle WebGL context failures
class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a1a',
          color: '#8ab4f8',
          fontSize: '14px',
          padding: '20px',
          textAlign: 'center'
        }}>
          3D content requires WebGL support
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  useGLTF,
  useTexture,
  Environment,
  Lightformer,
  RenderTexture,
  Text,
  PerspectiveCamera,
  OrthographicCamera,
} from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

// Extend THREE with MeshLine classes so they can be used declaratively in JSX
extend({ MeshLineGeometry, MeshLineMaterial });

interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  memberName?: string;
  memberTitle?: string;
  memberImage?: string;
}

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  memberName?: string;
  memberTitle?: string;
  memberImage?: string;
}

// Component that renders the card content inside RenderTexture
interface CardContentProps {
  memberName?: string;
  memberTitle?: string;
  memberImage?: string;
}

// Separate component for member photo to avoid conditional hook
function MemberPhoto({ memberImage }: { memberImage: string }) {
  const texturePath = memberImage.startsWith('http')
    ? `/api/image-proxy?url=${encodeURIComponent(memberImage)}`
    : memberImage;
  const imageTexture = useTexture(texturePath);
  
  return (
    <mesh position={[0, 0, 0.07]}>
      <circleGeometry args={[2.2, 32]} />
      <meshBasicMaterial map={imageTexture} />
    </mesh>
  );
}

function CardContent({ memberName, memberTitle, memberImage }: CardContentProps) {

  /**
   * DEBUG MODE: Set to true to show UV mapping debug markers
   * RED = top boundary, GREEN = center, BLUE = bottom boundary, YELLOW = texture center
   */
  const DEBUG_UV = false; // Disabled - debug markers were verified

  /**
   * ORTHOGRAPHIC CAMERA for 2D badge content (no perspective distortion)
   *
   * UV MAPPING ANALYSIS for card.glb:
   * - UV V range: [0.0022, 0.7572] = only 75.5% of texture is visible
   * - The card shows V from 0.0022 to 0.7572
   * - Visible center V = (0.0022 + 0.7572) / 2 = 0.3797
   *
   * STANDARD RenderTexture mapping (NOT Y-flipped):
   * - World Y=+7 → texture V=1.0 (top of camera = top of texture)
   * - World Y=-7 → texture V=0.0 (bottom of camera = bottom of texture)
   * - World Y=0 → texture V=0.5 (center)
   *
   * Formula: V = 0.5 + (worldY / frustumHeight)
   * To center content at V=0.3797 (visible center):
   * worldY = (V - 0.5) * frustumHeight = (0.3797 - 0.5) * 14 = -1.68
   */

  // Camera frustum defines visible area: 10 units wide, 14 units tall
  const frustumWidth = 10;
  const frustumHeight = 14;

  // UV bounds from card.glb
  const UV_V_MIN = 0.0022;
  const UV_V_MAX = 0.7572;
  const UV_V_CENTER = (UV_V_MIN + UV_V_MAX) / 2; // 0.3797

  /**
   * UV to World Y conversion:
   * V = 0.5 + (worldY / frustumHeight)
   * worldY = (V - 0.5) * frustumHeight
   *
   * For photo to appear at visible center (V=0.3797):
   * Photo world Y should be: (0.3797 - 0.5) * 14 = -1.68
   *
   * But the ENTIRE content group shouldn't shift - only need to ensure
   * photo CENTER aligns with visible UV center.
   *
   * Content layout: Header at +4, Photo at 0, Footer at -4.8
   * Design is asymmetric: more content below photo than above
   * For a REAL BADGE look, photo should be slightly HIGHER than mathematical center
   */

  // UV to World Y conversion: worldY = (0.5 - V) * frustumHeight
  // Because: V = (top - worldY) / frustumHeight = (7 - worldY) / 14
  //          worldY = 7 - V * 14 = (0.5 - V) * 14 + 0 = (0.5 - V) * frustumHeight
  //
  // Card GLB visible range: V_MIN=0.0022 (top) to V_MAX=0.7572 (bottom)
  // Visible center: V_CENTER = 0.3797
  //
  // World Y positions:
  // - V=0.0022 (top of card)    → worldY = (0.5 - 0.0022) * 14 = +6.97
  // - V=0.3797 (visible center) → worldY = (0.5 - 0.3797) * 14 = +1.68
  // - V=0.7572 (bottom of card) → worldY = (0.5 - 0.7572) * 14 = -3.60
  //
  // To center the photo (at local Y=0) at the visible center (worldY=+1.68):
  // Photo worldY = 0 + uvOffsetY = +1.68
  // Therefore: uvOffsetY = +1.68

  const uvVisibleCenterY = (0.5 - UV_V_CENTER) * frustumHeight; // +1.68 (correct!)

  // Content layout: Header at +4, Photo at 0, Footer at -4.8
  // With uvOffsetY = +1.68:
  //   Header worldY = 4 + 1.68 = 5.68 → V = 0.094 (within 0.0022-0.7572) ✓
  //   Photo worldY  = 0 + 1.68 = 1.68 → V = 0.380 (at visible center!) ✓
  //   Footer worldY = -4.8 + 1.68 = -3.12 → V = 0.723 (within 0.0022-0.7572) ✓

  const uvOffsetY = uvVisibleCenterY; // +1.68 - centers photo on the badge

  // Debug: UV center marker position (visible center of card)
  const uvCenterY = uvVisibleCenterY; // +1.68 (visible center at V=0.3797)

  // Debug: UV boundary positions (where card edges are in world Y)
  // Formula: worldY = (0.5 - V) * frustumHeight
  const uvTopY = (0.5 - UV_V_MIN) * frustumHeight;    // V=0.0022 → worldY = +6.97 (top of visible card)
  const uvBottomY = (0.5 - UV_V_MAX) * frustumHeight; // V=0.7572 → worldY = -3.60 (bottom of visible card)

  return (
    <>
      {/* OrthographicCamera for flat 2D rendering - no perspective distortion */}
      <OrthographicCamera
        makeDefault
        position={[0, 0, 10]}
        zoom={1}
        left={-frustumWidth / 2}
        right={frustumWidth / 2}
        top={frustumHeight / 2}
        bottom={-frustumHeight / 2}
        near={0.1}
        far={100}
      />

      {/* Scene background color */}
      <color attach="background" args={['#0a0a1a']} />

      {/* Lighting for the texture scene */}
      <ambientLight intensity={2} />

      {/* DEBUG: UV boundary markers show where card edges map on texture */}
      {DEBUG_UV && (
        <>
          {/* RED: TOP of card visible area (V=0.0022 → worldY=+6.97) */}
          <mesh position={[0, uvTopY, 0.5]}>
            <planeGeometry args={[frustumWidth, 0.3]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>

          {/* GREEN: CENTER of visible card (V=0.3797 → worldY=+1.68) - photo should align here */}
          <mesh position={[0, uvCenterY, 0.5]}>
            <planeGeometry args={[frustumWidth, 0.3]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>

          {/* BLUE: BOTTOM of card visible area (V=0.7572 → worldY=-3.60) */}
          <mesh position={[0, uvBottomY, 0.5]}>
            <planeGeometry args={[frustumWidth, 0.3]} />
            <meshBasicMaterial color="#0000ff" />
          </mesh>

          {/* CYAN: Photo center position (where the photo actually renders) */}
          <mesh position={[0, uvOffsetY, 0.6]}>
            <planeGeometry args={[frustumWidth * 0.4, 0.4]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>

          {/* YELLOW: Texture center (V=0.5, worldY=0) - for reference */}
          <mesh position={[0, 0, 0.4]}>
            <planeGeometry args={[frustumWidth * 0.6, 0.2]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
        </>
      )}

      {/* All content shifted to center in visible UV region */}
      <group position={[0, uvOffsetY, 0]}>
        {/* Background fills entire frustum */}
        <mesh position={[0, 0, -0.5]}>
          <planeGeometry args={[frustumWidth, frustumHeight]} />
          <meshBasicMaterial color="#0d1033" />
        </mesh>

        {/* Card background panel */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[8, 11]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>

        {/* SPAC Header */}
        <Text
          position={[0, 4, 0.1]}
          fontSize={1.2}
          color="#4a90d9"
          anchorX="center"
          anchorY="middle"
        >
          SPAC
        </Text>

        {/* Subtitle */}
        <Text
          position={[0, 3, 0.1]}
          fontSize={0.45}
          color="#8ab4f8"
          anchorX="center"
          anchorY="middle"
        >
          St. Pete Astronomy Club
        </Text>

        {/* Decorative line */}
        <mesh position={[0, 2.4, 0.1]}>
          <planeGeometry args={[6, 0.05]} />
          <meshBasicMaterial color="#4a90d9" />
        </mesh>

        {/* Photo frame background */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[5, 5]} />
          <meshBasicMaterial color="#2a2a4a" />
        </mesh>

        {/* Photo frame border */}
        <mesh position={[0, 0, 0.06]}>
          <ringGeometry args={[2.3, 2.5, 32]} />
          <meshBasicMaterial color="#4a90d9" />
        </mesh>

        {/* Member photo or placeholder */}
        {memberImage ? (
          <Suspense fallback={
            <mesh position={[0, 0, 0.07]}>
              <circleGeometry args={[2.2, 32]} />
              <meshBasicMaterial color="#3a3a5a" />
            </mesh>
          }>
            <MemberPhoto memberImage={memberImage} />
          </Suspense>
        ) : (
          <>
            {/* Placeholder silhouette */}
            <mesh position={[0, 0.3, 0.07]}>
              <circleGeometry args={[0.9, 32]} />
              <meshBasicMaterial color="#3a3a5a" />
            </mesh>
            <mesh position={[0, -1, 0.07]}>
              <circleGeometry args={[1.4, 32, 0, Math.PI]} />
              <meshBasicMaterial color="#3a3a5a" />
            </mesh>
          </>
        )}

        {/* Member Title */}
        <Text
          position={[0, -3, 0.1]}
          fontSize={0.6}
          color="#ffd700"
          anchorX="center"
          anchorY="middle"
        >
          {memberTitle || 'Member'}
        </Text>

        {/* Member Name */}
        <Text
          position={[0, -3.8, 0.1]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {memberName || 'SPAC Member'}
        </Text>

        {/* Footer badge */}
        <mesh position={[0, -4.8, 0.08]}>
          <planeGeometry args={[4, 0.7]} />
          <meshBasicMaterial color="#4a90d9" transparent opacity={0.3} />
        </mesh>
        <Text
          position={[0, -4.8, 0.1]}
          fontSize={0.35}
          color="#8ab4f8"
          anchorX="center"
          anchorY="middle"
        >
          ★ MEMBER ★
        </Text>
      </group>
    </>
  );
}

// Wrapper component that handles loading states
function CardContentWithSuspense(props: CardContentProps) {
  return (
    <Suspense fallback={
      <>
        <OrthographicCamera
          makeDefault
          position={[0, 0, 10]}
          zoom={1}
          left={-5}
          right={5}
          top={7}
          bottom={-7}
          near={0.1}
          far={100}
        />
        <color attach="background" args={['#0a0a1a']} />
        <ambientLight intensity={2} />
        <Text position={[0, -1.68, 0]} fontSize={1} color="#ffffff" anchorX="center" anchorY="middle">
          Loading...
        </Text>
      </>
    }>
      <CardContent {...props} />
    </Suspense>
  );
}

// Extend Three.js with MeshLine types
declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: JSX.IntrinsicElements['mesh'] & { points?: THREE.Vector3[] };
    meshLineMaterial: JSX.IntrinsicElements['material'] & {
      color?: THREE.Color | string;
      depthTest?: boolean;
      resolution?: THREE.Vector2;
      useMap?: boolean;
      map?: THREE.Texture;
      repeat?: THREE.Vector2;
      lineWidth?: number;
    };
  }
}

export default function Lanyard({
  position = [0, 0, 13],
  gravity = [0, -40, 0],
  memberName,
  memberTitle,
  memberImage,
}: LanyardProps) {
  return (
    <div className="lanyard-container" style={{ width: '100%', height: '100%' }}>
      <WebGLErrorBoundary>
        <Canvas camera={{ position, fov: 25 }}>
        <ambientLight intensity={Math.PI} />
        <Physics
          gravity={gravity}
          interpolate
          timeStep={1/60}
        >
          <Band
            memberName={memberName}
            memberTitle={memberTitle}
            memberImage={memberImage}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

function Band({ maxSpeed = 50, minSpeed = 0, memberName, memberTitle, memberImage }: BandProps) {
  const band = useRef<THREE.Mesh>(null);
  const fixed = useRef<any>(null);
  const j1 = useRef<any>(null);
  const j2 = useRef<any>(null);
  const j3 = useRef<any>(null);
  const card = useRef<any>(null);

  // Reusable vectors for calculations
  const vec = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const ang = useMemo(() => new THREE.Vector3(), []);
  const rot = useMemo(() => new THREE.Vector3(), []);

  const segmentProps = {
    type: 'dynamic' as const,
    canSleep: true,
    colliders: false as const,
    angularDamping: 4,
    linearDamping: 4,
  };

  // Load the card model and lanyard texture
  const { nodes, materials } = useGLTF('/lanyard/card.glb') as unknown as {
    nodes: { card: THREE.Mesh; clip?: THREE.Mesh; clamp?: THREE.Mesh };
    materials: { base: THREE.MeshStandardMaterial; metal?: THREE.MeshStandardMaterial };
  };

  const bandTexture = useTexture('/lanyard/spac-lanyard-texture.png');

  // Create curve for the lanyard band
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]), []);

  // Drag state stores Vector3 offset or false
  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);

  // Physics joints
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
    } else {
      document.body.style.cursor = 'auto';
    }
  }, [dragged, hovered]);

  // Set curve type for smooth interpolation
  curve.curveType = 'chordal';

  // Set band texture wrapping
  bandTexture.wrapS = bandTexture.wrapT = THREE.RepeatWrapping;

  useFrame((state, delta) => {
    // Handle dragging with camera unprojection
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));

      // Wake up all physics bodies
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());

      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    // Update band curve with lerped positions for smooth animation
    if (j1.current && j2.current && j3.current && fixed.current) {
      // Initialize lerped positions if not set
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) {
          ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        }
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });

      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());

      if (band.current) {
        (band.current.geometry as InstanceType<typeof MeshLineGeometry>).setPoints(
          curve.getPoints(32)
        );
      }
    }

    // Adjust card angular velocity for smooth swinging
    if (card.current) {
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());

      card.current.setAngvel({
        x: ang.x,
        y: ang.y - rot.y * 0.25,
        z: ang.z,
      });
    }
  });

  // Resolution for MeshLine
  const resolution = useMemo(() => new THREE.Vector2(
    typeof window !== 'undefined' ? window.innerWidth : 1920,
    typeof window !== 'undefined' ? window.innerHeight : 1080
  ), []);

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e: any) => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            {/* Card front with RenderTexture */}
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.5}
              >
                <RenderTexture attach="map" width={2000} height={2000}>
                  <CardContentWithSuspense
                    memberName={memberName}
                    memberTitle={memberTitle}
                    memberImage={memberImage}
                  />
                </RenderTexture>
              </meshPhysicalMaterial>
            </mesh>
            {/* Card back with same RenderTexture */}
            <mesh
              geometry={nodes.card.geometry}
              position={[0, 0, -0.01]}
              rotation={[0, Math.PI, 0]}
            >
              <meshPhysicalMaterial
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.5}
              >
                <RenderTexture attach="map" width={2000} height={2000}>
                  <CardContentWithSuspense
                    memberName={memberName}
                    memberTitle={memberTitle}
                    memberImage={memberImage}
                  />
                </RenderTexture>
              </meshPhysicalMaterial>
            </mesh>
            {/* Clip */}
            {nodes.clip && (
              <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            )}
            {/* Clamp */}
            {nodes.clamp && materials.metal && (
              <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
            )}
          </group>
        </RigidBody>
      </group>

      {/* Lanyard band */}
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={resolution}
          useMap
          map={bandTexture}
          repeat={new THREE.Vector2(-4, 1)}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

// Preload assets
useGLTF.preload('/lanyard/card.glb');
