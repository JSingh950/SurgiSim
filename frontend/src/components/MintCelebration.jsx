import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, PerspectiveCamera, Environment } from "@react-three/drei";
import * as THREE from "three";
import anime from "animejs";

export default function MintCelebration({
  isOpen,
  onClose,
  certificateData = {
    recipient: "Dr. Surgeon",
    achievement: "Neurosurgical Mastery",
    date: new Date().toLocaleDateString(),
    tokenId: "CERT-2024-001",
  },
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Trigger entrance animation
      anime({
        targets: containerRef.current,
        opacity: [0, 1],
        duration: 800,
        easing: "easeOutExpo",
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl"
    >
      <div className="absolute inset-0 overflow-hidden">
        <ParticleField />
      </div>

      <div className="relative z-10 w-full max-w-4xl p-4">
        <div className="rounded-3xl border border-amber-400/30 bg-slate-900/80 p-6 shadow-2xl shadow-amber-500/20">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-amber-400">
                🏆 Certificate Minted Successfully!
              </h2>
              <p className="mt-2 text-slate-300">
                Your achievement has been recorded on the Solana blockchain
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-600 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* 3D Certificate */}
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-950">
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 0, 5]} />
              <Environment preset="city" />

              <Certificate3D certificateData={certificateData} />

              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} color="#ffd700" />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff6b6b" />
            </Canvas>
          </div>

          {/* Certificate Details */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Recipient</p>
              <p className="mt-1 text-lg font-semibold text-amber-300">
                {certificateData.recipient}
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Achievement</p>
              <p className="mt-1 text-lg font-semibold text-amber-300">
                {certificateData.achievement}
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Token ID</p>
              <p className="mt-1 text-lg font-mono text-amber-300">
                {certificateData.tokenId}
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Date Issued</p>
              <p className="mt-1 text-lg font-semibold text-amber-300">
                {certificateData.date}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-600 bg-slate-800 px-6 py-3 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={() => window.open("https://explorer.solana.com", "_blank")}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-white hover:from-amber-500 hover:to-orange-600"
            >
              View on Solana Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Certificate3D({ certificateData }) {
  const groupRef = useRef();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => {
      setVisible(true);
      anime({
        targets: groupRef.current?.scale,
        x: [0, 1],
        y: [0, 1],
        z: [0, 1],
        duration: 1200,
        easing: "easeOutExpo",
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useFrame((state) => {
    if (groupRef.current && visible) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} scale={[0, 0, 0]}>
        {/* Certificate Base */}
        <mesh position={[0, 0, -0.1]}>
          <boxGeometry args={[3.5, 2.5, 0.05]} />
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.8}
            roughness={0.2}
            emissive="#ffd700"
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* Gold Border */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.6, 2.6, 0.02]} />
          <meshStandardMaterial
            color="#ffd700"
            metalness={0.9}
            roughness={0.1}
            emissive="#ffd700"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Certificate Text */}
        <Text
          position={[0, 0.6, 0.05]}
          fontSize={0.15}
          color="#ffd700"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        >
          CERTIFICATE OF COMPLETION
        </Text>

        <Text
          position={[0, 0.3, 0.05]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          This certifies that
        </Text>

        <Text
          position={[0, 0.1, 0.05]}
          fontSize={0.12}
          color="#4dd0ff"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        >
          {certificateData.recipient}
        </Text>

        <Text
          position={[0, -0.1, 0.05]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          has achieved
        </Text>

        <Text
          position={[0, -0.35, 0.05]}
          fontSize={0.12}
          color="#4dd0ff"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
          textAlign="center"
        >
          {certificateData.achievement}
        </Text>

        <Text
          position={[0, -0.7, 0.05]}
          fontSize={0.08}
          color="#ffd700"
          anchorX="center"
          anchorY="middle"
        >
          {certificateData.tokenId}
        </Text>

        {/* Decorative Elements */}
        <mesh position={[-1.2, 0, 0.03]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#ffd700"
            metalness={0.9}
            roughness={0.1}
            emissive="#ffd700"
            emissiveIntensity={0.5}
          />
        </mesh>

        <mesh position={[1.2, 0, 0.03]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#ffd700"
            metalness={0.9}
            roughness={0.1}
            emissive="#ffd700"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Neural Network Decoration */}
        {visible && <NeuralNetworkDecoration />}
      </group>
    </Float>
  );
}

function NeuralNetworkDecoration() {
  const linesRef = useRef();
  const pointsRef = useRef();

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.z = -state.clock.elapsedTime * 0.05;
    }
  });

  // Generate neural network points
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 0.8;
    points.push([
      Math.cos(angle) * radius,
      Math.sin(angle) * radius + 0.5,
      0.04,
    ]);
  }

  return (
    <group position={[0, -0.3, 0]}>
      {/* Connection Lines */}
      <group ref={linesRef}>
        {points.map((point, i) => (
          <mesh key={`line-${i}`} position={[0, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.8]} />
            <meshStandardMaterial
              color="#4dd0ff"
              transparent
              opacity={0.3}
              emissive="#4dd0ff"
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Neural Points */}
      <group ref={pointsRef}>
        {points.map((point, i) => (
          <mesh key={`point-${i}`} position={point}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial
              color="#4dd0ff"
              emissive="#4dd0ff"
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ParticleField() {
  const particlesRef = useRef();

  useEffect(() => {
    // Create particle animation
    const particles = particlesRef.current;
    if (particles) {
      anime({
        targets: ".particle",
        translateY: [0, -100],
        translateX: () => anime.random(-50, 50),
        opacity: [1, 0],
        duration: 3000,
        easing: "easeOutQuad",
        delay: anime.stagger(100),
        loop: true,
      });
    }
  }, []);

  const particles = [...Array(30)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    emoji: ["✨", "💫", "🌟", "⭐", "💎"][Math.floor(Math.random() * 5)],
    size: Math.random() * 20 + 10,
  }));

  return (
    <div ref={particlesRef} className="absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle absolute text-amber-400"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize: `${particle.size}px`,
            animationDelay: `${particle.id * 100}ms`,
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
}