"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { R_PHASE, easeInOutSine, ecg, smoothstep } from "../rhythm";

const BEATS = 5;
const BEAT_LEN = 9;
const DRAW_S = 2.6;
const WARMUP_FRAMES = 3;
const NIGHT = "#17121e";
const PEACH = "#ffb48f";
const CORAL = "#f47b63";

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
  onStart: () => void;
  onPeak: (x: number, y: number) => void;
};

function Trace({ segments, onStart, onPeak }: Props) {
  const { camera, size } = useThree();
  const curve = useMemo(() => new EcgCurve(), []);
  // Core + two additive halos stand in for bloom without a postprocessing pass.
  const tubes = useMemo(
    () =>
      [
        { radius: 0.035, color: "#fff4ec", opacity: 1 },
        { radius: 0.14, color: PEACH, opacity: 0.6 },
        { radius: 0.48, color: CORAL, opacity: 0.18 },
      ].map((t, i) => ({
        ...t,
        geometry: new THREE.TubeGeometry(curve, segments, t.radius, 8, false),
        material:
          i === 0
            ? new THREE.MeshBasicMaterial({ color: t.color })
            : new THREE.ShaderMaterial({
                vertexShader: haloVertex,
                fragmentShader: haloFragment,
                uniforms: { uColor: { value: new THREE.Color(t.color) }, uOpacity: { value: 0 } },
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              }),
      })),
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
  const frames = useRef(0);
  const start = useRef<number | null>(null);
  const fired = useRef(false);
  const head = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);
  const from = useMemo(() => new THREE.Vector3(2.7, 1.7, 3.6), []);
  const to = useMemo(() => new THREE.Vector3(3.8, 1.35, 0.9), []);

  useEffect(
    () => () =>
      tubes.forEach((t) => {
        t.geometry.dispose();
        t.material.dispose();
      }),
    [tubes],
  );

  useFrame(({ clock }) => {
    // Warm-up: render a few empty frames so shaders and buffers are ready
    // before anything moves, then start the clock and reveal the canvas.
    if (start.current === null) {
      tubes.forEach((t) => t.geometry.setDrawRange(0, 0));
      if (++frames.current < WARMUP_FRAMES) return;
      start.current = clock.elapsedTime;
      onStart();
    }
    const elapsed = clock.elapsedTime - start.current;
    const t = Math.min(elapsed / DRAW_S, 1);
    const p = easeInOutSine(t);

    tubes.forEach((tube, i) => {
      const perRing = tube.geometry.parameters.radialSegments * 6;
      tube.geometry.setDrawRange(0, Math.floor(p * segments) * perRing);
      // Glow breathes in over the first half second and swells into the peak.
      const halo = i > 0 ? (tube.material as THREE.ShaderMaterial) : null;
      if (halo) halo.uniforms.uOpacity.value = tube.opacity * (smoothstep(0, 0.6, elapsed) * 0.8 + smoothstep(0.7, PEAK_T, p) * 0.5);
    });

    curve.getPoint(Math.max(p, 0.0001), head);
    if (spark.current) {
      spark.current.position.copy(head);
      const phase = (p * BEATS) % 1;
      const flare = Math.exp(-((phase - R_PHASE) ** 2) / 0.003);
      spark.current.scale.setScalar((0.8 + flare * 1.4) * smoothstep(0, 0.4, elapsed));
      (spark.current.material as THREE.SpriteMaterial).opacity = 0.5 + flare * 0.5;
    }

    // Camera rides a fixed smooth path derived from p (no laggy follow), at
    // the line's baseline so spikes never shake it.
    offset.lerpVectors(from, to, smoothstep(0, 1, p));
    camera.position.set(head.x + offset.x, offset.y, head.z + offset.z);
    camera.lookAt(head.x, 0.45 + p * 0.8, head.z - 2.5 * (1 - p));

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
      {tubes.map((t) => (
        <mesh key={t.radius} geometry={t.geometry} material={t.material} />
      ))}
      <sprite ref={spark}>
        <spriteMaterial map={texture} color={CORAL} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <points geometry={dust}>
        <pointsMaterial color={PEACH} size={0.05} transparent opacity={0.35} depthWrite={false} />
      </points>
    </>
  );
}

export default function IntroScene({
  onStart,
  onPeak,
}: {
  onStart: () => void;
  onPeak: (x: number, y: number) => void;
}) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 640;
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: mobile ? 72 : 50, near: 0.1, far: 80, position: [2.7, 1.7, 3.6] }}
      onCreated={({ gl, scene, camera }) => {
        gl.setClearColor(NIGHT);
        scene.fog = new THREE.Fog(NIGHT, 6, 26);
        gl.compile(scene, camera);
      }}
    >
      <Trace segments={mobile ? 1600 : 2600} onStart={onStart} onPeak={onPeak} />
    </Canvas>
  );
}
