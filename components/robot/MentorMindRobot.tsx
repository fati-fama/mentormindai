"use client";

import { useRef, useCallback, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import dynamic from "next/dynamic";
import { RobotModel } from "./RobotModel";
import type { RobotState } from "./RobotAnimations";

export type { RobotState } from "./RobotAnimations";

interface MentorMindRobotProps {
  state?: RobotState;
  className?: string;
}

function Scene({ state, mouseRef }: { state: RobotState; mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#c4b5fd" />
      <pointLight position={[0, 3, 3]} intensity={0.5} color="#e9d5ff" />
      <spotLight
        position={[0, 5, 5]}
        angle={0.4}
        penumbra={0.5}
        intensity={0.6}
        color="#f5f3ff"
      />

      <Suspense fallback={null}>
        <RobotModel state={state} mousePosition={mouseRef} />
        <Environment preset="city" />
      </Suspense>
    </>
  );
}

function MentorMindRobotInner({ state = "idle", className }: MentorMindRobotProps) {
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
        .mentormind-robot canvas {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
      `}</style>
      <div className="mentormind-robot" style={{ width: "100%", height: "100%" }}>
        <Canvas
          camera={{ position: [0, 0.5, 4.5], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: "100%", height: "100%", background: "transparent" }}
        >
          <Scene state={state} mouseRef={mouseRef} />
        </Canvas>
      </div>
    </div>
  );
}

export const MentorMindRobot = dynamic(() => Promise.resolve(MentorMindRobotInner), {
  ssr: false,
  loading: () => <div className="animate-pulse rounded-full bg-space-700/30" />,
});
