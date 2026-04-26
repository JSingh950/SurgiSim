import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function BloodSplatter({ position, intensity = 1 }) {
  const dropletsRef = useRef([]);
  const particleCount = 100 * intensity;

  const droplets = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      position: new THREE.Vector3(
        position[0] + (Math.random() - 0.5) * 0.4,
        position[1] + (Math.random() - 0.5) * 0.2,
        position[2] + (Math.random() - 0.5) * 0.4
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        -Math.random() * 0.08 - 0.02,
        (Math.random() - 0.5) * 0.05
      ),
      size: 0.01 + Math.random() * 0.04,
      life: 1.0,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    }));
  }, [position, particleCount, intensity]);

  useFrame((state) => {
    const delta = state.clock.getDelta();
    const time = state.clock.getElapsedTime();

    dropletsRef.current.forEach((droplet, index) => {
      if (droplet.life <= 0) return;

      // Apply physics
      droplet.position.add(droplet.velocity.clone().multiplyScalar(delta * 60));
      droplet.velocity.y -= 0.15 * delta * 60; // Gravity

      // Add some air resistance
      droplet.velocity.multiplyScalar(0.99);

      // Rotate droplet
      droplet.rotation += droplet.rotationSpeed * delta * 60;

      // Fade out
      droplet.life -= 0.3 * delta;
      droplet.size *= 0.998;

      // Remove dead droplets
      if (droplet.life <= 0) {
        dropletsRef.current.splice(index, 1);
      }
    });
  });

  return (
    <group>
      {droplets.map((droplet, i) => (
        <mesh key={i} position={droplet.position}>
          <sphereGeometry args={[droplet.size, 4, 4]} />
          <meshStandardMaterial
            color={0x8b0000}
            transparent
            opacity={droplet.life * 0.8}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

export function FluidDynamics({ position, color = "#4a90d9", intensity = 1 }) {
  const groupRef = useRef(null);
  const particlesRef = useRef([]);
  const particleCount = 80 * intensity;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Create new particles
    if (Math.random() > 0.85) {
      const particle = {
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 0.3,
          position[1] + (Math.random() - 0.5) * 0.2,
          position[2] + (Math.random() - 0.5) * 0.3
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.03,
          -0.02 - Math.random() * 0.01,
          (Math.random() - 0.5) * 0.03
        ),
        size: 0.02 + Math.random() * 0.05,
        life: 1.0,
        opacity: 0.6 + Math.random() * 0.4,
      };
      particlesRef.current.push(particle);
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    particlesRef.current.forEach(p => {
      p.position.add(p.velocity);
      p.velocity.y -= 0.005; // Suction upward
      p.life -= 0.02;
      p.size *= 0.997;
    });

    // Limit particle count
    if (particlesRef.current.length > particleCount) {
      particlesRef.current = particlesRef.current.slice(-particleCount);
    }
  });

  return (
    <group>
      {particlesRef.current.map((p, i) => (
        <mesh key={i} position={p.position}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={p.life * p.opacity}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

export function TissueDeformation({ position, isActive = false, intensity = 1 }) {
  const meshRef = useRef(null);
  const originalPositions = useRef([]);

  useEffect(() => {
    if (!meshRef.current) return;

    // Store original vertex positions
    const geometry = meshRef.current.geometry;
    const positions = geometry.attributes.position;
    originalPositions.current = new Float32Array(positions.array);
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !isActive) return;

    const time = state.clock.getElapsedTime();
    const geometry = meshRef.current.geometry;
    const positions = geometry.attributes.position.array;

    // Apply wave deformation
    for (let i = 0; i < positions.length; i += 3) {
      const x = originalPositions.current[i];
      const y = originalPositions.current[i + 1];
      const z = originalPositions.current[i + 2];

      // Calculate distance from center
      const dx = x - position[0];
      const dy = y - position[1];
      const dz = z - position[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Apply wave effect based on distance
      const wave = Math.sin(distance * 10 - time * 3) * 0.05 * intensity;

      positions[i] = x + dx * wave;
      positions[i + 1] = y + dy * wave;
      positions[i + 2] = z + dz * wave;
    }

    positions.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={0x79e9ff}
        transparent
        opacity={0.6}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  );
}

export function SurgicalLighting({ position, isActive = false, toolType = "scalpel" }) {
  const lightRef = useRef(null);
  const intensityRef = useRef(0);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (isActive && lightRef.current) {
      // Pulsing effect
      intensityRef.current = 0.8 + Math.sin(time * 4) * 0.4;
      lightRef.current.intensity = intensityRef.current;

      // Color based on tool type
      switch (toolType) {
        case "scalpel":
          lightRef.current.color.setHex(0xff4444);
          break;
        case "cautery":
          lightRef.current.color.setHex(0xff6600);
          break;
        case "forceps":
          lightRef.current.color.setHex(0x88ff88);
          break;
        default:
          lightRef.current.color.setHex(0xffffff);
      }
    } else if (lightRef.current) {
      // Fade out when inactive
      lightRef.current.intensity *= 0.95;
    }
  });

  const getLightColor = () => {
    switch (toolType) {
      case "scalpel":
        return "#ff4444";
      case "cautery":
        return "#ff6600";
      case "forceps":
        return "#88ff88";
      default:
        return "#ffffff";
    }
  };

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={getLightColor()}
      intensity={isActive ? 1.2 : 0}
      distance={1.5}
      decay={2}
    >
      {/* Visual glow when active */}
      {isActive && (
        <mesh position={position}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial
            color={getLightColor()}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </pointLight>
  );
}

export function ParticleBurst({ position, count = 30, color = "#00ff88" }) {
  const particlesRef = useRef([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isAnimating) return;

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, () => ({
      position: position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.15
      ),
      life: 1.0,
      size: 0.02 + Math.random() * 0.03,
    }));

    setIsAnimating(false);
  }, [isAnimating, position, count]);

  useFrame((state) => {
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    particlesRef.current.forEach(p => {
      p.position.add(p.velocity);
      p.velocity.multiplyScalar(0.97);
      p.life -= 0.02;
      p.size *= 0.995;
    });
  });

  const triggerBurst = () => {
    setIsAnimating(true);
  };

  return (
    <group>
      {particlesRef.current.map((p, i) => (
        <mesh key={i} position={p.position}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={p.life * 0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

export default {
  BloodSplatter,
  FluidDynamics,
  TissueDeformation,
  SurgicalLighting,
  ParticleBurst,
};