import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Eye, UserCheck, Sparkles } from "lucide-react";

interface ExcitementStepProps {
  onNext: () => void;
}

const TRUST_BULLETS = [
  { icon: Eye, label: "Anonymous until mutual spark", desc: "Neither person sees names or photos until both say yes." },
  { icon: Shield, label: "Nothing stored if no connection", desc: "No match? No trace. Your dignity is non-negotiable." },
  { icon: UserCheck, label: "Verified 18+ members only", desc: "Every member is ID-verified. No bots. No catfish." },
];

const DEMO_DURATION = 45;

const ExcitementStep = ({ onNext }: ExcitementStepProps) => {
  const [demoActive, setDemoActive] = useState(false);
  const [countdown, setCountdown] = useState(DEMO_DURATION);
  const [demoComplete, setDemoComplete] = useState(false);

  useEffect(() => {
    if (!demoActive || countdown <= 0) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          setDemoActive(false);
          setDemoComplete(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [demoActive, countdown]);

  const skipDemo = useCallback(() => {
    setDemoActive(false);
    setDemoComplete(true);
    setCountdown(0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center text-center px-6 max-w-lg mx-auto w-full"
    >
      {/* Badge */}
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-block text-xs tracking-luxury uppercase text-primary/80 border border-primary/20 px-4 py-2 rounded-full mb-8"
      >
        Verified 18+ speed dating
      </motion.span>

      {/* Headline */}
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] mb-4 text-foreground">
        Real chemistry in{" "}
        <span className="text-gold-gradient italic">45 seconds.</span>
      </h1>

      <p className="text-muted-foreground max-w-md mb-10 text-sm sm:text-base leading-relaxed font-light">
        No endless swiping. No rejection notifications. Just mutual spark.
      </p>

      {/* Trust bullets */}
      <div className="grid gap-3 w-full mb-10">
        {TRUST_BULLETS.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.15 }}
            className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border text-left"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <b.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{b.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Demo overlay */}
      <AnimatePresence>
        {demoActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center px-6"
          >
            {/* Pulsing silhouette */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-32 h-32 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center mb-8"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <Eye className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </motion.div>

            <p className="text-xs tracking-luxury uppercase text-primary/80 mb-3">
              Simulated demo
            </p>

            <p className="font-serif text-2xl text-foreground mb-2">
              Anonymous until mutual spark
            </p>

            {/* Countdown ring */}
            <div className="relative w-24 h-24 my-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (countdown / DEMO_DURATION)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-2xl text-foreground">
                {countdown}
              </span>
            </div>

            <p className="text-sm text-muted-foreground max-w-xs mb-8">
              In a real Drop, you'd see your match's silhouette — voice only for the first 10 seconds, then video reveals.
            </p>

            <Button variant="gold-outline" size="lg" onClick={skipDemo}>
              Skip demo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <div className="w-full max-w-sm space-y-3">
        {!demoComplete ? (
          <Button
            variant="gold"
            size="lg"
            onClick={() => setDemoActive(true)}
            className="w-full group"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Watch 45-second demo
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-primary font-medium mb-4">
              ✨ That's how fast real chemistry happens.
            </p>
            <Button
              variant="gold"
              size="lg"
              onClick={onNext}
              className="w-full group"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        )}

        {!demoComplete && (
          <button
            onClick={onNext}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip intro →
          </button>
        )}
      </div>

      {/* Trust footer */}
      <p className="mt-12 text-[10px] text-muted-foreground/50 tracking-luxury uppercase">
        Mutual spark only · Dignity always
      </p>
    </motion.div>
  );
};

export default ExcitementStep;
