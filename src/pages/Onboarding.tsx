import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ExcitementStep from "@/components/onboarding/ExcitementStep";
import MagicLinkStep from "@/components/onboarding/MagicLinkStep";
import VerifyStep from "@/components/onboarding/VerifyStep";

const TOTAL_STEPS = 3;

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { user, userTrust } = useAuth();

  // SEO
  useEffect(() => {
    document.title = "Verity Onboarding • Real chemistry in 45 seconds";
  }, []);

  // Resume / redirect if already complete
  useEffect(() => {
    if (userTrust?.onboarding_complete) {
      navigate("/lobby", { replace: true });
      return;
    }
    // If user is already authenticated, skip to verify step
    if (user && step < 2) {
      setStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTrust, user, navigate]);

  const saveStep = async (nextStep: number) => {
    if (!user) return;
    await supabase.from("user_trust").upsert(
      { user_id: user.id, onboarding_step: nextStep },
      { onConflict: "user_id" }
    );
  };

  const handleExcitementDone = () => {
    // If already signed in, skip magic link
    if (user) {
      saveStep(2);
      setStep(2);
    } else {
      setStep(1);
    }
  };

  const handleMagicLinkDone = () => {
    saveStep(2);
    setStep(2);
  };

  const handleVerifyDone = () => {
    navigate("/lobby", { replace: true });
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">
            {step + 1}/{TOTAL_STEPS}
          </span>
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="font-serif text-sm text-foreground">Verity</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center py-12">
        <AnimatePresence mode="wait">
          {step === 0 && <ExcitementStep key="excitement" onNext={handleExcitementDone} />}
          {step === 1 && <MagicLinkStep key="magic-link" onNext={handleMagicLinkDone} />}
          {step === 2 && <VerifyStep key="verify" onComplete={handleVerifyDone} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
