import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import anime from "animejs";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

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
}) {
  const focusTarget = useMemo(
    () => BRAIN_REGIONS.find((region) => region.name === selectedRegion) ?? null,
    [selectedRegion],
  );

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 1.35, 8.1], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#020711"]} />
        <fog attach="fog" args={["#020711", 9, 17]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[6, 8, 6]} intensity={1.6} color="#d5fbff" />
        <directionalLight position={[-6, -3, 2]} intensity={0.45} color="#1ed7b4" />
        <pointLight position={[0, 4, -6]} intensity={0.55} color="#74f7ff" />

        <Suspense fallback={null}>
          <CameraRig focusTarget={focusTarget} />
          <BrainAssembly
            isBusy={isBusy}
            onSelect={onSelect}
            selectedRegion={selectedRegion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

function CameraRig({ focusTarget }) {
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
      maxDistance={11}
      minDistance={4.8}
      target={[0, 0.5, 0]}
    />
  );
}

function BrainAssembly({ isBusy, onSelect, selectedRegion }) {
  const groupRef = useRef(null);

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

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
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
          key={region.name}
          onSelect={onSelect}
          region={region}
        />
      ))}

      <mesh position={[-0.18, -1.55, -0.2]} scale={[0.34, 1.3, 0.34]}>
        <cylinderGeometry args={[0.7, 0.48, 1, 24]} />
        <meshStandardMaterial color="#9ef8e8" opacity={0.72} transparent />
      </mesh>
    </group>
  );
}

function BrainRegion({ isActive, isBusy, onSelect, region }) {
  const meshRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

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

    return () => {
      scaleAnimation.pause();
      positionAnimation.pause();
      materialAnimation.pause();
      anime.remove(mesh.scale);
      anime.remove(mesh.position);
      anime.remove(mesh.material);
    };
  }, [isActive, isHovered, region]);

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
          onSelect(region.name);
        }
      }}
      onPointerOut={() => setIsHovered(false)}
      onPointerOver={() => setIsHovered(true)}
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

function RegionGeometry({ type }) {
  if (type === "box") {
    return <boxGeometry args={[1.55, 1.05, 1.18]} />;
  }

  return <sphereGeometry args={[1, 40, 40]} />;
}

// Configuration for brain model source
const BRAIN_MODEL_CONFIG = {
  useRealModel: false, // Set to true when you have a real brain.glb
  modelPath: "/models/brain.glb", // Path to real brain model
  fallbackToGeometric: true, // Fall back to geometric shapes if model fails
};

function RealBrainModel({
  modelPath,
  isBusy,
  onSelect,
  selectedRegion,
  fallback = true,
}) {
  const [error, setError] = useState(null);
  const [loadedModel, setLoadedModel] = useState(null);

  useEffect(() => {
    try {
      const model = useGLTF(modelPath);
      setLoadedModel(model);
      setError(null);
    } catch (err) {
      console.error("Failed to load brain model:", err);
      setError(err.message);
      if (fallback) {
        console.log("Falling back to geometric brain representation");
      }
    }
  }, [modelPath, fallback]);

  if (error && fallback) {
    return (
      <BrainAssembly
        isBusy={isBusy}
        onSelect={onSelect}
        selectedRegion={selectedRegion}
      />
    );
  }

  if (error) {
    return (
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ff6b6b" wireframe />
      </mesh>
    );
  }

  if (!loadedModel) {
    return (
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#4dd0ff" opacity={0.5} transparent wireframe />
      </mesh>
    );
  }

  return (
    <group position={[0, 0.2, 0]} scale={[1.5, 1.5, 1.5]}>
      <primitive
        object={loadedModel.scene}
        onClick={(event) => {
          event.stopPropagation();
          if (onSelect && !isBusy) {
            const clickedPart = event.object;
            const regionName =
              clickedPart.name ||
              clickedPart.userData?.region ||
              "Brain Region";
            onSelect(regionName);
          }
        }}
        onPointerOver={(event) => {
          document.body.style.cursor = isBusy ? "default" : "pointer";
          // Highlight effect on hover
          if (event.object.material && !isBusy) {
            event.object.material.emissive = new THREE.Color("#4dd0ff");
            event.object.material.emissiveIntensity = 0.3;
          }
        }}
        onPointerOut={(event) => {
          document.body.style.cursor = "default";
          // Remove highlight effect
          if (event.object.material) {
            event.object.material.emissive = new THREE.Color("#000000");
            event.object.material.emissiveIntensity = 0;
          }
        }}
      />
    </group>
  );
}
