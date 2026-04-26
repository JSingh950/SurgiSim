import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import anime from "animejs";

const TOOLS = {
  scalpel: {
    name: "Scalpel",
    color: "#e0e0e0",
    bladeColor: "#c0c0c0",
    handleColor: "#2a2a2a",
  },
  forceps: {
    name: "Forceps",
    color: "#b0b0b0",
    tipColor: "#d0d0d0",
    handleColor: "#1a1a1a",
  },
  retractor: {
    name: "Retractor",
    color: "#909090",
    bladeColor: "#a0a0a0",
    handleColor: "#1a1a1a",
  },
  suction: {
    name: "Suction",
    color: "#4a90d9",
    tubeColor: "#3a80c9",
    tipColor: "#2a70b9",
  },
  cautery: {
    name: "Cautery",
    color: "#ff6b6b",
    tipColor: "#ff4444",
    glowColor: "#ffaa00",
  },
  microscope: {
    name: "Microscope",
    color: "#2a2a2a",
    lensColor: "#87ceeb",
    bodyColor: "#1a1a1a",
  },
};

export function Scalpel({ position, rotation = [0, 0, 0], isActive }) {
  const groupRef = useRef(null);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.z = Math.sin(time * 2) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Handle */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
        <meshStandardMaterial
          color={TOOLS.scalpel.handleColor}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Blade */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.02, 0.4, 0.08]} />
        <meshStandardMaterial
          color={TOOLS.scalpel.bladeColor}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Cutting edge glow when active */}
      {isActive && (
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.03, 0.02, 0.1]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

export function Forceps({ position, rotation = [0, 0, 0], isActive, isOpen = true }) {
  const groupRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      const time = state.clock.getElapsedTime();
      const openAmount = isOpen ? 0.15 : 0.02;
      leftArmRef.current.rotation.x = Math.sin(time * 3) * 0.05 + openAmount;
      rightArmRef.current.rotation.x = -Math.sin(time * 3) * 0.05 - openAmount;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Handle */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 16]} />
        <meshStandardMaterial
          color={TOOLS.forceps.handleColor}
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      {/* Left arm */}
      <mesh ref={leftArmRef} position={[-0.08, 0.35, 0]}>
        <boxGeometry args={[0.03, 0.4, 0.04]} />
        <meshStandardMaterial
          color={TOOLS.forceps.color}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.08, 0.35, 0]}>
        <boxGeometry args={[0.03, 0.4, 0.04]} />
        <meshStandardMaterial
          color={TOOLS.forceps.color}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Grip tips */}
      {isActive && (
        <>
          <mesh position={[-0.08, 0.57, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial
              color={TOOLS.forceps.tipColor}
              emissive="#ff6600"
              emissiveIntensity={0.3}
            />
          </mesh>
          <mesh position={[0.08, 0.57, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial
              color={TOOLS.forceps.tipColor}
              emissive="#ff6600"
              emissiveIntensity={0.3}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

export function Retractor({ position, rotation = [0, 0, 0], isActive }) {
  const groupRef = useRef(null);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Handle */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
        <meshStandardMaterial
          color={TOOLS.retractor.handleColor}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Blade */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.02, 0.3, 0.15]} />
        <meshStandardMaterial
          color={TOOLS.retractor.bladeColor}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Retraction glow when active */}
      {isActive && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.25, 0.02, 0.2]} />
          <meshBasicMaterial
            color="#00ff88"
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
    </group>
  );
}

export function Suction({ position, rotation = [0, 0, 0], isActive, isSuctioning = false }) {
  const groupRef = useRef(null);
  const particlesRef = useRef([]);

  useFrame((state) => {
    if (groupRef.current && isActive && isSuctioning) {
      const time = state.clock.getElapsedTime();

      // Create suction particles
      if (Math.random() > 0.85) {
        const particle = {
          position: new THREE.Vector3(
            position[0] + (Math.random() - 0.5) * 0.1,
            position[1] - 0.5,
            position[2] + (Math.random() - 0.5) * 0.1
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            -0.05,
            (Math.random() - 0.5) * 0.02
          ),
          life: 1.0
        };
        particlesRef.current.push(particle);
      }

      // Update particles
      particlesRef.current.forEach((p, index) => {
        p.position.add(p.velocity);
        p.life -= 0.02;
        if (p.life <= 0) {
          particlesRef.current.splice(index, 1);
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Handle */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
        <meshStandardMaterial
          color={TOOLS.suction.tubeColor}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Tube */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.04, 0.03, 0.3, 16]} />
        <meshStandardMaterial
          color={TOOLS.suction.tubeColor}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Tip */}
      <mesh position={[0, -0.45, 0]}>
        <coneGeometry args={[0.03, 0.08, 8]} />
        <meshStandardMaterial
          color={TOOLS.suction.tipColor}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Suction effect when active */}
      {isActive && isSuctioning && (
        <mesh position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial
            color="#4a90d9"
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

export function Cautery({ position, rotation = [0, 0, 0], isActive, isBurning = false }) {
  const groupRef = useRef(null);
  const glowRef = useRef(null);

  useFrame((state) => {
    if (groupRef.current && isActive && isBurning) {
      const time = state.clock.getElapsedTime();

      // Pulsing glow effect
      if (glowRef.current) {
        glowRef.current.material.opacity = 0.5 + Math.sin(time * 10) * 0.3;
        glowRef.current.scale.setScalar(1 + Math.sin(time * 8) * 0.2);
      }

      // Subtle tool vibration
      groupRef.current.position.x = position[0] + Math.sin(time * 20) * 0.003;
      groupRef.current.position.z = position[2] + Math.cos(time * 20) * 0.003;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Handle */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 16]} />
        <meshStandardMaterial
          color={TOOLS.cautery.color}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Tip */}
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.02, 0.1, 8]} />
        <meshStandardMaterial
          color={TOOLS.cautery.tipColor}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Cautery glow when active and burning */}
      {isActive && isBurning && (
        <mesh ref={glowRef} position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial
            color={TOOLS.cautery.glowColor}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

export function Microscope({ position, rotation = [0, 0, 0], isActive, zoomLevel = 1 }) {
  const groupRef = useRef(null);
  const lensRef = useRef(null);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      const time = state.clock.getElapsedTime();

      // Subtle breathing effect
      groupRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.01;

      // Lens zoom effect
      if (lensRef.current) {
        lensRef.current.scale.setScalar(1 + (zoomLevel - 1) * 0.3);
      }
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.8, 16]} />
        <meshStandardMaterial
          color={TOOLS.microscope.bodyColor}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Lens housing */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.2, 16]} />
        <meshStandardMaterial
          color={TOOLS.microscope.bodyColor}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Lens */}
      <mesh ref={lensRef} position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
        <meshStandardMaterial
          color={TOOLS.microscope.lensColor}
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Scope tube */}
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 16]} />
        <meshStandardMaterial
          color={TOOLS.microscope.bodyColor}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Active glow ring */}
      {isActive && (
        <mesh position={[0, 0.45, 0]}>
          <torusGeometry args={[0.12, 0.01, 8, 32]} />
          <meshBasicMaterial
            color="#00ff88"
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

export default TOOLS;