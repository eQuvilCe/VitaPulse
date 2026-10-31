"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { easeInOutSine, ecg, smoothstep } from "../rhythm";

const BEATS = 3;
const BEAT_LEN = 8;
const AMP = 2;
// Height of the letters written at the end of the trace.
const H = 2.4;
const DRAW_S = 4.9;
const HOLD_S = 0.55;
const WARMUP_FRAMES = 3;
// Deep evergreen night; the ripple opens it onto the light page.
const NIGHT = "#0a1c16";
const MINT = "#86dab8";
const GREEN = "#2bb98a";
const CORAL = "#f2704f";

// An ECG trace running away from the camera into the fog.
class EcgCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
    // The spikes are short and steep; sample densely so arc length is right.
    this.arcLengthDivisions = 4000;
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    return target.set(Math.sin(t * Math.PI * 1.2) * 1.2, ecg((t * BEATS) % 1) * AMP, -t * BEATS * BEAT_LEN);
  }
}

function polyline(points: THREE.Vector3[]) {
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 1; i < points.length; i++) path.add(new THREE.LineCurve3(points[i - 1], points[i]));
  return path;
}

type Item = { curve: THREE.Curve<THREE.Vector3>; ink: boolean; from: number; to: number };

// The pen's whole route: the heartbeat, then V, I, T, A written in a plane
// facing the camera at the end of the trace, joined by invisible pen-up glides,
// and a last small beat after the A so the line stays alive.
function route() {
  const ecgCurve = new EcgCurve();
  const end = ecgCurve.getPoint(1);
  const at = (x: number, y: number) => new THREE.Vector3(end.x + 0.8 + x, y, end.z);
  const parts: Array<[THREE.Curve<THREE.Vector3>, boolean]> = [
    [ecgCurve, true],
    [polyline([end, at(0, 0)]), false],
    [polyline([at(0, 0), at(0, H)]), false],
    [polyline([at(0, H), at(0.8, 0), at(1.6, H)]), true],
    [polyline([at(1.6, H), at(2.3, H)]), false],
    [polyline([at(2.3, H), at(2.3, 0)]), true],
    [polyline([at(2.3, 0), at(2.9, H)]), false],
    [polyline([at(2.9, H), at(4.3, H)]), true],
    [polyline([at(4.3, H), at(3.6, H)]), false],
    [polyline([at(3.6, H), at(3.6, 0)]), true],
    [polyline([at(3.6, 0), at(4.7, 0)]), false],
    [
      polyline([
        at(4.7, 0), at(5.5, H), at(6.3, 0), at(7, 0),
        at(7.15, -0.3), at(7.32, 1.3), at(7.5, -0.45), at(7.66, 0), at(8.6, 0),
      ]),
      true,
    ],
  ];

  // Time is shared out by length: the heartbeat flies, pen-up glides are quick
  // and the letters get the most time so they read as handwriting.
  let total = 0;
  const items: Item[] = parts.map(([curve, ink], i) => {
    const from = total;
    total += curve.getLength() * (i === 0 ? 0.5 : ink ? 1 : 0.6);
    return { curve, ink, from, to: total };
  });
  items.forEach((it) => {
    it.from /= total;
    it.to /= total;
  });
  return { items, ecgEnd: items[0].to, center: at(4, H / 2), width: 9.6 };
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
  uniform float uFogNear;
  uniform float uFogFar;
  varying float vFacing;
  varying float vDepth;
  void main() {
    float fog = 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
    gl_FragColor = vec4(uColor, pow(vFacing, 4.0) * uOpacity * fog);
  }
`;

const LAYERS = [
  // Halos get more sides so their silhouettes fade to nothing at any angle.
  { radius: 0.038, color: "#effff8", opacity: 1, radial: 8 },
  { radius: 0.15, color: MINT, opacity: 0.7, radial: 16 },
  { radius: 0.5, color: GREEN, opacity: 0.26, radial: 20 },
];

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
  mobile: boolean;
  onStart: () => void;
  onPeak: (x: number, y: number) => void;
};

function Trace({ mobile, onStart, onPeak }: Props) {
  const { camera, size, scene } = useThree();
  const { items, ecgEnd, center, width } = useMemo(route, []);
  const fogU = useMemo(() => ({ near: { value: 6 }, far: { value: 26 } }), []);

  // Core + two additive halos per inked stroke stand in for bloom.
  const strokes = useMemo(
    () =>
      items
        .filter((it) => it.ink)
        .map((it, si) => {
          const segments = si === 0 ? (mobile ? 1400 : 2400) : Math.ceil(it.curve.getLength() * 40);
          const layers = LAYERS.map((l, i) => ({
            ...l,
            geometry: new THREE.TubeGeometry(it.curve, segments, l.radius, l.radial, false),
            material:
              i === 0
                ? new THREE.MeshBasicMaterial({ color: l.color, transparent: true })
                : new THREE.ShaderMaterial({
                    vertexShader: haloVertex,
                    fragmentShader: haloFragment,
                    uniforms: {
                      uColor: { value: new THREE.Color(l.color) },
                      uOpacity: { value: 0 },
                      uFogNear: fogU.near,
                      uFogFar: fogU.far,
                    },
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                  }),
          }));
          return { item: it, segments, layers };
        }),
    [items, mobile, fogU],
  );
  const texture = useMemo(glowTexture, []);
  const dust = useMemo(() => {
    const n = 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.4) * 34;
      pos[i * 3 + 1] = (Math.random() - 0.45) * 18;
      pos[i * 3 + 2] = 6 - Math.random() * (BEATS * BEAT_LEN + 16);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const spark = useRef<THREE.Sprite>(null);
  const frames = useRef(0);
  const start = useRef<number | null>(null);
  const fired = useRef(false);
  const v = useMemo(
    () => ({
      head: new THREE.Vector3(),
      trail: new THREE.Vector3(),
      offset: new THREE.Vector3(),
      from: new THREE.Vector3(2.7, 1.7, 3.6),
      to: new THREE.Vector3(3.8, 1.35, 0.9),
      followPos: new THREE.Vector3(),
      followLook: new THREE.Vector3(),
      frontPos: new THREE.Vector3(),
      look: new THREE.Vector3(),
    }),
    [],
  );

  useEffect(
    () => () => {
      strokes.forEach((s) =>
        s.layers.forEach((l) => {
          l.geometry.dispose();
          l.material.dispose();
        }),
      );
      dust.dispose();
      texture.dispose();
    },
    [strokes, dust, texture],
  );

  useFrame(({ clock }) => {
    // Warm-up: render a few empty frames so shaders and buffers are ready
    // before anything moves, then start the clock and reveal the canvas.
    if (start.current === null) {
      strokes.forEach((s) => s.layers.forEach((l) => l.geometry.setDrawRange(0, 0)));
      if (++frames.current < WARMUP_FRAMES) return;
      start.current = clock.elapsedTime;
      onStart();
    }
    const elapsed = clock.elapsedTime - start.current;
    const s = easeInOutSine(Math.min(elapsed / DRAW_S, 1));
    // Camera turn from riding the beat to facing the word.
    const turn = smoothstep(ecgEnd - 0.08, ecgEnd + 0.24, s);
    // A gentle swell of light once the word is finished.
    const hold = elapsed > DRAW_S ? Math.sin(Math.min((elapsed - DRAW_S) / HOLD_S, 1) * Math.PI) : 0;
    const breathe = smoothstep(0, 1.4, elapsed) * 0.8;

    let pen = items[items.length - 1];
    for (const it of items) {
      if (s <= it.to) {
        pen = it;
        break;
      }
    }
    pen.curve.getPointAt(Math.min(Math.max((s - pen.from) / (pen.to - pen.from), 0), 1), v.head);

    strokes.forEach(({ item, segments, layers }, si) => {
      const f = Math.min(Math.max((s - item.from) / (item.to - item.from), 0), 1);
      // The heartbeat dims as the camera turns, leaving the word in focus.
      const dim = si === 0 ? 1 - turn * 0.75 : 1;
      layers.forEach((l, i) => {
        l.geometry.setDrawRange(0, Math.floor(f * segments) * l.radial * 6);
        if (i === 0) (l.material as THREE.MeshBasicMaterial).opacity = dim;
        else
          (l.material as THREE.ShaderMaterial).uniforms.uOpacity.value =
            l.opacity * dim * (breathe + smoothstep(ecgEnd * 0.6, 1, s) * 0.35 + hold * 0.6);
      });
    });

    if (spark.current) {
      spark.current.position.copy(v.head);
      const flare = s < ecgEnd ? smoothstep(0.5, 1.8, v.head.y) : 0.25;
      const fade = 1 - smoothstep(DRAW_S, DRAW_S + HOLD_S, elapsed);
      spark.current.scale.setScalar((0.8 + flare * 1.2) * smoothstep(0, 0.9, elapsed) * fade);
      (spark.current.material as THREE.SpriteMaterial).opacity = (0.5 + flare * 0.5) * fade;
    }

    // Ride the beat on a fixed smooth path (no laggy follow), at the line's
    // baseline so spikes never shake the camera...
    const e = Math.min(s / ecgEnd, 1);
    (items[0].curve as EcgCurve).getPointAt(e, v.trail);
    v.offset.lerpVectors(v.from, v.to, smoothstep(0, 1, e));
    v.followPos.set(v.trail.x + v.offset.x, v.offset.y, v.trail.z + v.offset.z);
    v.followLook.set(v.trail.x, 0.45 + e * 0.8, v.trail.z - 2.5 * (1 - e));

    // ...then pull back to face the word, framed to fit any screen shape.
    const cam = camera as THREE.PerspectiveCamera;
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const dist = Math.max(width / 2 / (tanV * cam.aspect), (H * 1.9) / tanV);
    v.frontPos.set(center.x, center.y + 0.3, center.z + dist);

    camera.position.lerpVectors(v.followPos, v.frontPos, turn);
    v.look.lerpVectors(v.followLook, center, turn);
    camera.lookAt(v.look);
    fogU.near.value = THREE.MathUtils.lerp(6, dist + 6, turn);
    fogU.far.value = THREE.MathUtils.lerp(26, dist + 34, turn);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = fogU.near.value;
      scene.fog.far = fogU.far.value;
    }

    if (!fired.current && elapsed >= DRAW_S + HOLD_S * 0.7) {
      fired.current = true;
      const p = center.clone().project(camera);
      onPeak(((p.x + 1) / 2) * size.width, ((1 - p.y) / 2) * size.height);
    }
  });

  return (
    <>
      {strokes.flatMap((s, si) =>
        s.layers.map((l) => <mesh key={`${si}-${l.radius}`} geometry={l.geometry} material={l.material} />),
      )}
      <sprite ref={spark}>
        <spriteMaterial map={texture} color={CORAL} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <points geometry={dust}>
        <pointsMaterial color={MINT} size={0.05} transparent opacity={0.3} depthWrite={false} />
      </points>
    </>
  );
}

export default function IntroScene({ onStart, onPeak }: Omit<Props, "mobile">) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 640;
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: mobile ? 72 : 50, near: 0.1, far: 120, position: [2.7, 1.7, 3.6] }}
      onCreated={({ gl, scene, camera }) => {
        gl.setClearColor(NIGHT);
        scene.fog = new THREE.Fog(NIGHT, 6, 26);
        gl.compile(scene, camera);
      }}
    >
      <Trace mobile={mobile} onStart={onStart} onPeak={onPeak} />
    </Canvas>
  );
}
