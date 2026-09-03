import * as THREE from "three";

export const WHITE_SHELL = {
  color: "#f0f0f5",
  roughness: 0.15,
  metalness: 0.05,
  clearcoat: 0.8,
  clearcoatRoughness: 0.1,
  envMapIntensity: 1.2,
};

export const PURPLE_METAL = {
  color: "#8B5CF6",
  roughness: 0.25,
  metalness: 0.7,
  envMapIntensity: 1.5,
};

export const PURPLE_JOINT = {
  color: "#7C3AED",
  roughness: 0.3,
  metalness: 0.6,
  envMapIntensity: 1.0,
};

export const BLACK_GLASS = {
  color: "#0a0a1a",
  roughness: 0.05,
  metalness: 0.3,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  envMapIntensity: 2.0,
};

export const PURPLE_GLOW: THREE.MeshStandardMaterialParameters = {
  color: "#A78BFA",
  emissive: "#8B5CF6",
  emissiveIntensity: 2.0,
  roughness: 0.3,
  metalness: 0.1,
  toneMapped: false,
};

export const PURPLE_GLOW_SOFT: THREE.MeshStandardMaterialParameters = {
  color: "#C4B5FD",
  emissive: "#A78BFA",
  emissiveIntensity: 1.0,
  roughness: 0.4,
  metalness: 0.1,
  toneMapped: false,
};

export const ANTENNA_TIP = {
  color: "#A78BFA",
  emissive: "#8B5CF6",
  emissiveIntensity: 1.5,
  roughness: 0.2,
  metalness: 0.3,
  toneMapped: false,
};

export const CHEST_EMBLEM = {
  color: "#8B5CF6",
  emissive: "#7C3AED",
  emissiveIntensity: 1.2,
  roughness: 0.2,
  metalness: 0.5,
  toneMapped: false,
};
