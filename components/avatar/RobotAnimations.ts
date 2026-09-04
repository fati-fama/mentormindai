"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { HandPose } from "@/components/robot/RobotHand";

export type AvatarRobotState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "happy"
  | "greeting"
  | "goodbye";

export interface AnimationTargets {
  bodyY: number;
  bodyRotX: number;
  bodyRotY: number;
  headRotX: number;
  headRotY: number;
  headRotZ: number;
  leftArmRotX: number;
  leftArmRotZ: number;
  rightArmRotX: number;
  rightArmRotZ: number;
  leftLegRotX: number;
  rightLegRotX: number;
  antennaRotX: number;
  antennaRotZ: number;
  leftHandPose: HandPose;
  rightHandPose: HandPose;
}

const DEFAULT_TARGETS: AnimationTargets = {
  bodyY: 0,
  bodyRotX: 0,
  bodyRotY: 0,
  headRotX: 0,
  headRotY: 0,
  headRotZ: 0,
  leftArmRotX: 0,
  leftArmRotZ: 0.12,
  rightArmRotX: 0,
  rightArmRotZ: -0.12,
  leftLegRotX: 0,
  rightLegRotX: 0,
  antennaRotX: 0,
  antennaRotZ: 0,
  leftHandPose: "relaxed",
  rightHandPose: "relaxed",
};

export function useAvatarRobotAnimation(state: AvatarRobotState) {
  const targets = useRef<AnimationTargets>({ ...DEFAULT_TARGETS });
  const stateTimer = useRef(0);
  const currentState = useRef<AvatarRobotState>("idle");

  useFrame((_, delta) => {
    stateTimer.current += delta;
    const t = stateTimer.current;
    const tgt = targets.current;

    if (currentState.current !== state) {
      currentState.current = state;
      stateTimer.current = 0;
    }

    switch (state) {
      case "idle": {
        tgt.bodyY = Math.sin(t * 1.2) * 0.025;
        tgt.bodyRotX = 0;
        tgt.bodyRotY = Math.sin(t * 0.4) * 0.015;
        tgt.headRotX = Math.sin(t * 0.7) * 0.025;
        tgt.headRotY = Math.sin(t * 0.5) * 0.03;
        tgt.headRotZ = Math.sin(t * 0.6) * 0.015;
        tgt.leftArmRotX = Math.sin(t * 0.6) * 0.015;
        tgt.leftArmRotZ = 0.12;
        tgt.rightArmRotX = Math.sin(t * 0.6 + 1) * 0.015;
        tgt.rightArmRotZ = -0.12;
        tgt.leftLegRotX = 0;
        tgt.rightLegRotX = 0;
        tgt.antennaRotX = Math.sin(t * 1.8) * 0.04;
        tgt.antennaRotZ = Math.cos(t * 1.5) * 0.03;
        tgt.leftHandPose = "relaxed";
        tgt.rightHandPose = "relaxed";
        break;
      }

      case "listening": {
        tgt.bodyY = Math.sin(t * 1.0) * 0.015;
        tgt.bodyRotX = -0.06;
        tgt.bodyRotY = 0;
        tgt.headRotX = -0.04;
        tgt.headRotY = Math.sin(t * 0.8) * 0.02;
        tgt.headRotZ = 0;
        tgt.leftArmRotX = 0;
        tgt.leftArmRotZ = 0.12;
        tgt.rightArmRotX = 0;
        tgt.rightArmRotZ = -0.12;
        tgt.leftLegRotX = 0;
        tgt.rightLegRotX = 0;
        tgt.antennaRotX = Math.sin(t * 2.5) * 0.06;
        tgt.antennaRotZ = 0;
        tgt.leftHandPose = "relaxed";
        tgt.rightHandPose = "relaxed";
        if (t > 1.5 && t < 1.7) {
          tgt.headRotX = -0.1;
        }
        break;
      }

      case "thinking": {
        tgt.bodyY = Math.sin(t * 0.8) * 0.012;
        tgt.bodyRotX = 0;
        tgt.bodyRotY = 0;
        tgt.headRotX = 0.12;
        tgt.headRotY = -0.18;
        tgt.headRotZ = 0.14;
        tgt.leftArmRotX = -1.0;
        tgt.leftArmRotZ = 0.6;
        tgt.rightArmRotX = 0;
        tgt.rightArmRotZ = -0.12;
        tgt.leftLegRotX = 0;
        tgt.rightLegRotX = 0;
        tgt.antennaRotX = Math.sin(t * 1.2) * 0.05;
        tgt.antennaRotZ = 0.04;
        tgt.leftHandPose = "relaxed";
        tgt.rightHandPose = "relaxed";
        break;
      }

      case "speaking": {
        tgt.bodyY = Math.sin(t * 1.3) * 0.018;
        tgt.bodyRotX = 0;
        tgt.bodyRotY = Math.sin(t * 0.7) * 0.025;
        tgt.headRotX = Math.sin(t * 1.8) * 0.035;
        tgt.headRotY = Math.sin(t * 1.1) * 0.05;
        tgt.headRotZ = Math.sin(t * 0.9) * 0.02;
        tgt.leftArmRotX = Math.sin(t * 1.2) * 0.06;
        tgt.leftArmRotZ = 0.18;
        tgt.rightArmRotX = Math.sin(t * 1.2 + 0.8) * 0.06;
        tgt.rightArmRotZ = -0.18;
        tgt.leftLegRotX = 0;
        tgt.rightLegRotX = 0;
        tgt.antennaRotX = Math.sin(t * 2.2) * 0.06;
        tgt.antennaRotZ = Math.cos(t * 1.8) * 0.04;
        tgt.leftHandPose = "relaxed";
        tgt.rightHandPose = "relaxed";
        break;
      }

      case "happy": {
        tgt.bodyY = Math.abs(Math.sin(t * 2.5)) * 0.05;
        tgt.bodyRotX = 0;
        tgt.bodyRotY = Math.sin(t * 2.0) * 0.06;
        tgt.headRotX = -0.08;
        tgt.headRotY = Math.sin(t * 2.2) * 0.08;
        tgt.headRotZ = Math.sin(t * 2.5) * 0.04;
        tgt.leftArmRotX = -0.6;
        tgt.leftArmRotZ = 0.5;
        tgt.rightArmRotX = -0.6;
        tgt.rightArmRotZ = -0.5;
        tgt.leftLegRotX = Math.sin(t * 2.5) * 0.06;
        tgt.rightLegRotX = -Math.sin(t * 2.5) * 0.06;
        tgt.antennaRotX = Math.sin(t * 3.5) * 0.1;
        tgt.antennaRotZ = Math.cos(t * 3.0) * 0.07;
        tgt.leftHandPose = "open";
        tgt.rightHandPose = "open";
        break;
      }

      case "greeting": {
        tgt.bodyY = Math.sin(t * 1.8) * 0.02;
        tgt.bodyRotX = 0;
        tgt.bodyRotY = 0;
        tgt.headRotX = -0.06;
        tgt.headRotY = 0;
        tgt.headRotZ = 0.06;
        tgt.leftArmRotX = 0;
        tgt.leftArmRotZ = 0.12;
        tgt.rightArmRotX = -2.0;
        tgt.rightArmRotZ = -0.3;
        tgt.leftLegRotX = 0;
        tgt.rightLegRotX = 0;
        tgt.antennaRotX = Math.sin(t * 2.5) * 0.08;
        tgt.antennaRotZ = 0;
        tgt.leftHandPose = "relaxed";
        tgt.rightHandPose = t < 0.4 ? "open" : "wave";
        break;
      }

      case "goodbye": {
        tgt.bodyY = Math.sin(t * 1.5) * 0.015;
        tgt.bodyRotX = 0.04;
        tgt.bodyRotY = 0;
        tgt.headRotX = -0.04;
        tgt.headRotY = 0;
        tgt.headRotZ = -0.05;
        tgt.leftArmRotX = 0;
        tgt.leftArmRotZ = 0.12;
        tgt.rightArmRotX = -2.2;
        tgt.rightArmRotZ = -0.35;
        tgt.leftLegRotX = 0;
        tgt.rightLegRotX = 0;
        tgt.antennaRotX = Math.sin(t * 2.0) * 0.06;
        tgt.antennaRotZ = 0;
        tgt.leftHandPose = "relaxed";
        tgt.rightHandPose = "wave";
        break;
      }
    }
  });

  return targets;
}
