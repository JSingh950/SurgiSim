import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import anime from "animejs";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Check, ChevronLeft, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { frontendEnv } from "@/lib/config";
import { readMentorResponse } from "@/lib/mentor-response.js";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Surgery sequence — 4 lobes in strict order
// ---------------------------------------------------------------------------
const SURGERY_STEPS = [
  {
    region: "Frontal Lobe",
    instruction: "Locate the prefrontal cortex and perform the anterior craniotomy approach.",
    color: "#79e9ff",
    meshIndex: 0,
  },
  {
    region: "Parietal Lobe",
    instruction: "Navigate past the central sulcus and map somatosensory boundaries.",
    color: "#9dffdf",
    meshIndex: 1,
  },
  {
    region: "Temporal Lobe",
    instruction: "Access the Sylvian fissure and isolate the superior temporal gyrus.",
    color: "#74ffc9",
    meshIndex: 2,
  },
  {
    region: "Occipital Lobe",
    instruction: "Approach the calcarine sulcus to decompress the visual cortex.",
    color: "#4dd0ff",
    meshIndex: 3,
  },
];

// ---------------------------------------------------------------------------
// Procedural brain geometry helpers
// ---------------------------------------------------------------------------

/** Simple 3D noise for displacement. */
function simpleNoise3D(x, y, z) {
  const p = x * 12.9898 + y * 78.233 + z * 45.164;
  return (Math.sin(p) * 43758.5453) % 1;
}

/** Displace a sphere geometry to create sulci/gyri appearance. */
function createBrainGeometry() {
  const geo = new THREE.SphereGeometry(2.4, 96, 96);
  const pos = geo.attributes.position;
  const normal = geo.attributes.normal;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Multi-octave displacement for sulci detail
    let displacement = 0;
    displacement += simpleNoise3D(x * 1.8, y * 1.8, z * 1.8) * 0.12;
    displacement += simpleNoise3D(x * 3.6, y * 3.6, z * 3.6) * 0.06;
    displacement += simpleNoise3D(x * 7.2, y * 7.2, z * 7.2) * 0.03;

    // Sulci grooves — sine-based folding
    const fold1 = Math.sin(x * 4.5 + y * 2.0) * 0.08;
    const fold2 = Math.sin(y * 5.0 + z * 3.0) * 0.06;
    const fold3 = Math.sin(z * 3.5 + x * 4.0) * 0.05;

    const totalDisp = displacement + fold1 + fold2 + fold3;

    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);

    pos.setXYZ(
      i,
      x + nx * totalDisp,
      y + ny * totalDisp,
      z + nz * totalDisp,
    );
  }

  geo.computeVertexNormals();
  return geo;
}

// Lobe hit-zone positions (approximate anatomical placement around a 2.4r sphere)
const LOBE_ZONES = [
  { position: [1.2, 0.8, 1.4], scale: [1.4, 1.2, 1.2] },   // Frontal
  { position: [0.0, 1.6, -0.2], scale: [1.3, 0.9, 1.2] },   // Parietal
  { position: [1.8, -0.6, 0.0], scale: [1.0, 0.8, 1.5] },   // Temporal
  { position: [-1.4, 0.4, -1.2], scale: [1.1, 1.0, 1.0] },  // Occipital
];

// ---------------------------------------------------------------------------
// 3D Brain with sulci, gyri, and interactive lobe zones
// ---------------------------------------------------------------------------
function DetailedBrain({ currentStep, completedSteps, onLobeClick, activeRegion }) {
  const brainRef = useRef();
  const brainGeo = useMemo(() => createBrainGeometry(), []);

  // Idle breathing animation
  useFrame(({ clock }) => {
    if (!brainRef.current) return;
    const t = clock.getElapsedTime();
    const breathe = 1 + Math.sin(t * 0.8) * 0.012;
    brainRef.current.scale.setScalar(breathe);
    brainRef.current.rotation.y = t * 0.04;
  });

  return (
    <group ref={brainRef}>
      {/* Main brain mesh with sulci displacement */}
      <mesh geometry={brainGeo}>
        <meshStandardMaterial
          color="#e8c4c4"
          roughness={0.72}
          metalness={0.05}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Hemisphere dividing line */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 5, 8]} />
        <meshBasicMaterial color="#d4a0a0" opacity={0.5} transparent />
      </mesh>

      {/* Brain stem */}
      <mesh position={[0, -2.6, -0.3]} scale={[0.4, 1.1, 0.4]}>
        <cylinderGeometry args={[0.5, 0.35, 1, 24]} />
        <meshStandardMaterial color="#d4a8a8" roughness={0.6} />
      </mesh>

      {/* Cerebellum */}
      <mesh position={[0, -1.8, -1.2]} scale={[1.2, 0.7, 0.8]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#d9b3b3" roughness={0.65} />
      </mesh>

      {/* Interactive lobe zones */}
      {SURGERY_STEPS.map((step, idx) => {
        const zone = LOBE_ZONES[idx];
        const isCompleted = completedSteps.includes(step.region);
        const isCurrent = idx === currentStep;
        const isActive = activeRegion === step.region;

        return (
          <group key={step.region}>
            {/* Hit zone mesh */}
            <mesh
              position={zone.position}
              scale={zone.scale}
              onClick={(e) => {
                e.stopPropagation();
                onLobeClick(step.region, idx);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = isCurrent ? "pointer" : "not-allowed";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "default";
              }}
            >
              <sphereGeometry args={[1, 24, 24]} />
              <meshStandardMaterial
                color={isActive ? "#ff4444" : isCompleted ? "#22c55e" : step.color}
                transparent
                opacity={isCurrent ? 0.35 : isCompleted ? 0.25 : 0.08}
                emissive={isCurrent ? step.color : isCompleted ? "#22c55e" : "#000000"}
                emissiveIntensity={isCurrent ? 0.4 : isCompleted ? 0.2 : 0}
                roughness={0.5}
                depthWrite={false}
              />
            </mesh>

            {/* Label */}
            <Text
              position={[
                zone.position[0],
                zone.position[1] + (zone.scale[1] * 0.5 + 0.3),
                zone.position[2],
              ]}
              fontSize={0.18}
              color={isCompleted ? "#22c55e" : isCurrent ? "#ffffff" : "#666666"}
              anchorX="center"
              anchorY="bottom"
              outlineColor="#000000"
              outlineWidth={0.02}
            >
              {isCompleted ? `${step.region}` : isCurrent ? `>> ${step.region} <<` : step.region}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Camera controller for surgery focus
// ---------------------------------------------------------------------------
function SurgeryCameraRig({ focusZone }) {
  const controlsRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current || focusZone == null) return;

    const zone = LOBE_ZONES[focusZone];
    if (!zone) return;

    const targetPos = {
      x: zone.position[0] * 1.8,
      y: zone.position[1] * 1.2 + 1,
      z: zone.position[2] + 5,
    };

    anime.remove(camera.position);
    const camAnim = anime({
      targets: camera.position,
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1200,
      easing: "easeOutExpo",
      update: () => controlsRef.current?.update(),
    });

    anime.remove(controlsRef.current.target);
    const tgtAnim = anime({
      targets: controlsRef.current.target,
      x: zone.position[0],
      y: zone.position[1],
      z: zone.position[2],
      duration: 1200,
      easing: "easeOutExpo",
      update: () => controlsRef.current?.update(),
    });

    return () => {
      camAnim.pause();
      tgtAnim.pause();
      anime.remove(camera.position);
      if (controlsRef.current) anime.remove(controlsRef.current.target);
    };
  }, [camera, focusZone]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxDistance={12}
      minDistance={3}
      target={[0, 0, 0]}
    />
  );
}

// ---------------------------------------------------------------------------
// Main SurgeryRoom component
// ---------------------------------------------------------------------------
export default function SurgeryRoom({ getAccessTokenSilently, onExit, onSurgeryComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeRegion, setActiveRegion] = useState(null);
  const [focusZone, setFocusZone] = useState(null);
  const [isOperating, setIsOperating] = useState(false);
  const [mentorText, setMentorText] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [notification, setNotification] = useState(null);
  const [allComplete, setAllComplete] = useState(false);

  const progressRef = useRef(null);
  const notifRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  // Cleanup audio URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  async function createHeaders() {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: frontendEnv.auth0Audience },
    });
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async function playAudio(blob) {
    if (!audioRef.current) return;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;
    audioRef.current.src = url;
    try {
      await audioRef.current.play();
      setVoiceStatus("AI voice coaching playing...");
    } catch {
      setVoiceStatus("Audio ready — click to play.");
    }
  }

  function showNotif(msg, type) {
    setNotification({ msg, type });
    if (notifRef.current) {
      anime.remove(notifRef.current);
      anime({
        targets: notifRef.current,
        opacity: [0, 1],
        translateY: [-10, 0],
        duration: 400,
        easing: "easeOutExpo",
      });
    }
    setTimeout(() => setNotification(null), 4000);
  }

  function animateProgress(stepIdx) {
    if (!progressRef.current) return;
    anime({
      targets: progressRef.current,
      width: `${((stepIdx + 1) / SURGERY_STEPS.length) * 100}%`,
      duration: 800,
      easing: "easeOutExpo",
    });
  }

  async function handleLobeClick(regionName, stepIdx) {
    if (isOperating || allComplete) return;

    // Enforce sequential order
    if (stepIdx !== currentStep) {
      showNotif(`Access denied: Complete ${SURGERY_STEPS[currentStep].region} first.`, "error");
      return;
    }

    setIsOperating(true);
    setActiveRegion(regionName);
    setFocusZone(stepIdx);
    setMentorText(`Initiating procedure on ${regionName}...`);
    setVoiceStatus("Requesting AI guidance...");

    try {
      const headers = await createHeaders();

      // 1. Fetch Snowflake context
      let snowflakeContext = "";
      try {
        const ctxRes = await fetch(`${frontendEnv.apiBaseUrl}/api/neuro-data`, {
          method: "POST",
          headers,
          body: JSON.stringify({ brainRegion: regionName }),
        });
        if (ctxRes.ok) {
          const ctxData = await ctxRes.json();
          snowflakeContext = ctxData.context ?? "";
        }
      } catch {
        // Non-critical — continue without context
      }

      // 2. Call Gemini mentor
      let guidanceText = SURGERY_STEPS[stepIdx].instruction;
      try {
        const mentorRes = await fetch(`${frontendEnv.apiBaseUrl}/api/mentor`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: `I am performing surgery on the ${regionName}. Guide me through the procedure step by step.`,
            snowflakeContext,
          }),
        });

        const { audioBlob, metadata } = await readMentorResponse(mentorRes);
        guidanceText = metadata?.mentorText ?? guidanceText;

        // Play mentor audio
        if (audioBlob) {
          await playAudio(audioBlob);
        }
      } catch {
        // Mentor pipeline failed — use fallback text
      }

      setMentorText(guidanceText);

      // 3. Voice coaching via /api/audio-guide (ElevenLabs standalone)
      try {
        const voiceRes = await fetch(`${frontendEnv.apiBaseUrl}/api/audio-guide`, {
          method: "POST",
          headers,
          body: JSON.stringify({ text: guidanceText }),
        });
        if (voiceRes.ok) {
          const voiceBlob = await voiceRes.blob();
          await playAudio(voiceBlob);
        }
      } catch {
        // Voice coaching failed silently
      }

      // 4. Mark step complete with animation
      const nextCompleted = [...completedSteps, regionName];
      setCompletedSteps(nextCompleted);
      animateProgress(stepIdx);
      showNotif(`${regionName} procedure complete!`, "success");

      // Advance step
      const nextStep = currentStep + 1;
      if (nextStep >= SURGERY_STEPS.length) {
        setAllComplete(true);
        setMentorText("All surgical modules complete. Outstanding work, surgeon. You may now claim your certificate.");
        if (onSurgeryComplete) onSurgeryComplete();
      } else {
        setCurrentStep(nextStep);
        setFocusZone(nextStep);
      }

      setActiveRegion(null);
    } catch (err) {
      showNotif(`Procedure failed: ${err.message}`, "error");
      setActiveRegion(null);
    } finally {
      setIsOperating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#020711]">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-cyan-300/10 bg-slate-950/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onExit} className="gap-1 text-slate-300">
            <ChevronLeft className="h-4 w-4" /> Exit Surgery
          </Button>
          <Badge className="hidden sm:inline-flex">Immersive Surgery Mode</Badge>
        </div>

        <div className="flex items-center gap-3">
          {voiceStatus && (
            <span className="flex items-center gap-1 text-xs text-cyan-300">
              <Volume2 className="h-3 w-3" /> {voiceStatus}
            </span>
          )}
          <span className="text-xs text-slate-400">
            Step {Math.min(currentStep + 1, SURGERY_STEPS.length)} / {SURGERY_STEPS.length}
          </span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative flex-1">
        <Canvas
          camera={{ position: [0, 2, 8], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={["#020711"]} />
          <fog attach="fog" args={["#020711", 10, 22]} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 8, 5]} intensity={1.8} color="#ffffff" />
          <directionalLight position={[-4, -2, 3]} intensity={0.5} color="#1ed7b4" />
          <pointLight position={[0, 5, -5]} intensity={0.6} color="#74f7ff" />
          <spotLight position={[0, 10, 0]} angle={0.3} penumbra={0.5} intensity={1.2} color="#ffffff" />

          <Suspense fallback={null}>
            <SurgeryCameraRig focusZone={focusZone} />
            <DetailedBrain
              currentStep={currentStep}
              completedSteps={completedSteps}
              onLobeClick={handleLobeClick}
              activeRegion={activeRegion}
            />
          </Suspense>
        </Canvas>

        {/* Surgery HUD overlaid on canvas */}
        <div className="pointer-events-none absolute inset-0">
          {/* Left panel — step tracker */}
          <div className="pointer-events-auto absolute left-4 top-4 w-64 rounded-2xl border border-cyan-300/15 bg-slate-950/85 p-4 backdrop-blur-md">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Surgical Procedure
            </p>

            {/* Progress bar */}
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                ref={progressRef}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-none"
                style={{ width: `${(completedSteps.length / SURGERY_STEPS.length) * 100}%` }}
              />
            </div>

            <ul className="space-y-1.5">
              {SURGERY_STEPS.map((step, idx) => {
                const done = completedSteps.includes(step.region);
                const active = idx === currentStep && !allComplete;
                return (
                  <li
                    key={step.region}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                      active ? "bg-cyan-400/10 text-white" : done ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {done ? (
                      <Check className="h-3 w-3 shrink-0" />
                    ) : (
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                          active ? "border-cyan-400 text-cyan-400" : "border-slate-600 text-slate-600"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    )}
                    {step.region}
                  </li>
                );
              })}
            </ul>

            {allComplete && (
              <div className="mt-3 rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300">
                Surgery complete!
              </div>
            )}
          </div>

          {/* Bottom panel — mentor guidance */}
          <div className="pointer-events-auto absolute bottom-4 left-4 right-4 mx-auto max-w-2xl rounded-2xl border border-cyan-300/15 bg-slate-950/85 p-4 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-lg bg-cyan-400/10 p-2">
                <svg className="h-4 w-4 text-cyan-300" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                  <path d="M10 5a3 3 0 0 0-5 2.2A3.2 3.2 0 0 0 4 12a3 3 0 0 0 3 5h3" />
                  <path d="M14 5a3 3 0 0 1 5 2.2A3.2 3.2 0 0 1 20 12a3 3 0 0 1-3 5h-3" />
                  <path d="M12 5v14M8.5 9.5H12M12 14.5h3.5" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                  {isOperating ? "Chief Neurosurgeon AI — Processing..." : "Chief Neurosurgeon AI"}
                </p>
                <p className="text-sm leading-7 text-slate-200">
                  {mentorText || (currentStep < SURGERY_STEPS.length
                    ? `Click the highlighted ${SURGERY_STEPS[currentStep].region} to begin the procedure.`
                    : "All procedures complete."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Notification toast */}
          {notification && (
            <div
              ref={notifRef}
              className={`pointer-events-auto absolute right-4 top-4 rounded-xl px-4 py-2.5 text-xs font-medium shadow-lg ${
                notification.type === "error"
                  ? "border border-red-400/20 bg-red-950/90 text-red-300"
                  : "border border-emerald-400/20 bg-emerald-950/90 text-emerald-300"
              }`}
            >
              {notification.msg}
            </div>
          )}
        </div>
      </div>

      <audio ref={audioRef} className="hidden" preload="auto"
        onEnded={() => setVoiceStatus("Voice coaching complete.")}
        onError={() => setVoiceStatus("")}
      />
    </div>
  );
}
