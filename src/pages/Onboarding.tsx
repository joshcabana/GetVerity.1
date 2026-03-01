import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import AgeGateStep from "@/components/onboarding/AgeGateStep";
import SignInStep from "@/components/onboarding/SignInStep";
import PhoneVerifyStep from "@/components/onboarding/PhoneVerifyStep";
import SelfieStep from "@/components/onboarding/SelfieStep";
import SafetyPledgeStep from "@/components/onboarding/SafetyPledgeStep";
import PreferencesStep, { type Preferences } from "@/components/onboarding/PreferencesStep";
import DropReadyStep from "@/components/onboarding/DropReadyStep";

const TOTAL_STEPS = 8;

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [dob, setDob] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, userTrust } = useAuth();

  // Resume from saved step
  useEffect(() => {
    if (userTrust?.onboarding_complete) {
      navigate("/lobby", { replace: true });
      return;
    }
    if (userTrust?.onboarding_step && userTrust.onboarding_step > step) {
      setStep(userTrust.onboarding_step);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTrust, navigate]);

  const saveStep = async (nextStep: number, extra: Record<string, unknown> = {}) => {
    if (!user) return;
    await supabase.from("user_trust").upsert({
      user_id: user.id,
      onboarding_step: nextStep,
      ...extra,
    }, { onConflict: "user_id" });
  };

  const goTo = (nextStep: number, extra: Record<string, unknown> = {}) => {
    saveStep(nextStep, extra);
    setStep(nextStep);
  };

  const handlePreferencesComplete = async (prefs: Preferences) => {
    if (!user) return;
    await saveStep(7, { preferences: prefs as unknown as Record<string, unknown> });
    setStep(7);
  };

  const handleDropReady = async () => {
    if (!user) return;
    await supabase.from("user_trust").upsert(
      {
        user_id: user.id,
        onboarding_step: TOTAL_STEPS,
        onboarding_complete: true,
      },
      { onConflict: "user_id" }
    );
    navigate("/lobby", { replace: true });
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">
            {step + 1}/{TOTAL_STEPS}
          </span>
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="font-serif text-sm text-foreground">Verity</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-12">
        <AnimatePresence mode="wait">
          {step === 0 && <WelcomeStep key="welcome" onNext={() => goTo(1)} />}
          {step === 1 && (
            <AgeGateStep key="age" onNext={(d) => { setDob(d); goTo(2, { dob: d }); }} />
          )}
          {step === 2 && <SignInStep key="signin" onNext={() => goTo(3)} />}
          {step === 3 && (
            <PhoneVerifyStep key="phone" onNext={(verified) => goTo(4, { phone_verified: verified })} />
          )}
          {step === 4 && (
            <SelfieStep key="selfie" onNext={(verified) => goTo(5, { selfie_verified: verified })} />
          )}
          {step === 5 && (
            <SafetyPledgeStep key="pledge" onNext={() => goTo(6, { safety_pledge_accepted: true })} />
          )}
          {step === 6 && (
            <PreferencesStep key="prefs" onComplete={handlePreferencesComplete} />
          )}
          {step === 7 && (
            <DropReadyStep key="drop-ready" onComplete={handleDropReady} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
