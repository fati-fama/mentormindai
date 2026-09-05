"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  WHITE_SHELL,
  PURPLE_METAL,
  PURPLE_JOINT,
  BLACK_GLASS,
  PURPLE_GLOW,
  PURPLE_GLOW_SOFT,
  ANTENNA_TIP,
  CHEST_EMBLEM,
} from "@/components/robot/robotMaterials";
import { RobotHand, type HandPose } from "@/components/robot/RobotHand";
import {
  useAvatarRobotAnimation,
  type AvatarRobotState,
  type AnimationTargets,
} from "./RobotAnimations";

function lerp(current: number, target: number, speed: number, delta: number): number {
  return THREE.MathUtils.lerp(current, target, Math.min(1, speed * delta));
}

function createHappyEyeShape(isLeft: boolean): THREE.Shape {
  const shape = new THREE.Shape();
  const dir = isLeft ? -1 : 1;
  const cx = dir * 0.2;
  shape.moveTo(cx - 0.11, 0);
  shape.quadraticCurveTo(cx, 0.12, cx + 0.11, 0);
  return shape;
}

function createSmileShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.13, 0);
  shape.quadraticCurveTo(0, -0.1, 0.13, 0);
  shape.quadraticCurveTo(0, -0.05, -0.13, 0);
  return shape;
}

function Face({
  state,
  mousePosition,
}: {
  state: AvatarRobotState;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const leftEyeGroupRef = useRef<THREE.Group>(null);
  const rightEyeGroupRef = useRef<THREE.Group>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const faceGroupRef = useRef<THREE.Group>(null);
  const blinkTimer = useRef(0);
  const blinkState = useRef(0);
  const talkTimer = useRef(0);

  const happyEyeShapeL = useMemo(() => createHappyEyeShape(true), []);
  const happyEyeShapeR = useMemo(() => createHappyEyeShape(false), []);
  const smileShape = useMemo(() => createSmileShape(), []);

  const happyEyeGeoL = useMemo(
    () => new THREE.ShapeGeometry(happyEyeShapeL, 16),
    [happyEyeShapeL],
  );
  const happyEyeGeoR = useMemo(
    () => new THREE.ShapeGeometry(happyEyeShapeR, 16),
    [happyEyeShapeR],
  );
  const smileGeo = useMemo(() => new THREE.ShapeGeometry(smileShape, 16), [smileShape]);

  const scleraMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.2, metalness: 0 }),
    [],
  );
  const pupilMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1a1a2e", roughness: 0.3, metalness: 0 }),
    [],
  );
  const catchlightMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0, metalness: 0, emissive: "#ffffff", emissiveIntensity: 0.3 }),
    [],
  );
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial(PURPLE_GLOW_SOFT), []);
  const happyEyeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a1a2e", roughness: 0.3 }), []);

  const eyeRadius = 0.1;
  const pupilRadius = 0.055;
  const catchlightRadius = 0.02;

  useFrame((_, delta) => {
    if (!mouthRef.current) return;

    blinkTimer.current += delta;
    if (blinkTimer.current > 2.5 + Math.random() * 2) {
      blinkState.current = 1;
      blinkTimer.current = 0;
    }
    if (blinkState.current > 0) {
      blinkState.current -= delta * 8;
      if (blinkState.current < 0) blinkState.current = 0;
    }

    const blinkScale = 1 - blinkState.current * 0.9;
    const isHappy = state === "happy" || state === "greeting";

    if (leftEyeGroupRef.current && rightEyeGroupRef.current) {
      leftEyeGroupRef.current.scale.y = blinkScale;
      rightEyeGroupRef.current.scale.y = blinkScale;
    }

    if (leftPupilRef.current && rightPupilRef.current) {
      const lookX = mousePosition.current.x * 0.015;
      const lookY = mousePosition.current.y * 0.01;
      leftPupilRef.current.position.x = lookX;
      leftPupilRef.current.position.y = lookY;
      rightPupilRef.current.position.x = lookX;
      rightPupilRef.current.position.y = lookY;
    }

    if (state === "speaking") {
      talkTimer.current += delta * 7;
      const talkOpen = Math.abs(Math.sin(talkTimer.current)) * 0.5 + 0.5;
      mouthRef.current.scale.set(1, talkOpen, 1);
    } else if (state === "thinking") {
      mouthRef.current.scale.set(0.6, 0.4, 1);
      mouthRef.current.position.x = 0.04;
    } else if (isHappy) {
      mouthRef.current.scale.set(1.3, 1.4, 1);
      mouthRef.current.position.x = 0;
    } else {
      mouthRef.current.scale.set(1, 1, 1);
      mouthRef.current.position.x = 0;
    }

    if (faceGroupRef.current) {
      const targetX = mousePosition.current.x * 0.06;
      const targetY = mousePosition.current.y * 0.04;
      faceGroupRef.current.rotation.y = lerp(
        faceGroupRef.current.rotation.y,
        targetX,
        3,
        delta,
      );
      faceGroupRef.current.rotation.x = lerp(
        faceGroupRef.current.rotation.x,
        -targetY,
        3,
        delta,
      );
    }

    if (state === "thinking" && faceGroupRef.current) {
      faceGroupRef.current.rotation.z = lerp(faceGroupRef.current.rotation.z, 0.12, 2, delta);
    } else if (faceGroupRef.current) {
      faceGroupRef.current.rotation.z = lerp(faceGroupRef.current.rotation.z, 0, 3, delta);
    }
  });

  const isHappy = state === "happy" || state === "greeting";

  return (
    <group ref={faceGroupRef} position={[0, 0, 0.4]}>
      <RoundedBox args={[0.8, 0.6, 0.06]} radius={0.07} smoothness={4} position={[0, 0, -0.01]}>
        <meshPhysicalMaterial {...BLACK_GLASS} />
      </RoundedBox>

      {/* Left eye */}
      <group ref={leftEyeGroupRef} position={[-0.2, 0.06, 0.025]}>
        {isHappy ? (
          <mesh geometry={happyEyeGeoL} material={happyEyeMat} />
        ) : (
          <>
            <mesh material={scleraMat}>
              <circleGeometry args={[eyeRadius, 24]} />
            </mesh>
            <mesh ref={leftPupilRef} material={pupilMat} position={[0, 0, 0.005]}>
              <circleGeometry args={[pupilRadius, 24]} />
            </mesh>
            <mesh material={catchlightMat} position={[0.018, 0.022, 0.008]}>
              <circleGeometry args={[catchlightRadius, 16]} />
            </mesh>
          </>
        )}
      </group>

      {/* Right eye */}
      <group ref={rightEyeGroupRef} position={[0.2, 0.06, 0.025]}>
        {isHappy ? (
          <mesh geometry={happyEyeGeoR} material={happyEyeMat} />
        ) : (
          <>
            <mesh material={scleraMat}>
              <circleGeometry args={[eyeRadius, 24]} />
            </mesh>
            <mesh ref={rightPupilRef} material={pupilMat} position={[0, 0, 0.005]}>
              <circleGeometry args={[pupilRadius, 24]} />
            </mesh>
            <mesh material={catchlightMat} position={[0.018, 0.022, 0.008]}>
              <circleGeometry args={[catchlightRadius, 16]} />
            </mesh>
          </>
        )}
      </group>

      <mesh ref={mouthRef} geometry={smileGeo} material={mouthMat} position={[0, -0.1, 0.025]} />
    </group>
  );
}

function RobotBody({
  state,
  mousePosition,
}: {
  state: AvatarRobotState;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const antennaRef = useRef<THREE.Group>(null);

  const targets = useAvatarRobotAnimation(state);

  const shellMat = useMemo(() => new THREE.MeshStandardMaterial(WHITE_SHELL), []);
  const purpleMat = useMemo(() => new THREE.MeshStandardMaterial(PURPLE_METAL), []);
  const jointMat = useMemo(() => new THREE.MeshStandardMaterial(PURPLE_JOINT), []);
  const emblemMat = useMemo(() => new THREE.MeshStandardMaterial(CHEST_EMBLEM), []);
  const antennaTipMat = useMemo(() => new THREE.MeshStandardMaterial(ANTENNA_TIP), []);

  useFrame((_, delta) => {
    const tgt = targets.current;

    if (bodyRef.current) {
      bodyRef.current.position.y = lerp(bodyRef.current.position.y, tgt.bodyY, 5, delta);
      bodyRef.current.rotation.x = lerp(bodyRef.current.rotation.x, tgt.bodyRotX, 4, delta);
      bodyRef.current.rotation.y = lerp(bodyRef.current.rotation.y, tgt.bodyRotY, 4, delta);
    }
    if (headRef.current) {
      headRef.current.rotation.x = lerp(headRef.current.rotation.x, tgt.headRotX, 5, delta);
      headRef.current.rotation.y = lerp(headRef.current.rotation.y, tgt.headRotY, 5, delta);
      headRef.current.rotation.z = lerp(headRef.current.rotation.z, tgt.headRotZ, 5, delta);
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = lerp(leftArmRef.current.rotation.x, tgt.leftArmRotX, 5, delta);
      leftArmRef.current.rotation.z = lerp(leftArmRef.current.rotation.z, tgt.leftArmRotZ, 5, delta);
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = lerp(rightArmRef.current.rotation.x, tgt.rightArmRotX, 5, delta);
      rightArmRef.current.rotation.z = lerp(rightArmRef.current.rotation.z, tgt.rightArmRotZ, 5, delta);
    }
    if (antennaRef.current) {
      antennaRef.current.rotation.x = lerp(antennaRef.current.rotation.x, tgt.antennaRotX, 6, delta);
      antennaRef.current.rotation.z = lerp(antennaRef.current.rotation.z, tgt.antennaRotZ, 6, delta);
    }
  });

  return (
    <group ref={bodyRef}>
      {/* HEAD */}
      <group ref={headRef} position={[0, 1.0, 0]}>
        <mesh material={shellMat} castShadow>
          <boxGeometry args={[0.95, 0.8, 0.75]} />
          <meshStandardMaterial {...WHITE_SHELL} />
        </mesh>
        <mesh position={[0, 0.32, 0]} material={shellMat} castShadow>
          <sphereGeometry args={[0.4, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, -0.32, 0]} material={shellMat}>
          <sphereGeometry args={[0.4, 20, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>

        {/* Ear modules */}
        <mesh position={[-0.52, 0, 0]} material={purpleMat} castShadow>
          <capsuleGeometry args={[0.09, 0.18, 8, 12]} />
        </mesh>
        <mesh position={[-0.52, 0, 0]} material={jointMat}>
          <sphereGeometry args={[0.11, 12, 12]} />
        </mesh>
        <mesh position={[0.52, 0, 0]} material={purpleMat} castShadow>
          <capsuleGeometry args={[0.09, 0.18, 8, 12]} />
        </mesh>
        <mesh position={[0.52, 0, 0]} material={jointMat}>
          <sphereGeometry args={[0.11, 12, 12]} />
        </mesh>

        {/* Antenna */}
        <group ref={antennaRef} position={[0, 0.45, 0]}>
          <mesh material={purpleMat}>
            <cylinderGeometry args={[0.018, 0.022, 0.18, 8]} />
          </mesh>
          <mesh position={[0, 0.13, 0]} material={antennaTipMat}>
            <sphereGeometry args={[0.045, 12, 12]} />
          </mesh>
        </group>

        <Face state={state} mousePosition={mousePosition} />
      </group>

      {/* NECK */}
      <mesh position={[0, 0.6, 0]} material={jointMat}>
        <cylinderGeometry args={[0.1, 0.13, 0.12, 12]} />
      </mesh>

      {/* TORSO */}
      <group position={[0, 0.15, 0]}>
        <mesh material={shellMat} castShadow>
          <boxGeometry args={[0.75, 0.65, 0.5]} />
          <meshStandardMaterial {...WHITE_SHELL} />
        </mesh>
        <mesh position={[0, 0.28, 0]} material={shellMat} castShadow>
          <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, -0.28, 0]} material={shellMat}>
          <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>

        {/* Chest emblem */}
        <mesh position={[0, 0.05, 0.26]} material={emblemMat}>
          <circleGeometry args={[0.1, 24]} />
        </mesh>
        <mesh position={[0, 0.05, 0.265]}>
          <ringGeometry args={[0.06, 0.08, 24]} />
          <meshStandardMaterial {...ANTENNA_TIP} />
        </mesh>
        <mesh position={[0, 0.05, 0.27]}>
          <circleGeometry args={[0.035, 16]} />
          <meshStandardMaterial color="#C4B5FD" emissive="#A78BFA" emissiveIntensity={2} toneMapped={false} />
        </mesh>

        {/* Shoulder joints */}
        <mesh position={[-0.45, 0.18, 0]} material={jointMat}>
          <sphereGeometry args={[0.09, 12, 12]} />
        </mesh>
        <mesh position={[0.45, 0.18, 0]} material={jointMat}>
          <sphereGeometry args={[0.09, 12, 12]} />
        </mesh>
      </group>

      {/* LEFT ARM */}
      <group ref={leftArmRef} position={[-0.52, 0.35, 0]}>
        <mesh position={[0, -0.18, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.07, 0.22, 6, 10]} />
        </mesh>
        <mesh position={[0, -0.36, 0]} material={jointMat}>
          <sphereGeometry args={[0.065, 10, 10]} />
        </mesh>
        <mesh position={[0, -0.52, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.065, 0.18, 6, 10]} />
        </mesh>
        <mesh position={[0, -0.66, 0]} material={jointMat}>
          <sphereGeometry args={[0.05, 10, 10]} />
        </mesh>
        <group position={[0, -0.74, 0]}>
          <RobotHand pose={targets.current.leftHandPose} />
        </group>
      </group>

      {/* RIGHT ARM */}
      <group ref={rightArmRef} position={[0.52, 0.35, 0]}>
        <mesh position={[0, -0.18, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.07, 0.22, 6, 10]} />
        </mesh>
        <mesh position={[0, -0.36, 0]} material={jointMat}>
          <sphereGeometry args={[0.065, 10, 10]} />
        </mesh>
        <mesh position={[0, -0.52, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.065, 0.18, 6, 10]} />
        </mesh>
        <mesh position={[0, -0.66, 0]} material={jointMat}>
          <sphereGeometry args={[0.05, 10, 10]} />
        </mesh>
        <group position={[0, -0.74, 0]}>
          <RobotHand pose={targets.current.rightHandPose} mirror />
        </group>
      </group>
    </group>
  );
}

function ClassroomEnvironment() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.rotation.y += delta * 0.1 * (i % 2 === 0 ? 1 : -1);
        child.position.y += Math.sin(Date.now() * 0.001 + i) * 0.0003;
      });
    }
  });

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0c0a1a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Subtle grid lines on floor */}
      <gridHelper args={[20, 40, "#1a1040", "#120e2a"]} position={[0, -1.19, 0]} />

      {/* Floating geometric accents */}
      <group ref={groupRef}>
        <mesh position={[-2.5, 0.5, -3]}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial color="#8B5CF6" emissive="#7C3AED" emissiveIntensity={0.5} transparent opacity={0.3} />
        </mesh>
        <mesh position={[2.8, -0.2, -2.5]}>
          <icosahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#A78BFA" emissive="#8B5CF6" emissiveIntensity={0.4} transparent opacity={0.25} />
        </mesh>
        <mesh position={[-1.8, -0.5, -4]}>
          <dodecahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color="#C4B5FD" emissive="#A78BFA" emissiveIntensity={0.3} transparent opacity={0.2} />
        </mesh>
        <mesh position={[2.2, 0.8, -3.5]}>
          <tetrahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial color="#7C3AED" emissive="#6D28D9" emissiveIntensity={0.4} transparent opacity={0.25} />
        </mesh>
      </group>

      {/* Soft background glow */}
      <mesh position={[0, 1, -6]}>
        <planeGeometry args={[12, 8]} />
        <meshBasicMaterial color="#1a1040" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

export function RobotScene({
  state,
  mousePosition,
}: {
  state: AvatarRobotState;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 3, -2]} intensity={0.3} color="#c4b5fd" />
      <pointLight position={[0, 2.5, 3]} intensity={0.6} color="#e9d5ff" />
      <spotLight
        position={[0, 4, 4]}
        angle={0.35}
        penumbra={0.6}
        intensity={0.7}
        color="#f5f3ff"
      />
      <pointLight position={[0, -1, 2]} intensity={0.15} color="#8B5CF6" />

      {/* Robot */}
      <RobotBody state={state} mousePosition={mousePosition} />

      {/* Environment */}
      <ClassroomEnvironment />
    </>
  );
}
