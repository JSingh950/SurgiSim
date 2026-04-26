import { Suspense, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { useGLTF, GLTFLoader } from "@react-three/drei";
import * as THREE from "three";
import anime from "animejs";

export function BrainModelLoader({
  modelPath = "/models/brain.glb",
  fallbackToGeometric = true,
  onLoad,
  onError,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const tryLoadModel = useLoader(
    GLTFLoader,
    modelPath,
  );

  useEffect(() => {
    if (tryLoadModel) {
      setIsLoading(false);
      setError(null);
      if (onLoad) onLoad(tryLoadModel);
    }
  }, [tryLoadModel, onLoad]);

  if (error) {
    console.error("Failed to load 3D brain model:", error);
    setError(error);
    setIsLoading(false);
    if (onError) onError(error);
  }

  return {
    model: tryLoadModel,
    isLoading,
    error,
  };
}

export function RealisticBrain({
  model,
  scale = 1,
  position = [0, 0, 0],
  isActive = false,
  isHovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
  brainRegions = [],
  onRegionSelect,
}) {
  const groupRef = useState(null);

  useEffect(() => {
    if (!groupRef.current) return;

    // Entrance animation
    anime({
      targets: groupRef.current.scale,
      x: [0, scale],
      y: [0, scale],
      z: [0, scale],
      duration: 1200,
      easing: "easeOutExpo",
    });
  }, [scale]);

  useEffect(() => {
    if (!groupRef.current) return;

    const emphasis = isActive ? 1.08 : isHovered ? 1.03 : 1;

    anime({
      targets: groupRef.current.scale,
      x: scale * emphasis,
      y: scale * emphasis,
      z: scale * emphasis,
      duration: 600,
      easing: "easeOutExpo",
    });
  }, [isActive, isHovered, scale]);

  if (!model) return null;

  // Create interactive regions based on brain anatomy
  const scene = model.scene;
  const brainMesh = scene.children[0];

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* Main brain mesh */}
      <primitive object={brainMesh} />

      {/* Interactive brain regions overlay */}
      {brainRegions.map((region) => (
        <BrainRegionOverlay
          key={region.id}
          region={region}
          isActive={isActive}
          isHovered={isHovered}
          onRegionSelect={onRegionSelect}
        />
      ))}
    </group>
  );
}

function BrainRegionOverlay({ region, isActive, isHovered, onRegionSelect }) {
  const meshRef = useState(null);

  useEffect(() => {
    if (!meshRef.current) return;

    const emphasis = isActive ? 0.15 : isHovered ? 0.08 : 0;

    // Animate position for hover/active state
    anime({
      targets: meshRef.current.position,
      x: region.position[0] + emphasis,
      y: region.position[1] + emphasis,
      z: region.position[2] + emphasis,
      duration: 500,
      easing: "easeOutExpo",
    });

    // Animate material opacity
    anime({
      targets: meshRef.current.material,
      opacity: isActive ? 0.4 : isHovered ? 0.2 : 0.1,
      duration: 400,
      easing: "easeOutSine",
    });

    // Animate emissive for glow effect
    anime({
      targets: meshRef.current.material,
      emissiveIntensity: isActive ? 0.8 : isHovered ? 0.3 : 0,
      duration: 400,
      easing: "easeOutSine",
    });
  }, [isActive, isHovered, region]);

  const handleClick = (event) => {
    event.stopPropagation();
    if (onRegionSelect) {
      onRegionSelect(region);
    }
  };

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      position={region.position}
      scale={region.scale}
    >
      <sphereGeometry args={[region.radius || 0.5, 16, 16]} />
      <meshStandardMaterial
        color={region.color || "#79e9ff"}
        emissive={region.color || "#79e9ff"}
        transparent
        opacity={0.1}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

export const BRAIN_REGION_CONFIG = [
  {
    id: "frontal-lobe",
    name: "Frontal Lobe",
    color: "#79e9ff",
    position: [1.8, 0.7, 0.8],
    scale: [0.4, 0.3, 0.35],
    radius: 0.5,
  },
  {
    id: "parietal-lobe",
    name: "Parietal Lobe",
    color: "#9dffdf",
    position: [0.2, 1.3, 0.2],
    scale: [0.35, 0.28, 0.32],
    radius: 0.45,
  },
  {
    id: "temporal-lobe",
    name: "Temporal Lobe",
    color: "#74ffc9",
    position: [1.0, -0.5, 0.25],
    scale: [0.38, 0.22, 0.32],
    radius: 0.42,
  },
  {
    id: "occipital-lobe",
    name: "Occipital Lobe",
    color: "#4dd0ff",
    position: [-1.6, 0.4, -0.2],
    scale: [0.32, 0.26, 0.28],
    radius: 0.38,
  },
  {
    id: "cerebellum",
    name: "Cerebellum",
    color: "#5bffc8",
    position: [-0.8, -1.3, -0.7],
    scale: [0.25, 0.22, 0.24],
    radius: 0.3,
  },
];

export default BrainModelLoader;