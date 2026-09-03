"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WHITE_SHELL, PURPLE_JOINT } from "./robotMaterials";

export type HandPose = "open" | "closed" | "wave" | "point" | "relaxed";

interface RobotHandProps {
  pose: HandPose;
  mirror?: boolean;
}

interface FingerConfig {
  position: [number, number, number];
  rotation: [number, number, number];
  lengths: [number, number, number];
  radius: number;
}

const FINGER_CONFIGS: FingerConfig[] = [
  { position: [-0.045, 0, 0.02], rotation: [0, 0, 0.08], lengths: [0.06, 0.045, 0.035], radius: 0.014 },
  { position: [-0.015, 0, 0.025], rotation: [0, 0, 0.02], lengths: [0.07, 0.05, 0.04], radius: 0.014 },
  { position: [0.015, 0, 0.025], rotation: [0, 0, -0.02], lengths: [0.065, 0.048, 0.038], radius: 0.013 },
  { position: [0.045, 0, 0.02], rotation: [0, 0, -0.08], lengths: [0.055, 0.04, 0.032], radius: 0.012 },
];

const THUMB_CONFIG: FingerConfig = {
  position: [-0.06, -0.02, -0.01],
  rotation: [0.3, 0.5, 0.6],
  lengths: [0.05, 0.04, 0.03],
  radius: 0.016,
};

function getTargetCurl(pose: HandPose, fingerIndex: number): [number, number, number] {
  switch (pose) {
    case "closed":
      return [1.2, 1.4, 1.2];
    case "wave":
      if (fingerIndex === 4) return [0.3, 0.2, 0.1];
      return [0.1 * (fingerIndex % 2 === 0 ? 1 : -1), 0, 0];
    case "point":
      if (fingerIndex === 1) return [0, 0, 0];
      return [1.2, 1.4, 1.2];
    case "relaxed":
      return [0.3, 0.4, 0.3];
    case "open":
    default:
      return [0, 0, 0];
  }
}

function Finger({
  config,
  curlTarget,
  isThumb = false,
}: {
  config: FingerConfig;
  curlTarget: [number, number, number];
  isThumb?: boolean;
}) {
  const joint1Ref = useRef<THREE.Group>(null);
  const joint2Ref = useRef<THREE.Group>(null);
  const joint3Ref = useRef<THREE.Group>(null);

  const shellMat = useMemo(() => new THREE.MeshStandardMaterial(WHITE_SHELL), []);
  const jointMat = useMemo(() => new THREE.MeshStandardMaterial(PURPLE_JOINT), []);

  useFrame((_, delta) => {
    if (joint1Ref.current) {
      joint1Ref.current.rotation.x = THREE.MathUtils.lerp(
        joint1Ref.current.rotation.x,
        curlTarget[0],
        delta * 8
      );
    }
    if (joint2Ref.current) {
      joint2Ref.current.rotation.x = THREE.MathUtils.lerp(
        joint2Ref.current.rotation.x,
        curlTarget[1],
        delta * 8
      );
    }
    if (joint3Ref.current) {
      joint3Ref.current.rotation.x = THREE.MathUtils.lerp(
        joint3Ref.current.rotation.x,
        curlTarget[2],
        delta * 8
      );
    }
  });

  return (
    <group position={config.position} rotation={config.rotation}>
      {/* Joint 1 (knuckle) */}
      <group ref={joint1Ref}>
        <mesh material={jointMat}>
          <sphereGeometry args={[config.radius * 1.2, 10, 10]} />
        </mesh>
        {/* Proximal phalanx */}
        <mesh position={[0, config.lengths[0] / 2, 0]} material={shellMat}>
          <capsuleGeometry args={[config.radius, config.lengths[0] - config.radius * 2, 4, 8]} />
        </mesh>

        {/* Joint 2 */}
        <group position={[0, config.lengths[0], 0]}>
          <group ref={joint2Ref}>
            <mesh material={jointMat}>
              <sphereGeometry args={[config.radius * 1.1, 10, 10]} />
            </mesh>
            {/* Middle phalanx */}
            <mesh position={[0, config.lengths[1] / 2, 0]} material={shellMat}>
              <capsuleGeometry args={[config.radius * 0.9, config.lengths[1] - config.radius * 1.8, 4, 8]} />
            </mesh>

            {/* Joint 3 */}
            <group position={[0, config.lengths[1], 0]}>
              <group ref={joint3Ref}>
                <mesh material={jointMat}>
                  <sphereGeometry args={[config.radius, 10, 10]} />
                </mesh>
                {/* Distal phalanx (fingertip) */}
                <mesh position={[0, config.lengths[2] / 2, 0]} material={shellMat}>
                  <capsuleGeometry args={[config.radius * 0.8, config.lengths[2] - config.radius * 1.6, 4, 8]} />
                </mesh>
                {/* Fingertip cap */}
                <mesh position={[0, config.lengths[2], 0]} material={shellMat}>
                  <sphereGeometry args={[config.radius * 0.75, 8, 8]} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export function RobotHand({ pose, mirror = false }: RobotHandProps) {
  const handGroupRef = useRef<THREE.Group>(null);

  const shellMat = useMemo(() => new THREE.MeshStandardMaterial(WHITE_SHELL), []);
  const jointMat = useMemo(() => new THREE.MeshStandardMaterial(PURPLE_JOINT), []);

  useFrame((_, delta) => {
    if (!handGroupRef.current) return;
    if (pose === "wave") {
      handGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        handGroupRef.current.rotation.z,
        Math.sin(Date.now() * 0.005) * 0.3,
        delta * 5
      );
    } else {
      handGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        handGroupRef.current.rotation.z,
        0,
        delta * 4
      );
    }
  });

  return (
    <group ref={handGroupRef} scale={mirror ? [-1, 1, 1] : [1, 1, 1]}>
      {/* Palm */}
      <mesh material={shellMat} position={[0, -0.02, 0]}>
        <boxGeometry args={[0.12, 0.08, 0.05]} />
        <meshStandardMaterial {...WHITE_SHELL} />
      </mesh>
      {/* Palm round top */}
      <mesh material={shellMat} position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.055, 12, 12]} />
      </mesh>
      {/* Palm round bottom */}
      <mesh material={shellMat} position={[0, -0.06, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
      </mesh>
      {/* Wrist joint */}
      <mesh material={jointMat} position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.03, 10, 10]} />
      </mesh>

      {/* 4 fingers */}
      {FINGER_CONFIGS.map((config, i) => (
        <Finger
          key={`finger-${i}`}
          config={config}
          curlTarget={getTargetCurl(pose, i)}
        />
      ))}

      {/* Thumb */}
      <Finger
        config={THUMB_CONFIG}
        curlTarget={getTargetCurl(pose, 4)}
        isThumb
      />
    </group>
  );
}
