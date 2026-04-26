import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function BloodParticles({ position, intensity = 1 }) {
  const particlesRef = useRef([]);
  const geometryRef = useRef();
  const materialRef = useRef();

  const particleCount = Math.floor(50 * intensity);
  const positions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  const colors = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  const sizes = useMemo(() => new Float32Array(particleCount), [particleCount]);
  const velocities = useMemo(() => [], [particleCount]);

  // Initialize particles
  useMemo(() => {
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = position[0] + (Math.random() - 0.5) * 0.3;
      positions[i3 + 1] = position[1] + (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = position[2] + (Math.random() - 0.5) * 0.3;

      // Blood color variations (dark red to bright red)
      const colorVariation = Math.random();
      colors[i3] = 0.8 + colorVariation * 0.2;     // R
      colors[i3 + 1] = 0.1 + colorVariation * 0.1;   // G
      colors[i3 + 2] = 0.1 + colorVariation * 0.1;   // B

      sizes[i] = 0.02 + Math.random() * 0.04;

      velocities[i] = {
        x: (Math.random() - 0.5) * 0.03,
        y: -0.02 - Math.random() * 0.03,
        z: (Math.random() - 0.5) * 0.03,
        life: 1.0,
      };
    }
  }, [position, particleCount]);

  useFrame(() => {
    if (!geometryRef.current || !materialRef.current) return;

    const posAttribute = geometryRef.current.attributes.position;
    const colorAttribute = geometryRef.current.attributes.color;
    const sizeAttribute = geometryRef.current.attributes.size;

    for (let i = 0; i < particleCount; i++) {
      const v = velocities[i];
      if (v.life <= 0) continue;

      const i3 = i * 3;

      // Update position
      positions[i3] += v.x;
      positions[i3 + 1] += v.y;
      positions[i3 + 2] += v.z;

      // Add gravity and spread
      v.y -= 0.001;
      v.x *= 0.99;
      v.z *= 0.99;

      // Fade out
      v.life -= 0.015;

      // Update color (fade to brown)
      if (v.life < 0.5) {
        const fade = v.life * 2;
        colors[i3] = 0.6 * fade + 0.3 * (1 - fade);
        colors[i3 + 1] = 0.1 * fade + 0.2 * (1 - fade);
        colors[i3 + 2] = 0.1 * fade + 0.2 * (1 - fade);
      }

      // Update size
      sizes[i] = Math.max(0.001, sizes[i] * 0.995);
    }

    // Update geometry attributes
    posAttribute.array.set(positions);
    colorAttribute.array.set(colors);
    sizeAttribute.array.set(sizes);

    posAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    sizeAttribute.needsUpdate = true;
  });

  return (
    <points ref={geometryRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function FluidParticles({ position, color = "#4a90d9", intensity = 1 }) {
  const particlesRef = useRef([]);
  const particleCount = Math.floor(30 * intensity);

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      position: new THREE.Vector3(
        position[0] + (Math.random() - 0.5) * 0.2,
        position[1] + (Math.random() - 0.5) * 0.2,
        position[2] + (Math.random() - 0.5) * 0.2
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        -0.01 - Math.random() * 0.02,
        (Math.random() - 0.5) * 0.02
      ),
      size: 0.03 + Math.random() * 0.05,
      life: Math.random(),
    }));
  }, [position, particleCount]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    particles.forEach((p, index) => {
      if (p.life <= 0) {
        // Reset particle
        p.position.set(
          position[0] + (Math.random() - 0.5) * 0.2,
          position[1] + (Math.random() - 0.5) * 0.2,
          position[2] + (Math.random() - 0.5) * 0.2
        );
        p.velocity.set(
          (Math.random() - 0.5) * 0.02,
          -0.01 - Math.random() * 0.02,
          (Math.random() - 0.5) * 0.02
        );
        p.life = Math.random();
      } else {
        // Update particle
        p.position.add(p.velocity);
        p.velocity.y -= 0.002;
        p.life -= 0.01;
        p.size *= 0.99;
      }
    });
  });

  return (
    <group>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position.toArray()}>
          <sphereGeometry args={[p.size, 4, 4]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={p.life * 0.6}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function CauteryEffect({ position, intensity = 1 }) {
  const groupRef = useRef();
  const particlesRef = useRef([]);

  const particleCount = Math.floor(20 * intensity);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Create smoke particles
    if (Math.random() > 0.7) {
      const particle = {
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 0.1,
          position[1],
          position[2] + (Math.random() - 0.5) * 0.1
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          0.02 + Math.random() * 0.01,
          (Math.random() - 0.5) * 0.02
        ),
        size: 0.05 + Math.random() * 0.05,
        life: 1.0,
      };
      particlesRef.current.push(particle);
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    particlesRef.current.forEach(p => {
      p.position.add(p.velocity);
      p.velocity.y += 0.001;
      p.life -= 0.02;
      p.size *= 0.99;
    });

    // Limit particle count
    if (particlesRef.current.length > 50) {
      particlesRef.current = particlesRef.current.slice(-50);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core glow */}
      <mesh position={position}>
        <sphereGeometry args={[0.1 * intensity, 8, 8]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Inner hot spot */}
      <mesh position={position}>
        <sphereGeometry args={[0.05 * intensity, 8, 8]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Sparks */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            position[0] + Math.cos(i * 1.2) * 0.15 * intensity,
            position[1] + Math.sin(i * 1.2) * 0.15 * intensity,
            position[2]
          ]}
        >
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshBasicMaterial
            color="#ffff00"
            transparent
            opacity={0.6 + Math.sin(Date.now() * 0.01 + i) * 0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

export function IncisionEffect({ position, direction = [0, 1, 0], progress = 0 }) {
  const lineRef = useRef();

  const lineLength = 0.3 * progress;

  return (
    <line ref={lineRef}>
      <bufferGeometry
        attach="geometry"
        onUpdate={geo => {
          const points = [
            new THREE.Vector3(...position),
            new THREE.Vector3(
              position[0] + direction[0] * lineLength,
              position[1] + direction[1] * lineLength,
              position[2] + direction[2] * lineLength
            ),
          ];
          geo.setFromPoints(points);
        }}
      />
      <lineBasicMaterial
        color="#ff3333"
        linewidth={2}
        transparent
        opacity={0.8}
      />
    </line>
  );
}

export function TissueManipulationEffect({ position, intensity = 1 }) {
  const groupRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.scale.setScalar(
        1 + Math.sin(time * 4) * 0.1 * intensity
      );
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Manipulation ring */}
      <mesh>
        <torusGeometry args={[0.2, 0.02, 8, 32]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Target indicators */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2 + Date.now() * 0.002;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.2,
              Math.sin(angle) * 0.2,
              0
            ]}
          >
            <sphereGeometry args={[0.02, 4, 4]} />
            <meshBasicMaterial
              color="#00ff88"
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}