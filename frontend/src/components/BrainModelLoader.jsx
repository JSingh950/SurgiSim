import { useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";

export default function BrainModelLoader({
  modelPath,
  onRegionClick,
  selectedRegion,
  isBusy,
}) {
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    if (!modelPath) {
      setError("No model path provided");
      return;
    }

    try {
      const loadedModel = useGLTF(modelPath);
      setModel(loadedModel);
      setError(null);
    } catch (err) {
      setError(`Failed to load model: ${err.message}`);
      console.error("GLB loading error:", err);
    }
  }, [modelPath]);

  if (error) {
    return (
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ff6b6b" wireframe />
      </mesh>
    );
  }

  if (!model) {
    return (
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#4dd0ff" opacity={0.5} transparent wireframe />
      </mesh>
    );
  }

  return (
    <primitive
      object={model.scene}
      onClick={(event) => {
        event.stopPropagation();
        if (onRegionClick && !isBusy) {
          // Try to extract region name from clicked mesh
          const regionName = event.object.name || event.object.userData?.region || "Unknown Region";
          onRegionClick(regionName);
        }
      }}
      scale={[1.5, 1.5, 1.5]}
      position={[0, 0.2, 0]}
    />
  );
}

// Preload common brain models
export function preloadBrainModels(modelPaths) {
  modelPaths.forEach(path => {
    try {
      useGLTF.preload(path);
    } catch (err) {
      console.warn(`Failed to preload ${path}:`, err);
    }
  });
}