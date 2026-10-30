"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { R_PHASE, easeInOut, ecg } from "../rhythm";

const BEATS = 5;
const BEAT_LEN = 9;
const DRAW_S = 2.3;
const NIGHT = "#050b0a";
const MINT = "#6ff2c2";
const CORAL = "#ff7a66";

// The last beat is the big one: the ripple launches from its R peak.
const PEAK_T = (BEATS - 1 + R_PHASE) / BEATS;

// An ECG trace running away from the camera into the fog.
class EcgCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const beat = Math.min(Math.floor(t * BEATS), BEATS - 1);
    const phase = t * BEATS - beat;
    const amp = beat === BEATS - 1 ? 3.4 : 2;
    return target.set(Math.sin(t * Math.PI * 1.4) * 1.4, ecg(phase) * amp, -t * BEATS * BEAT_LEN);
  }
}

// Soft halo: brightest where the tube faces the camera, fading to nothing at
// its silhouette, so stacked halos read as bloom rather than solid bands.
const haloVertex = /* glsl */ `
  varying float vFacing;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vFacing = abs(dot(n, normalize(-mv.xyz)));
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFacing;
  varying float vDepth;
  void main() {
    // Matches the scene fog (6..26) so halos fade into the distance with the core.
    float fog = smoothstep(26.0, 6.0, vDepth);
    gl_FragColor = vec4(uColor, pow(vFacing, 3.0) * uOpacity * fog);
  }
`;

function glowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

type Props = {
  segments: number;
  onPeak: (x: number, y: number) => void;
};

function Trace({ segments, onPeak }: Props) {
  const { camera, size } = useThree();
  const curve = useMemo(() => new EcgCurve(), []);
  // Core + two additive halos stand in for bloom without a postprocessing pass.
  const tubes = useMemo(
    () =>
      [
        { radius: 0.035, color: "#e6fff5", opacity: 1 },
        { radius: 0.14, color: MINT, opacity: 0.55 },
        { radius: 0.45, color: MINT, opacity: 0.16 },
      ].map((t) => ({ ...t, geometry: new THREE.TubeGeometry(curve, segments, t.radius, 8, false) })),
    [curve, segments],
  );
  const texture = useMemo(glowTexture, []);
  const dust = useMemo(() => {
    const n = 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = 6 - Math.random() * (BEATS * BEAT_LEN + 14);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const spark = useRef<THREE.Sprite>(null);
  const start = useRef<number | null>(null);
  const fired = useRef(false);
  const camPos = useRef(new THREE.Vector3(3.4, 1.9, 4.2));
  const look = useRef(new THREE.Vector3(0, 0, -4));
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => tubes.forEach((t) => t.geometry.dispose()), [tubes]);

  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const t = Math.min((clock.elapsedTime - start.current) / DRAW_S, 1);
    const p = easeInOut(t);

    for (const tube of tubes) {
      const perRing = tube.geometry.parameters.radialSegments * 6;
      tube.geometry.setDrawRange(0, Math.floor(p * segments) * perRing);
    }

    const head = curve.getPoint(Math.max(p, 0.0001), tmp);
    if (spark.current) {
      spark.current.position.copy(head);
      // Flares coral on every R peak, then settles back.
      const phase = (p * BEATS) % 1;
      const flare = Math.exp(-((phase - R_PHASE) ** 2) / 0.002);
      spark.current.scale.setScalar(0.9 + flare * 1.6);
      (spark.current.material as THREE.SpriteMaterial).opacity = 0.55 + flare * 0.45;
    }

    // Camera glides alongside the head, ignoring its spikes so it never jitters,
    // and swings round to face the final beat.
    const offset = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(3.4, 1.9, 4.2),
      new THREE.Vector3(4.3, 1.5, 0.6),
      p,
    );
    camPos.current.lerp(new THREE.Vector3(head.x, 0, head.z).add(offset), 0.1);
    look.current.lerp(new THREE.Vector3(head.x, 0.9 + p * 0.9, head.z - 2.5 * (1 - p)), 0.1);
    camera.position.copy(camPos.current);
    camera.lookAt(look.current);

    if (!fired.current && p >= PEAK_T) {
      fired.current = true;
      const apex = curve.getPoint(PEAK_T).project(camera);
      // Keep the ripple's origin well inside the frame so it opens evenly.
      const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
      onPeak(
        clamp((apex.x + 1) / 2, 0.3, 0.7) * size.width,
        clamp((1 - apex.y) / 2, 0.3, 0.65) * size.height,
      );
    }
  });

  return (
    <>
      {tubes.map((t, i) => (
        <mesh key={t.radius} geometry={t.geometry}>
          {i === 0 ? (
            <meshBasicMaterial color={t.color} />
          ) : (
            <shaderMaterial
              vertexShader={haloVertex}
              fragmentShader={haloFragment}
              uniforms={{ uColor: { value: new THREE.Color(t.color) }, uOpacity: { value: t.opacity } }}
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          )}
        </mesh>
      ))}
      <sprite ref={spark}>
        <spriteMaterial map={texture} color={CORAL} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <points geometry={dust}>
        <pointsMaterial color={MINT} size={0.05} transparent opacity={0.45} depthWrite={false} />
      </points>
    </>
  );
}

export default function IntroScene({
  onReady,
  onPeak,
}: {
  onReady: () => void;
  onPeak: (x: number, y: number) => void;
}) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 640;
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: mobile ? 72 : 50, near: 0.1, far: 80, position: [3.4, 1.9, 4.2] }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(NIGHT);
        scene.fog = new THREE.Fog(NIGHT, 6, 26);
        onReady();
      }}
    >
      <Trace segments={mobile ? 1600 : 2600} onPeak={onPeak} />
    </Canvas>
  );
}
