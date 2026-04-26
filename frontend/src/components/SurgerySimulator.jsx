import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import confetti from "canvas-confetti";
import { useAuth0 } from "@auth0/auth0-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import BrainCanvas from "@/components/BrainCanvas.jsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAnimeEntrance } from "@/hooks/use-anime-entrance";
import { frontendEnv } from "@/lib/config";
import { readMentorResponse } from "@/lib/mentor-response.js";

export default function SurgerySimulator({
  isRequestingSession,
  onLogout,
  onOpenProtocol,
  onRefreshSession,
  session,
  sessionError,
  userLabel,
}) {
  const { getAccessTokenSilently } = useAuth0();
  const { publicKey: walletPublicKey, connected: walletConnected } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [mintError, setMintError] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const mintBadgeRef = useRef(null);
  const overlayRef = useAnimeEntrance({
    variant: "panel",
    selector: "[data-sim-item]",
  });
  const responsePanelRef = useRef(null);
  const audioRef = useRef(null);
  const requestControllerRef = useRef(null);
  const audioUrlRef = useRef(null);
  const [audioState, setAudioState] = useState("Awaiting brain-region selection.");
  const [isConsulting, setIsConsulting] = useState(false);
  const [knowledgeContext, setKnowledgeContext] = useState("");
  const [mentorError, setMentorError] = useState(null);
  const [mentorText, setMentorText] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [status, setStatus] = useState(
    "Select a brain region to request Snowflake context and AI surgical guidance.",
  );

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return undefined;
    }

    const handleEnded = () => {
      setAudioState("Audio guide completed.");
    };

    const handleError = () => {
      setAudioState("Audio guide playback failed.");
    };

    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);

    return () => {
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!responsePanelRef.current) {
      return undefined;
    }

    anime.remove(responsePanelRef.current);

    const animation = anime({
      targets: responsePanelRef.current,
      opacity: [0.58, 1],
      translateY: [18, 0],
      duration: 720,
      easing: "easeOutExpo",
    });

    return () => {
      animation.pause();
      anime.remove(responsePanelRef.current);
    };
  }, [mentorError, mentorText, selectedRegion, status]);

  async function createAuthorizedHeaders() {
    const accessToken = await getAccessTokenSilently({
      authorizationParams: {
        audience: frontendEnv.auth0Audience,
      },
    });

    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async function playAudioBlob(audioBlob) {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(audioBlob);
    audioUrlRef.current = nextUrl;
    audioElement.src = nextUrl;

    try {
      await audioElement.play();
      setAudioState("Audio guide playing.");
    } catch {
      setAudioState("Audio guide ready but autoplay was blocked.");
    }
  }

  async function extractApiError(response, fallbackMessage) {
    try {
      const payload = await response.json();
      return payload?.error ?? fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  async function handleRegionSelect(regionName) {
    setSelectedRegion(regionName);
    setIsConsulting(true);
    setMentorError(null);
    setMentorText("");
    setKnowledgeContext("");
    setAudioState("Preparing audio guide stream.");
    setStatus(`Retrieving Snowflake context for the ${regionName}.`);

    requestControllerRef.current?.abort();
    const nextController = new AbortController();
    requestControllerRef.current = nextController;

    try {
      const headers = await createAuthorizedHeaders();
      let snowflakeContext = "";

      const contextResponse = await fetch(
        `${frontendEnv.apiBaseUrl}/api/neuro-data`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            brainRegion: regionName,
          }),
          signal: nextController.signal,
        },
      );

      if (contextResponse.ok) {
        const contextPayload = await contextResponse.json();
        snowflakeContext = contextPayload.context ?? "";
        setKnowledgeContext(snowflakeContext);
      } else {
        const contextError = await extractApiError(
          contextResponse,
          "Snowflake neuro-data lookup failed.",
        );
        setKnowledgeContext("");
        setStatus(
          `${contextError} Continuing with the mentor request without retrieved RAG context.`,
        );
      }

      setStatus(`Consulting the Chief Neurosurgeon for the ${regionName}.`);

      const mentorResponse = await fetch(`${frontendEnv.apiBaseUrl}/api/mentor`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: `I am operating on the ${regionName}, guide me.`,
          snowflakeContext,
        }),
        signal: nextController.signal,
      });

      const { audioBlob, metadata } = await readMentorResponse(mentorResponse);

      if (nextController.signal.aborted) {
        return;
      }

      setMentorText(
        metadata?.mentorText ??
          `Guidance received for the ${regionName}, but no text payload was returned.`,
      );
      setMentorError(null);
      setStatus(`Guidance ready for the ${regionName}.`);
      await playAudioBlob(audioBlob);
    } catch (error) {
      if (nextController.signal.aborted) {
        return;
      }

      setMentorError(
        error instanceof Error
          ? error.message
          : "The simulator could not complete the mentor request.",
      );
      setAudioState("Audio guide unavailable.");
      setStatus(`Guidance request failed for the ${regionName}.`);
    } finally {
      if (requestControllerRef.current === nextController) {
        requestControllerRef.current = null;
      }

      setIsConsulting(false);
    }
  }

  async function handleMintCertificate() {
    if (!walletPublicKey) {
      setMintError("Connect a Solana wallet first.");
      return;
    }

    setIsMinting(true);
    setMintError(null);
    setMintResult(null);

    try {
      const headers = await createAuthorizedHeaders();

      const response = await fetch(
        `${frontendEnv.apiBaseUrl}/api/mint-certificate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            targetWallet: walletPublicKey.toBase58(),
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Certificate minting failed.");
      }

      setMintResult(payload);
      setShowCertModal(true);

      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.45 },
        colors: ["#79e9ff", "#5bffc8", "#a78bfa", "#facc15"],
      });

      if (mintBadgeRef.current) {
        anime({
          targets: mintBadgeRef.current,
          scale: [0.6, 1.15, 1],
          opacity: [0, 1],
          duration: 900,
          easing: "easeOutElastic(1, 0.5)",
        });
      }
    } catch (error) {
      setMintError(
        error instanceof Error
          ? error.message
          : "Certificate minting failed.",
      );
    } finally {
      setIsMinting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020711] text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(121,233,255,0.14),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(91,255,200,0.12),_transparent_24%),linear-gradient(160deg,_rgba(2,7,17,0.96),_rgba(4,15,26,0.92))]" />
      <BrainCanvas
        isBusy={isConsulting}
        onSelect={handleRegionSelect}
        selectedRegion={selectedRegion}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/70" />
      <div className="clinical-grid absolute inset-0 opacity-20" />

      <div
        ref={overlayRef}
        className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-4 py-4 md:px-6 md:py-6"
      >
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card
            data-sim-item
            className="pointer-events-auto border-cyan-300/15 bg-slate-950/58"
          >
            <CardHeader>
              <Badge className="w-fit">Phase 3 Interactive Brain Suite</Badge>
              <CardTitle className="max-w-3xl text-3xl md:text-5xl">
                Operate on a protected 3D neuro-anatomy simulator
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-8">
                Click a lobe to trigger the authenticated Snowflake, Gemini, and
                ElevenLabs guidance chain. Orbit the brain with drag. Zoom with scroll.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                onClick={onRefreshSession}
                size="lg"
                variant="outline"
                disabled={isRequestingSession}
              >
                {isRequestingSession ? "Refreshing Auth" : "Refresh Auth"}
              </Button>
              <Button onClick={onOpenProtocol} size="lg" variant="secondary">
                Protocol
              </Button>
              <Button onClick={onLogout} size="lg">
                Logout
              </Button>
            </CardContent>
          </Card>

          <Card
            data-sim-item
            className="pointer-events-auto border-cyan-300/15 bg-slate-950/52"
          >
            <CardHeader>
              <Badge variant="success" className="w-fit">
                Session Telemetry
              </Badge>
              <CardTitle className="text-2xl">Authenticated operating room</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <TelemetryField label="Clinician" value={userLabel} />
              <TelemetryField
                label="Selected Region"
                value={selectedRegion || "No region selected"}
              />
              <TelemetryField
                label="Auth Status"
                value={sessionError ? sessionError : session?.message ?? "Awaiting secure handshake."}
              />
              <TelemetryField label="Audio State" value={audioState} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 pt-4 xl:grid-cols-[1fr]">
          <Card
            data-sim-item
            className="pointer-events-auto border-cyan-300/15 bg-slate-950/58"
          >
            <CardHeader>
              <Badge variant="success" className="w-fit">
                Solana Devnet Certificate
              </Badge>
              <CardTitle className="text-2xl">On-chain certification</CardTitle>
              <CardDescription>
                Connect your Phantom wallet and claim a Devnet certificate after
                completing a surgical module.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              <WalletMultiButton />
              <Button
                size="lg"
                disabled={!walletConnected || isMinting || !mentorText}
                onClick={handleMintCertificate}
              >
                {isMinting ? "Minting..." : "Claim Certificate"}
              </Button>
              {mintResult && (
                <div ref={mintBadgeRef} className="flex flex-col gap-1">
                  <Badge variant="success" className="w-fit">
                    Certificate Minted
                  </Badge>
                  <a
                    href={mintResult.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-300 underline break-all"
                  >
                    {mintResult.signature}
                  </a>
                </div>
              )}
              {mintError && (
                <p className="text-sm text-red-300">{mintError}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 pt-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card
            data-sim-item
            className="pointer-events-auto border-cyan-300/15 bg-slate-950/58"
          >
            <CardHeader>
              <Badge variant="muted" className="w-fit">
                Surgical Target
              </Badge>
              <CardTitle className="text-2xl">
                {selectedRegion || "Awaiting region selection"}
              </CardTitle>
              <CardDescription>
                Each section is a placeholder anatomic region that routes directly
                into the backend mentor pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PanelBlock label="Status" value={status} />
              <PanelBlock
                label="Session Subject"
                value={session?.sub ?? "No verified Auth0 subject available yet."}
              />
              <PanelBlock
                label="Snowflake Context"
                value={
                  knowledgeContext
                    ? `${knowledgeContext.slice(0, 220)}${knowledgeContext.length > 220 ? "..." : ""}`
                    : "No context retrieved yet."
                }
              />
            </CardContent>
          </Card>

          <Card
            ref={responsePanelRef}
            data-sim-item
            className="pointer-events-auto border-cyan-300/15 bg-slate-950/66"
          >
            <CardHeader>
              <Badge className="w-fit">Chief Neurosurgeon AI</Badge>
              <CardTitle className="text-2xl">Gemini mentor response</CardTitle>
              <CardDescription>
                Text guidance renders here while the ElevenLabs audio stream is
                decoded and played in the hidden audio element.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                  Response
                </p>
                <div className="mt-4 max-h-[18rem] overflow-y-auto pr-2 text-sm leading-8 text-slate-100/92">
                  {mentorError ? (
                    <p className="text-red-200">{mentorError}</p>
                  ) : mentorText ? (
                    <p>{mentorText}</p>
                  ) : (
                    <p className="text-slate-300/80">
                      Click a lobe or region in the 3D brain to request live
                      procedural guidance.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PanelBlock
                  label="Audio Delivery"
                  value="Hidden audio element is primed to play the ElevenLabs stream returned by /api/mentor."
                />
                <PanelBlock
                  label="Interaction State"
                  value={isConsulting ? "Consulting mentor pipeline..." : "Idle and ready for the next target."}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" preload="auto" />

      {showCertModal && mintResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowCertModal(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-3xl border border-cyan-300/20 bg-slate-950 p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Badge variant="success" className="mb-4 w-fit text-sm">
              Certificate Minted
            </Badge>
            <h2 className="text-2xl font-bold text-white">
              Congratulations!
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Your surgical completion certificate has been minted on Solana
              Devnet.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Transaction Signature
              </p>
              <a
                href={mintResult.explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-sm text-cyan-300 underline break-all"
              >
                {mintResult.signature}
              </a>
            </div>
            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={() => setShowCertModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

function PanelBlock({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-100/90">{value}</p>
    </div>
  );
}

function TelemetryField({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-100 break-all">{value}</p>
    </div>
  );
}
