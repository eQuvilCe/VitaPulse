"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RIPPLE_EVENT } from "../rhythm";

// A breathing field of particles. Every second (60 BPM) a soft beat rolls
// outwards from the centre; the cursor gently lifts the field; the intro's
// final ripple continues here as one big wave.
const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec3 uRipple; // xy = origin in field space, z = start time
  varying float vGlow;
  varying float vDepth;

  float beat(float t) {
    float f = fract(t);
    return exp(-f * 7.0) + 0.45 * exp(-pow(f - 0.22, 2.0) * 180.0);
  }

  void main() {
    vec3 p = position;
    float d = length(p.xz);
    float breathe = sin(p.x * 0.32 + uTime * 0.6) * 0.32 + cos(p.z * 0.4 - uTime * 0.45) * 0.24;
    float pulse = beat(uTime - d * 0.09) * 0.9 * exp(-d * 0.07);
    float m = exp(-pow(length(p.xz - uMouse), 2.0) * 0.1) * 1.3;
    float rt = uTime - uRipple.z;
    float rd = length(p.xz - uRipple.xy);
    float ripple = rt > 0.0 ? exp(-pow(rd - rt * 9.0, 2.0) * 0.5) * exp(-rt * 0.9) * 1.6 : 0.0;
    p.y += breathe + pulse + m + ripple;
    vGlow = clamp(0.45 + pulse * 1.2 + m * 0.7 + ripple, 0.0, 1.8);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_PointSize = (3.6 + vGlow * 3.2) * (16.0 / vDepth);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  varying float vGlow;
  varying float vDepth;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(c));
    float fog = smoothstep(36.0, 6.0, vDepth);
    vec3 mint = vec3(0.435, 0.949, 0.761);
    gl_FragColor = vec4(mint * (0.6 + vGlow * 0.6), a * fog * (0.35 + vGlow * 0.5));
  }
`;

function Field({ cols, rows, still }: { cols: number; rows: number; still: boolean }) {
  const { camera, size, pointer } = useThree();
  const geometry = useMemo(() => {
    const pos = new Float32Array(cols * rows * 3);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        pos[i++] = (c / (cols - 1) - 0.5) * 44;
        pos[i++] = 0;
        pos[i++] = (r / (rows - 1) - 0.5) * 30 - 6;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [cols, rows]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 40) },
      uRipple: { value: new THREE.Vector3(0, 0, -100) },
    }),
    [],
  );
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const mouse = useRef(new THREE.Vector2(0, 40));
  const pendingRipple = useRef<THREE.Vector2 | null>(null);

  // Screen point -> field coordinates on the y = 0 plane.
  const toField = (ndcX: number, ndcY: number) => {
    ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    return ray.ray.intersectPlane(plane, hit) ? new THREE.Vector2(hit.x, hit.z) : null;
  };

  useEffect(() => {
    const onRipple = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      // Started on the next frame, so a paused field picks up the wave on wake.
      pendingRipple.current =
        toField((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1) ?? new THREE.Vector2(0, -4);
    };
    window.addEventListener(RIPPLE_EVENT, onRipple);
    return () => window.removeEventListener(RIPPLE_EVENT, onRipple);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, uniforms]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    if (!still) uniforms.uTime.value = clock.elapsedTime;
    if (pendingRipple.current) {
      const r = pendingRipple.current;
      uniforms.uRipple.value.set(r.x, r.y, uniforms.uTime.value);
      pendingRipple.current = null;
    }
    const f = toField(pointer.x, pointer.y);
    if (f) mouse.current.lerp(f, 0.06);
    uniforms.uMouse.value.copy(mouse.current);
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function HeroField() {
  const mobile = typeof window !== "undefined" && window.innerWidth < 640;
  const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Stay paused under the intro (one WebGL scene at a time); wake on its ripple.
  const [awake, setAwake] = useState(
    () => typeof document === "undefined" || !document.documentElement.classList.contains("intro-pending"),
  );
  useEffect(() => {
    const wake = () => setAwake(true);
    window.addEventListener(RIPPLE_EVENT, wake);
    return () => window.removeEventListener(RIPPLE_EVENT, wake);
  }, []);
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={still ? "demand" : awake ? "always" : "never"}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 50, near: 0.1, far: 60, position: [0, 5, 13] }}
      onCreated={({ camera }) => camera.lookAt(0, 1.2, -6)}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      <Field cols={mobile ? 70 : 150} rows={mobile ? 50 : 90} still={still} />
    </Canvas>
  );
}
