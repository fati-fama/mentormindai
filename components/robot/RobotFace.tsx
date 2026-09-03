"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PURPLE_GLOW, PURPLE_GLOW_SOFT, BLACK_GLASS } from "./robotMaterials";
import type { RobotState } from "./RobotAnimations";

interface RobotFaceProps {
  state: RobotState;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}

function createEyeShape(isLeft: boolean): THREE.Shape {
  const shape = new THREE.Shape();
  const dir = isLeft ? -1 : 1;
  const cx = dir * 0.22;
  shape.moveTo(cx - 0.12, 0);
  shape.quadraticCurveTo(cx, 0.08, cx + 0.12, 0);
  shape.quadraticCurveTo(cx, -0.04, cx - 0.12, 0);
  return shape;
}

function createHappyEyeShape(isLeft: boolean): THREE.Shape {
  const shape = new THREE.Shape();
  const dir = isLeft ? -1 : 1;
  const cx = dir * 0.22;
  shape.moveTo(cx - 0.12, 0);
  shape.quadraticCurveTo(cx, 0.1, cx + 0.12, 0);
  return shape;
}

function createSmileShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.15, 0);
  shape.quadraticCurveTo(0, -0.12, 0.15, 0);
  shape.quadraticCurveTo(0, -0.06, -0.15, 0);
  return shape;
}

function createWinkEyeShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.12, 0);
  shape.lineTo(0.12, 0);
  shape.quadraticCurveTo(0, -0.03, -0.12, 0);
  return shape;
}

export function RobotFace({ state, mousePosition }: RobotFaceProps) {
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const faceGroupRef = useRef<THREE.Group>(null);
  const blinkTimer = useRef(0);
  const blinkState = useRef(0);
  const talkTimer = useRef(0);

  const eyeShape = useMemo(() => createEyeShape(true), []);
  const eyeShapeR = useMemo(() => createEyeShape(false), []);
  const happyEyeShapeL = useMemo(() => createHappyEyeShape(true), []);
  const happyEyeShapeR = useMemo(() => createHappyEyeShape(false), []);
  const smileShape = useMemo(() => createSmileShape(), []);
  const winkShape = useMemo(() => createWinkEyeShape(), []);

  const eyeGeo = useMemo(
    () => new THREE.ShapeGeometry(eyeShape, 16),
    [eyeShape]
  );
  const eyeGeoR = useMemo(
    () => new THREE.ShapeGeometry(eyeShapeR, 16),
    [eyeShapeR]
  );
  const happyEyeGeoL = useMemo(
    () => new THREE.ShapeGeometry(happyEyeShapeL, 16),
    [happyEyeShapeL]
  );
  const happyEyeGeoR = useMemo(
    () => new THREE.ShapeGeometry(happyEyeShapeR, 16),
    [happyEyeShapeR]
  );
  const smileGeo = useMemo(
    () => new THREE.ShapeGeometry(smileShape, 16),
    [smileShape]
  );
  const winkGeo = useMemo(
    () => new THREE.ShapeGeometry(winkShape, 16),
    [winkShape]
  );

  const eyeMat = useMemo(
    () => new THREE.MeshStandardMaterial(PURPLE_GLOW),
    []
  );
  const mouthMat = useMemo(
    () => new THREE.MeshStandardMaterial(PURPLE_GLOW_SOFT),
    []
  );

  useFrame((_, delta) => {
    if (!leftEyeRef.current || !rightEyeRef.current || !mouthRef.current) return;

    blinkTimer.current += delta;
    if (blinkTimer.current > 3 + Math.random() * 2) {
      blinkState.current = 1;
      blinkTimer.current = 0;
    }
    if (blinkState.current > 0) {
      blinkState.current -= delta * 8;
      if (blinkState.current < 0) blinkState.current = 0;
    }

    const blinkScale = state === "wink" ? 0.1 : 1 - blinkState.current * 0.9;
    const isHappy = state === "happy" || state === "success" || state === "greeting";

    if (state === "wink") {
      leftEyeRef.current.scale.y = 1;
      rightEyeRef.current.scale.y = 0.1;
    } else {
      leftEyeRef.current.scale.y = blinkScale;
      rightEyeRef.current.scale.y = blinkScale;
    }

    if (isHappy) {
      leftEyeRef.current.geometry = happyEyeGeoL;
      rightEyeRef.current.geometry = happyEyeGeoR;
    } else {
      leftEyeRef.current.geometry = eyeGeo;
      rightEyeRef.current.geometry = eyeGeoR;
    }

    if (state === "talking") {
      talkTimer.current += delta * 6;
      const talkOpen = Math.abs(Math.sin(talkTimer.current)) * 0.6 + 0.4;
      mouthRef.current.scale.set(1, talkOpen, 1);
    } else if (state === "thinking") {
      mouthRef.current.scale.set(0.7, 0.5, 1);
      mouthRef.current.position.x = 0.05;
    } else if (isHappy) {
      mouthRef.current.scale.set(1.2, 1.3, 1);
      mouthRef.current.position.x = 0;
    } else {
      mouthRef.current.scale.set(1, 1, 1);
      mouthRef.current.position.x = 0;
    }

    if (faceGroupRef.current) {
      const targetX = mousePosition.current.x * 0.05;
      const targetY = mousePosition.current.y * 0.03;
      faceGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        faceGroupRef.current.rotation.y,
        targetX,
        delta * 3
      );
      faceGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        faceGroupRef.current.rotation.x,
        -targetY,
        delta * 3
      );
    }

    if (state === "thinking" && faceGroupRef.current) {
      faceGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        faceGroupRef.current.rotation.z,
        0.1,
        delta * 2
      );
    } else if (faceGroupRef.current) {
      faceGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        faceGroupRef.current.rotation.z,
        0,
        delta * 3
      );
    }
  });

  return (
    <group ref={faceGroupRef} position={[0, 0, 0.42]}>
      {/* Black glass face plate */}
      <RoundedBox args={[0.85, 0.65, 0.08]} radius={0.08} smoothness={4} position={[0, 0, -0.02]}>
        <meshPhysicalMaterial {...BLACK_GLASS} />
      </RoundedBox>

      {/* Left eye */}
      <mesh ref={leftEyeRef} geometry={eyeGeo} material={eyeMat} position={[-0.22, 0.06, 0.03]} />

      {/* Right eye */}
      <mesh ref={rightEyeRef} geometry={eyeGeoR} material={eyeMat} position={[0.22, 0.06, 0.03]} />

      {/* Mouth */}
      <mesh ref={mouthRef} geometry={smileGeo} material={mouthMat} position={[0, -0.12, 0.03]} />
    </group>
  );
}
