import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import anime from "animejs";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Scalpel,
  Forceps,
  Retractor,
  Suction,
  Cautery,
  Microscope,
} from "./SurgicalTools.jsx";
import {
  BloodParticles,
  FluidParticles,
  CauteryEffect,
  IncisionEffect,
  TissueManipulationEffect,
} from "./SurgicalEffects.jsx";

const BRAIN_REGIONS = [
  {
    name: "Frontal Lobe",
    color: "#79e9ff",
    geometry: "sphere",
    position: [1.65, 0.62, 0.7],
    scale: [1.82, 1.32, 1.5],
    activeLift: [0.18, 0.04, 0.12],
    cameraPosition: [4.8, 2.1, 5.2],
    target: [1.55, 0.52, 0.48],
  },
  {
    name: "Parietal Lobe",
    color: "#9dffdf",
    geometry: "sphere",
    position: [0.15, 1.1, 0.15],
    scale: [1.55, 1.18, 1.46],
    activeLift: [0.04, 0.18, 0.06],
    cameraPosition: [0.4, 4.9, 6.2],
    target: [0.12, 0.98, 0.08],
  },
  {
    name: "Temporal Lobe",
    color: "#74ffc9",
    geometry: "box",
    position: [0.9, -0.45, 0.2],
    scale: [1.76, 0.92, 1.46],
    activeLift: [0.11, -0.06, 0.12],
    cameraPosition: [4.3, 0.45, 5.9],
    target: [0.88, -0.3, 0.14],
  },
  {
    name: "Occipital Lobe",
    color: "#4dd0ff",
    geometry: "sphere",
    position: [-1.55, 0.35, -0.16],
    scale: [1.34, 1.12, 1.16],
    activeLift: [-0.16, 0.02, -0.08],
    cameraPosition: [-4.4, 1.2, 4.8],
    target: [-1.42, 0.35, -0.08],
  },
  {
    name: "Cerebellum",
    color: "#5bffc8",
    geometry: "sphere",
    position: [-0.78, -1.18, -0.62],
    scale: [1.06, 0.88, 0.94],
    activeLift: [-0.08, -0.12, -0.18],
    cameraPosition: [-2.2, -2.1, 4.6],
    target: [-0.72, -1.02, -0.48],
  },
];

export default function BrainCanvas({
  isBusy,
  onSelect,
  selectedRegion,
  selectedTool = null,
  toolActive = false,
  microscopeMode = false,
}) {
  const focusTarget = useMemo(
    () => BRAIN_REGIONS.find((region) => region.name === selectedRegion) ?? null,
    [selectedRegion],
  );

  const [effects, setEffects] = useState({
    blood: [],
    fluid: [],
    cautery: null,
    incision: null,
    manipulation: null,
  });

  // Add surgical effect
  const addEffect = (type, data) => {
    setEffects(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), { ...data, id: Date.now() }],
    }));
  };

  // Clear effects after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setEffects({
        blood: [],
        fluid: [],
        cautery: null,
        incision: null,
        manipulation: null,
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [selectedTool, toolActive]);

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 1.35, 8.1], fov: microscopeMode ? 25 : 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#020711"]} />
        <fog attach="fog" args={["#020711", 9, 17]} />
        <ambientLight intensity={microscopeMode ? 1.5 : 1.1} />
        <directionalLight position={[6, 8, 6]} intensity={1.6} color="#d5fbff" />
        <directionalLight position={[-6, -3, 2]} intensity={0.45} color="#1ed7b4" />
        <pointLight position={[0, 4, -6]} intensity={0.55} color="#74f7ff" />

        {/* Additional lights for microscope mode */}
        {microscopeMode && (
          <>
            <spotLight
              position={[2, 2, 2]}
              angle={0.3}
              penumbra={0.2}
              intensity={2}
              color="#ffffff"
            />
            <pointLight position={[0, 1, 0]} intensity={1} color="#ffffff" />
          </>
        )}

        <Suspense fallback={null}>
          <CameraRig focusTarget={focusTarget} microscopeMode={microscopeMode} />
          <BrainAssembly
            isBusy={isBusy}
            onSelect={onSelect}
            selectedRegion={selectedRegion}
            selectedTool={selectedTool}
            toolActive={toolActive}
            onAddEffect={addEffect}
          />
          <ToolDisplay
            selectedTool={selectedTool}
            isActive={toolActive}
            selectedRegion={selectedRegion}
          />
          <EffectsDisplay effects={effects} selectedTool={selectedTool} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function CameraRig({ focusTarget, microscopeMode }) {
  const controlsRef = useRef(null);
  const { camera } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;

    if (!controls || !focusTarget) {
      return;
    }

    anime.remove(camera.position);
    anime.remove(controls.target);

    const cameraAnimation = anime({
      targets: camera.position,
      x: focusTarget.cameraPosition[0],
      y: focusTarget.cameraPosition[1],
      z: focusTarget.cameraPosition[2],
      duration: 1000,
      easing: "easeOutExpo",
      update: () => {
        controls.update();
      },
    });

    const targetAnimation = anime({
      targets: controls.target,
      x: focusTarget.target[0],
      y: focusTarget.target[1],
      z: focusTarget.target[2],
      duration: 1000,
      easing: "easeOutExpo",
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
  }, [camera.position, focusTarget]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      maxDistance={microscopeMode ? 6 : 11}
      minDistance={microscopeMode ? 2 : 4.8}
      target={[0, 0.5, 0]}
    />
  );
}

function BrainAssembly({ isBusy, onSelect, selectedRegion, selectedTool, toolActive, onAddEffect }) {
  const groupRef = useRef(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  useEffect(() => {
    if (!groupRef.current) {
      return;
    }

    anime.remove(groupRef.current.scale);
    anime.remove(groupRef.current.rotation);

    const scaleAnimation = anime({
      targets: groupRef.current.scale,
      x: [0.84, 1],
      y: [0.84, 1],
      z: [0.84, 1],
      duration: 1300,
      easing: "easeOutExpo",
    });

    const rotationAnimation = anime({
      targets: groupRef.current.rotation,
      y: [-0.22, 0],
      x: [0.08, 0.02],
      duration: 1500,
      easing: "easeOutExpo",
    });

    return () => {
      scaleAnimation.pause();
      rotationAnimation.pause();
      anime.remove(groupRef.current.scale);
      anime.remove(groupRef.current.rotation);
    };
  }, []);

  const handleRegionClick = (regionName) => {
    if (!isBusy && selectedTool && toolActive) {
      // Trigger surgical effects based on tool
      const region = BRAIN_REGIONS.find(r => r.name === regionName);

      switch (selectedTool) {
        case 'scalpel':
          onAddEffect('incision', { position: region.position, progress: 0 });
          onAddEffect('blood', { position: region.position, intensity: 1 });
          break;
        case 'cautery':
          onAddEffect('cautery', { position: region.position, intensity: 1 });
          break;
        case 'forceps':
          onAddEffect('manipulation', { position: region.position, intensity: 1 });
          break;
        case 'suction':
          onAddEffect('fluid', { position: region.position, intensity: 1 });
          break;
        default:
          break;
      }
    }

    onSelect(regionName);
  };

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Skull/brain container */}
      <mesh position={[0, 0.35, 0]} scale={[5.4, 3.6, 3.7]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          color="#0e2135"
          opacity={0.09}
          transparent
          roughness={0.86}
          metalness={0.08}
        />
      </mesh>

      {BRAIN_REGIONS.map((region) => (
        <BrainRegion
          isActive={selectedRegion === region.name}
          isBusy={isBusy}
          isHovered={hoveredRegion === region.name}
          key={region.name}
          onSelect={() => handleRegionClick(region.name)}
          onHover={setHoveredRegion}
          selectedTool={selectedTool}
          toolActive={toolActive}
          region={region}
        />
      ))}

      {/* Brain stem */}
      <mesh position={[-0.18, -1.55, -0.2]} scale={[0.34, 1.3, 0.34]}>
        <cylinderGeometry args={[0.7, 0.48, 1, 24]} />
        <meshStandardMaterial color="#9ef8e8" opacity={0.72} transparent />
      </mesh>
    </group>
  );
}

function BrainRegion({ isActive, isBusy, isHovered, onSelect, onHover, selectedTool, toolActive, region }) {
  const meshRef = useRef(null);

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }

    const mesh = meshRef.current;
    const emphasis = isActive ? 1.12 : isHovered ? 1.06 : 1;
    const offsetFactor = isActive ? 1 : isHovered ? 0.55 : 0;

    anime.remove(mesh.scale);
    anime.remove(mesh.position);
    anime.remove(mesh.material);

    const scaleAnimation = anime({
      targets: mesh.scale,
      x: region.scale[0] * emphasis,
      y: region.scale[1] * emphasis,
      z: region.scale[2] * emphasis,
      duration: 700,
      easing: "easeOutExpo",
    });

    const positionAnimation = anime({
      targets: mesh.position,
      x: region.position[0] + region.activeLift[0] * offsetFactor,
      y: region.position[1] + region.activeLift[1] * offsetFactor,
      z: region.position[2] + region.activeLift[2] * offsetFactor,
      duration: 700,
      easing: "easeOutExpo",
    });

    const materialAnimation = anime({
      targets: mesh.material,
      opacity: isActive ? 1 : isHovered ? 0.94 : 0.82,
      duration: 620,
      easing: "easeOutSine",
    });

    mesh.material.emissiveIntensity = isActive ? 0.42 : isHovered ? 0.22 : 0.08;

    // Add tool-specific effects
    if (isActive && selectedTool && toolActive) {
      switch (selectedTool) {
        case 'scalpel':
          mesh.material.color.setHex(0xff6666); // Red tint
          break;
        case 'cautery':
          mesh.material.color.setHex(0xffaa44); // Burnt orange
          break;
        case 'forceps':
          mesh.material.color.setHex(0x88ff88); // Green tint
          break;
        default:
          break;
      }
    } else {
      mesh.material.color.setHex(parseInt(region.color.replace('#', '0x')));
    }

    return () => {
      scaleAnimation.pause();
      positionAnimation.pause();
      materialAnimation.pause();
      anime.remove(mesh.scale);
      anime.remove(mesh.position);
      anime.remove(mesh.material);
    };
  }, [isActive, isHovered, selectedTool, toolActive, region]);

  useEffect(() => {
    document.body.style.cursor = isHovered && !isBusy ? "pointer" : "default";

    return () => {
      document.body.style.cursor = "default";
    };
  }, [isBusy, isHovered]);

  return (
    <mesh
      ref={meshRef}
      onClick={(event) => {
        event.stopPropagation();
        if (!isBusy) {
          onSelect();
        }
      }}
      onPointerOut={() => onHover(null)}
      onPointerOver={() => onHover(region.name)}
      position={region.position}
      scale={region.scale}
    >
      <RegionGeometry type={region.geometry} />
      <meshStandardMaterial
        color={region.color}
        emissive={region.color}
        opacity={0.82}
        roughness={0.24}
        metalness={0.08}
        transparent
      />
    </mesh>
  );
}

function ToolDisplay({ selectedTool, isActive, selectedRegion }) {
  const toolPosition = useMemo(() => {
    if (!selectedRegion) return [3, 2, 2];

    const region = BRAIN_REGIONS.find(r => r.name === selectedRegion);
    return [
      region.position[0] + 0.5,
      region.position[1] + 0.5,
      region.position[2] + 0.5,
    ];
  }, [selectedRegion, selectedTool]);

  if (!selectedTool) return null;

  const toolProps = {
    position: toolPosition,
    rotation: [0.5, 0, 0.3],
    isActive,
  };

  switch (selectedTool) {
    case 'scalpel':
      return <Scalpel {...toolProps} />;
    case 'forceps':
      return <Forceps {...toolProps} isOpen={!isActive} />;
    case 'retractor':
      return <Retractor {...toolProps} />;
    case 'suction':
      return <Suction {...toolProps} isSuctioning={isActive} />;
    case 'cautery':
      return <Cautery {...toolProps} isBurning={isActive} />;
    case 'microscope':
      return <Microscope {...toolProps} zoomLevel={isActive ? 2 : 1} />;
    default:
      return null;
  }
}

function EffectsDisplay({ effects, selectedTool }) {
  return (
    <group>
      {/* Blood effects */}
      {effects.blood?.map(effect => (
        <BloodParticles
          key={effect.id}
          position={effect.position}
          intensity={effect.intensity}
        />
      ))}

      {/* Fluid effects */}
      {effects.fluid?.map(effect => (
        <FluidParticles
          key={effect.id}
          position={effect.position}
          intensity={effect.intensity}
        />
      ))}

      {/* Cautery effect */}
      {effects.cautery && selectedTool === 'cautery' && (
        <CauteryEffect
          position={effects.cautery.position}
          intensity={effects.cautery.intensity}
        />
      )}

      {/* Incision effect */}
      {effects.incision && selectedTool === 'scalpel' && (
        <IncisionEffect
          position={effects.incision.position}
          progress={effects.incision.progress}
        />
      )}

      {/* Manipulation effect */}
      {effects.manipulation && selectedTool === 'forceps' && (
        <TissueManipulationEffect
          position={effects.manipulation.position}
          intensity={effects.manipulation.intensity}
        />
      )}
    </group>
  );
}

function RegionGeometry({ type }) {
  if (type === "box") {
    return <boxGeometry args={[1.55, 1.05, 1.18]} />;
  }

  return <sphereGeometry args={[1, 40, 40]} />;
}