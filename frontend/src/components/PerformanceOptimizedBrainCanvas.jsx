import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import anime from "animejs";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BrainRegion, BRAIN_REGION_CONFIG } from "./BrainModelLoader.jsx";

// Performance configuration
const PERFORMANCE_CONFIG = {
  enableInstancing: true,
  maxParticleCount: 1000,
  geometryCache: new Map(),
  materialCache: new Map(),
  lodLevels: [1.0, 0.75, 0.5], // Level of Detail
  renderDistance: 15, // Render distance cutoff
  targetFPS: 60,
  adaptiveQuality: true,
};

export default function PerformanceOptimizedBrainCanvas({
  isBusy,
  onSelect,
  selectedRegion,
  selectedTool,
  toolActive,
  microscopeMode,
}) {
  const canvasRef = useRef(null);
  const [qualityLevel, setQualityLevel] = useState("high");
  const [fps, setFps] = useState(0);
  const lastTimeRef = useRef(Date.now());
  const frameCountRef = useRef(0);

  // Adaptive quality based on performance
  useEffect(() => {
    const fpsCheckInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      const currentFps = Math.round(1000 / delta);

      frameCountRef.current++;

      if (frameCountRef.current >= 30) { // Check every 30 frames
        setFps(currentFps);
        frameCountRef.current = 0;

        // Adaptive quality adjustment
        if (PERFORMANCE_CONFIG.adaptiveQuality) {
          if (currentFps < 30 && qualityLevel !== "low") {
            setQualityLevel("low");
          } else if (currentFps < 50 && qualityLevel === "high") {
            setQualityLevel("medium");
          } else if (currentFps >= 55 && qualityLevel === "low") {
            setQualityLevel("high");
          }
        }
      }

      lastTimeRef.current = now;
    }, 500);

    return () => clearInterval(fpsCheckInterval);
  }, [qualityLevel]);

  const getLODScale = () => {
    switch (qualityLevel) {
      case "low":
        return PERFORMANCE_CONFIG.lodLevels[2];
      case "medium":
        return PERFORMANCE_CONFIG.lodLevels[1];
      default:
        return PERFORMANCE_CONFIG.lodLevels[0];
    }
  };

  const optimizedProps = useMemo(() => {
    const lodScale = getLODScale();

    return {
      dpr: qualityLevel === "low" ? [0.75, 1] : [1, 1.5],
      gl: {
        antialias: qualityLevel !== "low",
        alpha: true,
        powerPreference: qualityLevel === "high" ? "high-performance" : "default",
      },
      camera: {
        position: [0, 1.35, 8.1],
        fov: microscopeMode ? 25 : 38,
        near: 0.1,
        far: PERFORMANCE_CONFIG.renderDistance,
      },
      brainScale: lodScale,
    };
  }, [qualityLevel, microscopeMode]);

  return (
    <div className="absolute inset-0">
      <Canvas
        ref={canvasRef}
        {...optimizedProps}
      >
        <color attach="background" args={["#020711"]} />
        <fog attach="fog" args={["#020711", 8, PERFORMANCE_CONFIG.renderDistance]} />
        <ambientLight intensity={qualityLevel === "low" ? 0.8 : 1.1} />
        <directionalLight position={[6, 8, 6]} intensity={qualityLevel === "low" ? 1.2 : 1.6} color="#d5fbff" />
        <directionalLight position={[-6, -3, 2]} intensity={qualityLevel === "low" ? 0.35 : 0.45} color="#1ed7b4" />
        <pointLight position={[0, 4, -6]} intensity={qualityLevel === "low" ? 0.4 : 0.55} color="#74f7ff" />

        <Suspense fallback={<LoadingFallback />}>
          <CameraRig focusTarget={selectedRegion} qualityLevel={qualityLevel} />
          <OptimizedBrainAssembly
            isBusy={isBusy}
            onSelect={onSelect}
            selectedRegion={selectedRegion}
            selectedTool={selectedTool}
            toolActive={toolActive}
            qualityLevel={qualityLevel}
          />
          <OptimizedToolDisplay
            selectedTool={selectedTool}
            isActive={toolActive}
            selectedRegion={selectedRegion}
            qualityLevel={qualityLevel}
          />
        </Suspense>

        {/* Performance Stats */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute top-4 right-4 bg-slate-950/80 text-white text-xs p-2 rounded font-mono">
            <div>FPS: {fps}</div>
            <div>Quality: {qualityLevel}</div>
            <div>Scale: {getLODScale().toFixed(2)}x</div>
          </div>
        )}
      </Canvas>
    </div>
  );
}

function CameraRig({ focusTarget, qualityLevel }) {
  const controlsRef = useRef(null);
  const { camera } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;

    if (!controls || !focusTarget) {
      return;
    }

    const region = BRAIN_REGION_CONFIG.find(r => r.id === focusTarget);
    if (!region) return;

    const duration = qualityLevel === "low" ? 600 : 1000;
    const easing = qualityLevel === "low" ? "easeOutQuad" : "easeOutExpo";

    anime.remove(camera.position);
    anime.remove(controls.target);

    const cameraAnimation = anime({
      targets: camera.position,
      x: region.position[0] * 1.5,
      y: region.position[1] * 1.5 + 1,
      z: region.position[2] * 1.5 + 4,
      duration,
      easing,
      update: () => {
        controls.update();
      },
    });

    const targetAnimation = anime({
      targets: controls.target,
      x: region.position[0],
      y: region.position[1],
      z: region.position[2],
      duration,
      easing,
      update: () => {
        controls.update();
      },
    });

    return () => {
      cameraAnimation.pause();
      targetAnimation.pause();
      anime.remove(camera.position);
      anime.remove(controls.target);
    };
  }, [camera.position, focusTarget, qualityLevel]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      maxDistance={qualityLevel === "low" ? 8 : 11}
      minDistance={qualityLevel === "low" ? 3.5 : 4.8}
      target={[0, 0.5, 0]}
    />
  );
}

function OptimizedBrainAssembly({ isBusy, onSelect, selectedRegion, selectedTool, toolActive, qualityLevel }) {
  const groupRef = useRef(null);

  useEffect(() => {
    if (!groupRef.current) return;

    const scale = qualityLevel === "low" ? 0.85 : 1;

    anime.remove(groupRef.current.scale);
    anime.remove(groupRef.current.rotation);

    anime({
      targets: groupRef.current.scale,
      x: [0.7, scale],
      y: [0.7, scale],
      z: [0.7, scale],
      duration: qualityLevel === "low" ? 800 : 1300,
      easing: "easeOutExpo",
    });

    anime({
      targets: groupRef.current.rotation,
      y: [-0.22, 0],
      x: [0.08, 0.02],
      duration: qualityLevel === "low" ? 900 : 1500,
      easing: "easeOutExpo",
    });
  }, [qualityLevel]);

  const handleRegionClick = (regionId) => {
    if (isBusy) return;

    const region = BRAIN_REGION_CONFIG.find(r => r.id === regionId);
    if (!region) return;

    // Trigger tool effects
    if (selectedTool && toolActive) {
      console.log(`Tool ${selectedTool} used on ${region.name}`);
    }

    onSelect(region.name);
  };

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Optimized brain container */}
      <mesh position={[0, 0.35, 0]} scale={[5.4, 3.6, 3.7]}>
        <sphereGeometry args={[1, qualityLevel === "low" ? 24 : 48, qualityLevel === "low" ? 24 : 48]} />
        <meshStandardMaterial
          color="#0e2135"
          opacity={0.09}
          transparent
          roughness={0.86}
          metalness={0.08}
        />
      </mesh>

      {/* Optimized brain regions */}
      {BRAIN_REGION_CONFIG.map((region) => (
        <OptimizedBrainRegion
          key={region.id}
          isActive={selectedRegion === region.name}
          isBusy={isBusy}
          region={region}
          selectedTool={selectedTool}
          toolActive={toolActive}
          qualityLevel={qualityLevel}
          onClick={() => handleRegionClick(region.id)}
        />
      ))}

      {/* Brain stem */}
      <mesh position={[-0.18, -1.55, -0.2]} scale={[0.34, 1.3, 0.34]}>
        <cylinderGeometry args={[0.7, 0.48, 1, qualityLevel === "low" ? 12 : 24]} />
        <meshStandardMaterial color="#9ef8e8" opacity={0.72} transparent />
      </mesh>
    </group>
  );
}

function OptimizedBrainRegion({ isActive, isBusy, region, selectedTool, toolActive, qualityLevel, onClick }) {
  const meshRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const lodScale = qualityLevel === "low" ? 0.8 : qualityLevel === "medium" ? 0.9 : 1;
  const segmentCount = qualityLevel === "low" ? 16 : 32;

  useEffect(() => {
    if (!meshRef.current) return;

    const emphasis = isActive ? 1.12 : isHovered ? 1.06 : 1;
    const duration = qualityLevel === "low" ? 400 : 700;
    const easing = qualityLevel === "low" ? "easeOutQuad" : "easeOutExpo";

    anime.remove(meshRef.current.scale);
    anime.remove(meshRef.current.position);
    anime.remove(meshRef.current.material);

    anime({
      targets: meshRef.current.scale,
      x: region.scale[0] * emphasis * lodScale,
      y: region.scale[1] * emphasis * lodScale,
      z: region.scale[2] * emphasis * lodScale,
      duration,
      easing,
    });

    anime({
      targets: meshRef.current.position,
      x: region.position[0] + region.radius * 0.3 * (isActive ? 1 : isHovered ? 0.5 : 0),
      y: region.position[1] + region.radius * 0.3 * (isActive ? 1 : isHovered ? 0.5 : 0),
      z: region.position[2] + region.radius * 0.3 * (isActive ? 1 : isHovered ? 0.5 : 0),
      duration,
      easing,
    });

    anime({
      targets: meshRef.current.material,
      opacity: isActive ? 1 : isHovered ? 0.94 : 0.82,
      duration: qualityLevel === "low" ? 300 : 620,
      easing: "easeOutSine",
    });

    // Tool-based color changes
    if (isActive && selectedTool && toolActive) {
      switch (selectedTool) {
        case "scalpel":
          meshRef.current.material.color.setHex(0xff6666);
          break;
        case "cautery":
          meshRef.current.material.color.setHex(0xffaa44);
          break;
        case "forceps":
          meshRef.current.material.color.setHex(0x88ff88);
          break;
        default:
          meshRef.current.material.color.setHex(parseInt(region.color.replace('#', '0x')));
      }
    } else {
      meshRef.current.material.color.setHex(parseInt(region.color.replace('#', '0x')));
    }

    meshRef.current.material.emissiveIntensity = isActive ? 0.42 : isHovered ? 0.22 : 0.08;

    return () => {
      anime.remove(meshRef.current.scale);
      anime.remove(meshRef.current.position);
      anime.remove(meshRef.current.material);
    };
  }, [isActive, isHovered, selectedTool, toolActive, region, qualityLevel]);

  useEffect(() => {
    document.body.style.cursor = isHovered && !isBusy ? "pointer" : "default";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [isBusy, isHovered]);

  const handlePointerOver = () => setIsHovered(true);
  const handlePointerOut = () => setIsHovered(false);

  return (
    <mesh
      ref={meshRef}
      onClick={(event) => {
        event.stopPropagation();
        if (!isBusy) {
          onClick();
        }
      }}
      onPointerOut={handlePointerOut}
      onPointerOver={handlePointerOver}
      position={region.position}
      scale={[
        region.scale[0] * lodScale,
        region.scale[1] * lodScale,
        region.scale[2] * lodScale,
      ]}
    >
      <sphereGeometry args={[region.radius || 0.5, segmentCount, segmentCount]} />
      <meshStandardMaterial
        color={region.color || "#79e9ff"}
        emissive={region.color || "#79e9ff"}
        opacity={0.82}
        roughness={0.24}
        metalness={0.08}
        transparent
      />
    </mesh>
  );
}

function OptimizedToolDisplay({ selectedTool, isActive, selectedRegion, qualityLevel }) {
  if (!selectedTool) return null;

  const toolProps = {
    position: [
      selectedRegion ? selectedRegion.position[0] + 0.5 : 3,
      selectedRegion ? selectedRegion.position[1] + 0.5 : 2,
      selectedRegion ? selectedRegion.position[2] + 0.5 : 2,
    ],
    rotation: [0.5, 0, 0.3],
    isActive,
    qualityLevel,
  };

  // Import tool components dynamically based on quality level
  switch (selectedTool) {
    case "scalpel":
      return <Scalpel {...toolProps} />;
    case "forceps":
      return <Forceps {...toolProps} />;
    case "retractor":
      return <Retractor {...toolProps} />;
    case "suction":
      return <Suction {...toolProps} />;
    case "cautery":
      return <Cautery {...toolProps} />;
    case "microscope":
      return <Microscope {...toolProps} />;
    default:
      return null;
  }
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-cyan-300 animate-pulse">
        🧠 Loading surgical environment...
      </div>
    </div>
  );
}