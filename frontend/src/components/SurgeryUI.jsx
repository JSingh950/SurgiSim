import { useState, useEffect } from "react";
import anime from "animejs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAnimeEntrance } from "@/hooks/use-anime-entrance";

const SURGICAL_STEPS = [
  {
    id: 1,
    name: "Patient Assessment",
    description: "Review patient history and vital signs",
    icon: "📋",
    duration: "2 min",
    status: "pending",
  },
  {
    id: 2,
    name: "Incision Planning",
    description: "Map the surgical approach and landmarks",
    icon: "🗺️",
    duration: "3 min",
    status: "pending",
  },
  {
    id: 3,
    name: "Craniotomy",
    description: "Create bone flap and access the surgical site",
    icon: "🔪",
    duration: "5 min",
    status: "pending",
  },
  {
    id: 4,
    name: "Target Identification",
    description: "Locate and verify the target brain region",
    icon: "🎯",
    duration: "4 min",
    status: "pending",
  },
  {
    id: 5,
    name: "Resection/Repair",
    description: "Perform the primary surgical procedure",
    icon: "⚡",
    duration: "8 min",
    status: "pending",
  },
  {
    id: 6,
    name: "Hemostasis",
    description: "Control bleeding and ensure hemostasis",
    icon: "🩸",
    duration: "3 min",
    status: "pending",
  },
  {
    id: 7,
    name: "Closure",
    description: "Close dura, replace bone flap, and close incision",
    icon: "🪡",
    duration: "4 min",
    status: "pending",
  },
  {
    id: 8,
    name: "Post-op Assessment",
    description: "Verify successful completion and patient stability",
    icon: "✅",
    duration: "2 min",
    status: "pending",
  },
];

const SURGICAL_TOOLS = [
  { id: "scalpel", name: "Scalpel", icon: "🔪", description: "Precision cutting instrument" },
  { id: "forceps", name: "Forceps", icon: "🥢", description: "Grasping and holding tissue" },
  { id: "retractor", name: "Retractor", icon: "🔧", description: "Hold tissue away from surgical site" },
  { id: "suction", name: "Suction", icon: "💨", description: "Remove fluids and maintain visibility" },
  { id: "cautery", name: "Cautery", icon: "⚡", description: "Electrical hemostasis and cutting" },
  { id: "microscope", name: "Microscope", icon: "🔬", description: "Magnified visualization" },
];

export default function SurgeryUI({
  currentStep = 1,
  onStepComplete,
  onToolSelect,
  selectedTool,
  isCompleted = false,
  onMintCertificate,
}) {
  const [steps, setSteps] = useState(SURGICAL_STEPS);
  const [activeTool, setActiveTool] = useState(selectedTool || null);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const uiRef = useAnimeEntrance({
    variant: "panel",
    selector: "[data-surgery-item]",
  });

  useEffect(() => {
    const updatedSteps = steps.map((step) => {
      if (step.id < currentStep) return { ...step, status: "completed" };
      if (step.id === currentStep) return { ...step, status: "active" };
      return step;
    });

    setSteps(updatedSteps);
    setProgress((currentStep / SURGICAL_STEPS.length) * 100);

    if (currentStep === SURGICAL_STEPS.length) {
      triggerCompletionAnimation();
    }
  }, [currentStep]);

  useEffect(() => {
    setActiveTool(selectedTool);
  }, [selectedTool]);

  function triggerCompletionAnimation() {
    setIsAnimating(true);
    anime({
      targets: ".completion-particle",
      scale: [0, 1],
      opacity: [1, 0],
      duration: 2000,
      easing: "easeOutExpo",
      delay: anime.stagger(100),
    });
  }

  function handleToolClick(tool) {
    setActiveTool(tool.id);
    if (onToolSelect) {
      onToolSelect(tool);
    }
  }

  function handleStepComplete(stepId) {
    if (onStepComplete && stepId === currentStep && !isCompleted) {
      onStepComplete(stepId + 1);
    }
  }

  function handleMintCertificate() {
    if (onMintCertificate) {
      onMintCertificate();
    }
  }

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps;

  return (
    <div
      ref={uiRef}
      className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 md:p-6"
    >
      {/* Top Bar - Progress */}
      <div data-surgery-item className="pointer-events-auto">
        <Card className="border-cyan-300/20 bg-slate-950/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge variant={isCompleted ? "success" : "default"} className="w-fit">
                  {isCompleted ? "✓ Surgery Complete" : `Step ${currentStep}/${totalSteps}`}
                </Badge>
                <span className="text-sm text-slate-300">
                  {steps.find((s) => s.id === currentStep)?.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-cyan-400">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle - Surgical Steps */}
      <div data-surgery-item className="pointer-events-auto mx-auto max-w-md">
        <Card className="border-cyan-300/20 bg-slate-950/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Surgical Protocol</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.map((step) => (
              <div
                key={step.id}
                onClick={() => handleStepComplete(step.id)}
                className={`cursor-pointer rounded-xl border p-3 transition-all ${
                  step.status === "completed"
                    ? "border-green-500/30 bg-green-500/10"
                    : step.status === "active"
                    ? "border-cyan-400/40 bg-cyan-400/15"
                    : "border-white/10 bg-white/5 opacity-60"
                } ${currentStep >= step.id ? "hover:border-cyan-400/30" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{step.icon}</span>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          step.status === "completed"
                            ? "text-green-400"
                            : step.status === "active"
                            ? "text-cyan-300"
                            : "text-slate-400"
                        }`}
                      >
                        {step.name}
                      </p>
                      <p className="text-xs text-slate-400">{step.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{step.duration}</p>
                    {step.status === "completed" && (
                      <span className="text-green-400">✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom - Tool Dock */}
      <div data-surgery-item className="pointer-events-auto">
        <Card className="border-cyan-300/20 bg-slate-950/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {SURGICAL_TOOLS.map((tool) => (
                  <Button
                    key={tool.id}
                    variant={activeTool === tool.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToolClick(tool)}
                    className="flex flex-col items-center gap-1 px-3 py-2"
                    title={tool.description}
                  >
                    <span className="text-lg">{tool.icon}</span>
                    <span className="text-xs">{tool.name}</span>
                  </Button>
                ))}
              </div>

              {isLastStep && !isCompleted && (
                <Button
                  onClick={handleMintCertificate}
                  size="lg"
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                >
                  🎉 Complete & Mint Certificate
                </Button>
              )}

              {isCompleted && (
                <Badge variant="success" className="text-lg px-4 py-2">
                  🏆 Certificate Minted!
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Particles */}
      {isAnimating && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="completion-particle absolute text-4xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 100}ms`,
              }}
            >
              {["🎉", "✨", "🏆", "🎊", "💎"][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}