import { useState, useEffect, useRef } from "react";
import anime from "animejs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
    dependencies: [],
  },
  {
    id: 2,
    name: "Incision Planning",
    description: "Map surgical approach and landmarks",
    icon: "🗺️",
    duration: "3 min",
    status: "pending",
    dependencies: [1],
  },
  {
    id: 3,
    name: "Craniotomy",
    description: "Create bone flap and access surgical site",
    icon: "🔪",
    duration: "5 min",
    status: "pending",
    dependencies: [2],
  },
  {
    id: 4,
    name: "Target Identification",
    description: "Locate and verify target brain region",
    icon: "🎯",
    duration: "4 min",
    status: "pending",
    dependencies: [3],
  },
  {
    id: 5,
    name: "Tissue Manipulation",
    description: "Prepare and manipulate target tissue",
    icon: "🥢",
    duration: "6 min",
    status: "pending",
    dependencies: [4],
  },
  {
    id: 6,
    name: "Resection/Repair",
    description: "Perform primary surgical procedure",
    icon: "⚡",
    duration: "8 min",
    status: "pending",
    dependencies: [5],
  },
  {
    id: 7,
    name: "Hemostasis",
    description: "Achieve bleeding control and closure",
    icon: "🩸",
    duration: "4 min",
    status: "pending",
    dependencies: [6],
  },
  {
    id: 8,
    name: "Final Closure",
    description: "Complete surgical closure and dress wound",
    icon: "🩹",
    duration: "3 min",
    status: "pending",
    dependencies: [7],
  },
];

export default function CompleteSurgeryUI({
  currentStep = 1,
  selectedRegion,
  onStepComplete,
  onReset,
  selectedTool,
  onToolSelect,
}) {
  const overlayRef = useAnimeEntrance({
    variant: "panel",
    selector: "[data-surgery-item]",
  });

  const [steps, setSteps] = useState(SURGICAL_STEPS);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  // Update step statuses based on completion
  useEffect(() => {
    setSteps(prevSteps =>
      prevSteps.map((step, index) => {
        if (index + 1 < currentStep) {
          return { ...step, status: "completed" };
        } else if (index + 1 === currentStep) {
          return { ...step, status: "active" };
        }
        return { ...step, status: "pending" };
      }),
    );
  }, [currentStep]);

  const getStepStatus = (status) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "active":
        return <Badge className="w-fit">In Progress</Badge>;
      default:
        return <Badge variant="muted">Pending</Badge>;
    }
  };

  const getStepIcon = (step) => {
    const isCompleted = step.status === "completed";
    const isActive = step.status === "active";

    return (
      <div
        className={`text-4xl transition-all ${
          isCompleted ? "scale-125 opacity-100" : "opacity-40"
        } ${isActive ? "scale-110" : ""}`}
      >
        {step.icon}
      </div>
    );
  };

  const currentStepData = steps.find((s) => s.id === currentStep);

  const canProceed = () => {
    return currentStepData && !steps.some((s) => s.id > currentStep && s.status === "completed");
  };

  const handleStepComplete = () => {
    if (onStepComplete) {
      onStepComplete(currentStep);

      // Trigger celebration animation for step completion
      if (currentStep === 8) {
        setCelebrationVisible(true);
        setTimeout(() => setCelebrationVisible(false), 3000);
      }
    }
  };

  const progress = (currentStep / SURGICAL_STEPS.length) * 100;

  return (
    <div className="relative z-20">
      {/* Surgery Progress Panel */}
      <div
        ref={overlayRef}
        className="pointer-events-auto fixed bottom-8 left-8 right-8 max-w-md border-cyan-300/20 bg-slate-950/90 backdrop-blur-xl rounded-3xl shadow-2xl"
      >
        <Card className="border-cyan-300/20">
          <CardHeader>
            <Badge className="w-fit">Surgical Protocol</Badge>
            <CardTitle className="text-xl">Step {currentStep} of {SURGICAL_STEPS.length}</CardTitle>
            <CardDescription>
              {currentStepData?.name} - {currentStepData?.duration}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div data-surgery-item>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Progress
                </span>
                <span className="text-sm font-bold text-cyan-300">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Step Details */}
            <div data-surgery-item>
              <p className="text-sm leading-6 text-slate-200">
                {currentStepData?.description}
              </p>
            </div>

            {/* Step Timeline */}
            <div data-surgery-item className="space-y-2 pt-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 rounded-2xl p-3 transition-all ${
                    step.status === "completed"
                      ? "bg-cyan-950/30 border-cyan-400/30"
                      : step.status === "active"
                      ? "bg-cyan-950/50 border-cyan-300/50"
                      : "bg-slate-900/30 border-slate-700/30"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase text-slate-300">
                        Step {step.id}
                      </span>
                      {getStepStatus(step.status)}
                    </div>
                    <p className="text-xs leading-5 text-slate-400">
                      {step.name}
                    </p>
                    <p className="text-xs text-slate-500">{step.duration}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div data-surgery-item className="flex gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onReset) onReset();
                }}
              >
                Reset
              </Button>

              {canProceed() && (
                <Button
                  size="lg"
                  onClick={handleStepComplete}
                  className="flex-1"
                >
                  Complete Step {currentStep}
                </Button>
              )}

              {currentStep === 8 && (
                <Button
                  size="lg"
                  variant="success"
                  onClick={() => {
                    if (onReset) onReset();
                  }}
                  className="flex-1"
                >
                  Start New Surgery
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Tool Display */}
        {selectedTool && (
          <div data-surgery-item className="mt-4 rounded-2xl border border-cyan-300/20 bg-slate-950/80 p-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">
                {getToolIcon(selectedTool)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200">
                  {getToolName(selectedTool)}
                </p>
                <p className="text-xs text-slate-400">
                  {getToolDescription(selectedTool)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Celebration Modal */}
      {celebrationVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Surgery Complete!
            </h2>
            <p className="text-xl text-cyan-300 mb-6">
              Certificate ready to mint
            </p>
            <div className="text-6xl animate-pulse">🏆</div>
          </div>
        </div>
      )}
    </div>
  );
}

function getToolIcon(toolId) {
  const icons = {
    scalpel: "🔪",
    forceps: "🥢",
    retractor: "🔧",
    suction: "💨",
    cautery: "⚡",
    microscope: "🔬",
  };
  return icons[toolId] || "🔧";
}

function getToolName(toolId) {
  const names = {
    scalpel: "Scalpel",
    forceps: "Forceps",
    retractor: "Retractor",
    suction: "Suction",
    cautery: "Cautery",
    microscope: "Microscope",
  };
  return names[toolId] || "Tool";
}

function getToolDescription(toolId) {
  const descriptions = {
    scalpel: "Precision cutting instrument",
    forceps: "Grasping and holding tissue",
    retractor: "Hold tissue away from surgical site",
    suction: "Remove fluids and maintain visibility",
    cautery: "Electrical hemostasis and cutting",
    microscope: "Magnified visualization",
  };
  return descriptions[toolId] || "";
}