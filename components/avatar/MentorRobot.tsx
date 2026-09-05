"use client";

import { useRef, useCallback, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import dynamic from "next/dynamic";
import { RobotScene } from "./RobotScene";
import type { AvatarRobotState } from "./RobotAnimations";

export type { AvatarRobotState } from "./RobotAnimations";

interface MentorRobotProps {
  state?: AvatarRobotState;
  className?: string;
}

function Scene({
  state,
  mouseRef,
}: {
  state: AvatarRobotState;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  return (
    <Suspense fallback={null}>
      <RobotScene state={state} mousePosition={mouseRef} />
      <Environment preset="city" />
    </Suspense>
  );
}

function MentorRobotInner({ state = "idle", className }: MentorRobotProps) {
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.x = 0;
    mouseRef.current.y = 0;
  }, []);

  return (
    <div
      className={className}
      style={{ position: "relative", overflow: "hidden" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <style>{`
        .mentor-robot canvas {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
      `}</style>
      <div className="mentor-robot" style={{ width: "100%", height: "100%" }}>
        <Canvas
          camera={{ position: [0, 0.5, 4.2], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: "100%", height: "100%", background: "transparent" }}
        >
          <Scene state={state} mouseRef={mouseRef} />
        </Canvas>
      </div>
    </div>
  );
}

export const MentorRobot = dynamic(() => Promise.resolve(MentorRobotInner), {
  ssr: false,
  loading: () => <div className="animate-pulse rounded-full bg-space-700/30" />,
});
