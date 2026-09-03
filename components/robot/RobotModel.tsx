"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WHITE_SHELL, PURPLE_METAL, PURPLE_JOINT, CHEST_EMBLEM, ANTENNA_TIP } from "./robotMaterials";
import { RobotFace } from "./RobotFace";
import { RobotHand, type HandPose } from "./RobotHand";
import { useRobotAnimation, type RobotState, type AnimationTargets } from "./RobotAnimations";

interface RobotModelProps {
  state: RobotState;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}

function lerp(current: number, target: number, speed: number, delta: number): number {
  return THREE.MathUtils.lerp(current, target, Math.min(1, speed * delta));
}

export function RobotModel({ state, mousePosition }: RobotModelProps) {
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const antennaRef = useRef<THREE.Group>(null);
  const leftHandPoseRef = useRef<HandPose>("relaxed");
  const rightHandPoseRef = useRef<HandPose>("relaxed");

  const targets = useRobotAnimation(state);

  const shellMat = useMemo(() => new THREE.MeshStandardMaterial(WHITE_SHELL), []);
  const purpleMat = useMemo(() => new THREE.MeshStandardMaterial(PURPLE_METAL), []);
  const jointMat = useMemo(() => new THREE.MeshStandardMaterial(PURPLE_JOINT), []);
  const emblemMat = useMemo(() => new THREE.MeshStandardMaterial(CHEST_EMBLEM), []);
  const antennaTipMat = useMemo(() => new THREE.MeshStandardMaterial(ANTENNA_TIP), []);

  useFrame((_, delta) => {
    const tgt = targets.current;

    if (bodyRef.current) {
      bodyRef.current.position.y = lerp(bodyRef.current.position.y, tgt.bodyY, 5, delta);
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

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = lerp(leftLegRef.current.rotation.x, tgt.leftLegRotX, 5, delta);
    }

    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = lerp(rightLegRef.current.rotation.x, tgt.rightLegRotX, 5, delta);
    }

    if (antennaRef.current) {
      antennaRef.current.rotation.x = lerp(antennaRef.current.rotation.x, tgt.antennaRotX, 6, delta);
      antennaRef.current.rotation.z = lerp(antennaRef.current.rotation.z, tgt.antennaRotZ, 6, delta);
    }

    leftHandPoseRef.current = tgt.leftHandPose;
    rightHandPoseRef.current = tgt.rightHandPose;
  });

  return (
    <group ref={bodyRef}>
      {/* ===== HEAD ===== */}
      <group ref={headRef} position={[0, 1.15, 0]}>
        {/* Main head shell — large rounded rectangle */}
        <mesh material={shellMat} castShadow>
          <boxGeometry args={[1.0, 0.85, 0.8]} />
          <meshStandardMaterial {...WHITE_SHELL} />
        </mesh>
        {/* Head top cap */}
        <mesh position={[0, 0.35, 0]} material={shellMat} castShadow>
          <sphereGeometry args={[0.42, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {/* Head bottom cap */}
        <mesh position={[0, -0.35, 0]} material={shellMat}>
          <sphereGeometry args={[0.42, 20, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>

        {/* Left ear module */}
        <mesh position={[-0.55, 0, 0]} material={purpleMat} castShadow>
          <capsuleGeometry args={[0.1, 0.2, 8, 12]} />
        </mesh>
        <mesh position={[-0.55, 0, 0]} material={jointMat}>
          <sphereGeometry args={[0.12, 12, 12]} />
        </mesh>

        {/* Right ear module */}
        <mesh position={[0.55, 0, 0]} material={purpleMat} castShadow>
          <capsuleGeometry args={[0.1, 0.2, 8, 12]} />
        </mesh>
        <mesh position={[0.55, 0, 0]} material={jointMat}>
          <sphereGeometry args={[0.12, 12, 12]} />
        </mesh>

        {/* Antenna */}
        <group ref={antennaRef} position={[0, 0.5, 0]}>
          <mesh material={purpleMat}>
            <cylinderGeometry args={[0.02, 0.025, 0.2, 8]} />
          </mesh>
          <mesh position={[0, 0.14, 0]} material={antennaTipMat}>
            <sphereGeometry args={[0.05, 12, 12]} />
          </mesh>
        </group>

        {/* Face (attached to head, has its own cursor tracking) */}
        <RobotFace state={state} mousePosition={mousePosition} />
      </group>

      {/* ===== NECK ===== */}
      <mesh position={[0, 0.7, 0]} material={jointMat}>
        <cylinderGeometry args={[0.12, 0.15, 0.15, 12]} />
      </mesh>

      {/* ===== TORSO ===== */}
      <group position={[0, 0.2, 0]}>
        {/* Main torso */}
        <mesh material={shellMat} castShadow>
          <boxGeometry args={[0.8, 0.7, 0.55]} />
          <meshStandardMaterial {...WHITE_SHELL} />
        </mesh>
        {/* Torso top round */}
        <mesh position={[0, 0.3, 0]} material={shellMat} castShadow>
          <sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {/* Torso bottom round */}
        <mesh position={[0, -0.3, 0]} material={shellMat}>
          <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>

        {/* Chest emblem — AI/brain circle */}
        <mesh position={[0, 0.05, 0.29]} material={emblemMat}>
          <circleGeometry args={[0.12, 24]} />
        </mesh>
        {/* Emblem inner ring */}
        <mesh position={[0, 0.05, 0.295]}>
          <ringGeometry args={[0.07, 0.09, 24]} />
          <meshStandardMaterial {...ANTENNA_TIP} />
        </mesh>
        {/* Emblem center dot */}
        <mesh position={[0, 0.05, 0.3]}>
          <circleGeometry args={[0.04, 16]} />
          <meshStandardMaterial color="#C4B5FD" emissive="#A78BFA" emissiveIntensity={2} toneMapped={false} />
        </mesh>

        {/* Shoulder joints */}
        <mesh position={[-0.48, 0.2, 0]} material={jointMat}>
          <sphereGeometry args={[0.1, 12, 12]} />
        </mesh>
        <mesh position={[0.48, 0.2, 0]} material={jointMat}>
          <sphereGeometry args={[0.1, 12, 12]} />
        </mesh>
      </group>

      {/* ===== LEFT ARM ===== */}
      <group ref={leftArmRef} position={[-0.55, 0.4, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.2, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.08, 0.25, 6, 10]} />
        </mesh>
        {/* Elbow joint */}
        <mesh position={[0, -0.4, 0]} material={jointMat}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.58, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.07, 0.2, 6, 10]} />
        </mesh>
        {/* Wrist joint */}
        <mesh position={[0, -0.73, 0]} material={jointMat}>
          <sphereGeometry args={[0.055, 10, 10]} />
        </mesh>
        {/* Hand */}
        <group position={[0, -0.82, 0]}>
          <RobotHand pose={targets.current.leftHandPose} />
        </group>
      </group>

      {/* ===== RIGHT ARM ===== */}
      <group ref={rightArmRef} position={[0.55, 0.4, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.2, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.08, 0.25, 6, 10]} />
        </mesh>
        {/* Elbow joint */}
        <mesh position={[0, -0.4, 0]} material={jointMat}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.58, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.07, 0.2, 6, 10]} />
        </mesh>
        {/* Wrist joint */}
        <mesh position={[0, -0.73, 0]} material={jointMat}>
          <sphereGeometry args={[0.055, 10, 10]} />
        </mesh>
        {/* Hand */}
        <group position={[0, -0.82, 0]}>
          <RobotHand pose={targets.current.rightHandPose} mirror />
        </group>
      </group>

      {/* ===== HIP ===== */}
      <mesh position={[0, -0.2, 0]} material={jointMat}>
        <sphereGeometry args={[0.2, 12, 12]} />
      </mesh>

      {/* ===== LEFT LEG ===== */}
      <group ref={leftLegRef} position={[-0.2, -0.25, 0]}>
        {/* Hip joint */}
        <mesh material={jointMat}>
          <sphereGeometry args={[0.09, 10, 10]} />
        </mesh>
        {/* Upper leg */}
        <mesh position={[0, -0.2, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.09, 0.22, 6, 10]} />
        </mesh>
        {/* Knee joint */}
        <mesh position={[0, -0.38, 0]} material={jointMat}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
        {/* Lower leg */}
        <mesh position={[0, -0.55, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.08, 0.2, 6, 10]} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.72, 0.04]} material={shellMat} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.22]} />
          <meshStandardMaterial {...WHITE_SHELL} />
        </mesh>
        {/* Foot front cap */}
        <mesh position={[0, -0.72, 0.12]} material={shellMat}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
      </group>

      {/* ===== RIGHT LEG ===== */}
      <group ref={rightLegRef} position={[0.2, -0.25, 0]}>
        {/* Hip joint */}
        <mesh material={jointMat}>
          <sphereGeometry args={[0.09, 10, 10]} />
        </mesh>
        {/* Upper leg */}
        <mesh position={[0, -0.2, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.09, 0.22, 6, 10]} />
        </mesh>
        {/* Knee joint */}
        <mesh position={[0, -0.38, 0]} material={jointMat}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
        {/* Lower leg */}
        <mesh position={[0, -0.55, 0]} material={shellMat} castShadow>
          <capsuleGeometry args={[0.08, 0.2, 6, 10]} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.72, 0.04]} material={shellMat} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.22]} />
          <meshStandardMaterial {...WHITE_SHELL} />
        </mesh>
        {/* Foot front cap */}
        <mesh position={[0, -0.72, 0.12]} material={shellMat}>
          <sphereGeometry args={[0.07, 10, 10]} />
        </mesh>
      </group>
    </group>
  );
}
