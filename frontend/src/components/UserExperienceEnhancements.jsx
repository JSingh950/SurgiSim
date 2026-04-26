import { useState, useEffect, useRef } from "react";
import anime from "animejs";
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

export default function UserExperienceEnhancements({
  isNewUser,
  onTutorialComplete,
  onHelpRequest,
}) {
  const overlayRef = useRef(null);
  const [showTutorial, setShowTutorial] = useState(isNewUser);
  const [currentStep, setCurrentStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const [loadProgress, setLoadProgress] = useState(false);

  const TUTORIAL_STEPS = [
    {
      title: "Welcome to SurgiSim",
      content: "Experience the future of neurosurgical training with 3D brain visualization, AI-powered mentorship, and blockchain certification.",
    },
    {
      title: "Navigate the 3D Brain",
      content: "Use your mouse to rotate, scroll to zoom, and click on brain regions to explore different anatomical areas.",
    },
    {
      title: "Select Surgical Tools",
      content: "Choose from 6 specialized surgical tools including scalpel, forceps, cautery, and more for realistic procedural training.",
    },
    {
      title: "AI-Powered Guidance",
      content: "Get real-time mentorship from our Chief Neurosurgeon AI, powered by medical-grade context and natural language understanding.",
    },
    {
      title: "Track Your Progress",
      content: "Complete surgical procedures, earn achievements, and mint on-chain certificates on Solana Devnet.",
    },
    {
      title: "Ready to Begin",
      content: "You're all set! Start your first surgical simulation and begin your journey to become a certified neurosurgeon.",
    },
  ];

  const handleNextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("surgiSim_tutorial_complete", "true");
    if (onTutorialComplete) onTutorialComplete();
  };

  const skipTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("surgiSim_tutorial_skipped", "true");
  };

  const handleSaveProgress = async () => {
    setLoadProgress(true);
    // Simulate saving progress
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSavedProgress({
      timestamp: new Date().toISOString(),
      region: "Frontal Lobe",
      tool: "Scalpel",
      completion: 75,
    });
    setLoadProgress(false);

    setTimeout(() => setSavedProgress(null), 3000);
  };

  const handleLoadProgress = () => {
    const savedData = localStorage.getItem("surgiSim_progress");
    if (savedData) {
      try {
        const progress = JSON.parse(savedData);
        setSavedProgress(progress);
      } catch (error) {
        console.error("Failed to load progress:", error);
        setSavedProgress({ error: "Could not load saved progress" });
      }
    } else {
      setSavedProgress({ message: "No saved progress found" });
    }

    setTimeout(() => setSavedProgress(null), 4000);
  };

  return (
    <>
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <Card ref={overlayRef} className="max-w-2xl w-full mx-4 border-cyan-300/30 bg-slate-950/95 shadow-2xl">
            <CardHeader className="flex items-start justify-between">
              <div>
                <Badge className="w-fit mb-2">First-Time Setup</Badge>
                <CardTitle className="text-2xl">Welcome to SurgiSim</CardTitle>
                <CardDescription className="text-base">
                  Interactive neurosurgical training with AI guidance
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={skipTutorial}>
                Skip Tutorial
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Progress Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {TUTORIAL_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentStep
                        ? "bg-cyan-500"
                        : index < currentStep
                        ? "bg-cyan-900"
                        : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              {/* Tutorial Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-cyan-300 mb-3">
                  {TUTORIAL_STEPS[currentStep].title}
                </h3>
                <p className="text-base leading-relaxed text-slate-200">
                  {TUTORIAL_STEPS[currentStep].content}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>

                {currentStep === TUTORIAL_STEPS.length - 1 ? (
                  <Button onClick={completeTutorial}>
                    Start Surgery
                  </Button>
                ) : (
                  <Button onClick={handleNextStep}>
                    Next
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Button */}
      {!showTutorial && (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-40"
          onClick={() => setShowHelp(!showHelp)}
        >
          Help
        </Button>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <Card className="max-w-xl w-full mx-4 border-cyan-300/30 bg-slate-950/95 shadow-2xl">
            <CardHeader>
              <div>
                <Badge className="w-fit">Help Center</Badge>
                <CardTitle>SurgiSim Assistance</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowHelp(false)}>
                Close
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  variant="outline"
                  onClick={handleSaveProgress}
                  disabled={loadProgress}
                >
                  {loadProgress ? "Loading..." : "Save Progress"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleLoadProgress}
                  disabled={loadProgress}
                >
                  {loadProgress ? "Loading..." : "Load Progress"}
                </Button>
              </div>

              {/* Progress Save Status */}
              {savedProgress && (
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-950/30 p-4">
                  {savedProgress.error ? (
                    <div className="text-red-300 text-sm">
                      ⚠️ {savedProgress.error}
                    </div>
                  ) : (
                    <div className="text-sm">
                      <div className="text-cyan-300 font-semibold mb-2">
                        ✅ Progress Saved
                      </div>
                      <div className="text-slate-200 space-y-1">
                        <div>Time: {new Date(savedProgress.timestamp).toLocaleString()}</div>
                        <div>Region: {savedProgress.region}</div>
                        <div>Tool: {savedProgress.tool}</div>
                        <div>Completion: {savedProgress.completion}%</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FAQ Section */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-slate-200 mb-3">Frequently Asked Questions</h4>

                <div className="space-y-3">
                  <FAQItem
                    question="How do I select surgical tools?"
                    answer="Click on the 'Surgical Tools' panel in the 3D interface to choose from Scalpel, Forceps, Retractor, Suction, Cautery, or Microscope."
                  />
                  <FAQItem
                    question="What does the microscope mode do?"
                    answer="When activated, the camera switches to surgical zoom mode with enhanced lighting and precision controls for detailed procedures."
                  />
                  <FAQItem
                    question="How do I mint my certificate?"
                    answer="Complete all 8 surgical steps, then connect your Phantom wallet and click 'Claim Certificate' to mint your on-chain achievement on Solana Devnet."
                  />
                  <FAQItem
                    question="Why is the brain made of geometric shapes?"
                    answer="This is a placeholder implementation. Real brain models can be loaded by adding .glb files to the models directory and updating the configuration."
                  />
                  <FAQItem
                    question="How does AI guidance work?"
                    answer="The Chief Neurosurgeon AI analyzes your surgical choices and provides context-aware guidance based on medical knowledge and your current progress."
                  />
                </div>
              </div>

              {/* Contact Support */}
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-base font-semibold text-slate-200 mb-3">Need More Help?</h4>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (onHelpRequest) onHelpRequest();
                    setShowHelp(false);
                  }}
                >
                  Contact Support Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {!showTutorial && !showHelp && (
        <div className="fixed bottom-4 left-4 z-30 text-xs text-slate-400 bg-slate-950/80 px-3 py-2 rounded-lg">
          <div className="font-semibold mb-1">Keyboard Shortcuts:</div>
          <div className="space-y-1">
            <div><kbd className="bg-slate-700 px-2 py-1 rounded">ESC</kbd> - Close modals</div>
            <div><kbd className="bg-slate-700 px-2 py-1 rounded">H</kbd> - Toggle Help</div>
            <div><kbd className="bg-slate-700 px-2 py-1 rounded">1-6</kbd> - Select Tools</div>
            <div><kbd className="bg-slate-700 px-2 py-1 rounded">SPACE</kbd> - Activate Tool</div>
          </div>
        </div>
      )}
    </>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-700 pb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex items-center justify-between text-sm"
      >
        <span className="text-slate-200">{question}</span>
        <span className="text-cyan-300">
          {isOpen ? "▼" : "▶"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-2 text-sm text-slate-300 pl-4">
          {answer}
        </div>
      )}
    </div>
  );
}