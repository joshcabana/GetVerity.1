import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SignInStepProps {
  onNext: () => void;
}

const SignInStep = ({ onNext }: SignInStepProps) => {
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + "/onboarding" },
      });
      if (error) throw error;
      setLinkSent(true);
      toast({ title: "Magic link sent", description: "Check your inbox and click the link to continue." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({ title: "Something went wrong", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center text-center px-6"
    >
      <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-3">
        {linkSent ? "Check your inbox" : "Sign in to continue"}
      </h2>
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        {linkSent
          ? `We sent a one-time login link to ${email}. Click it to continue.`
          : "We'll send you a magic link — no password needed."}
      </p>

      {!linkSent ? (
        <div className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11 h-12 bg-card border-border"
              onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
            />
          </div>
          <Button
            variant="gold"
            size="lg"
            onClick={handleSendLink}
            className="group w-full"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Send magic link
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <div className="rounded-lg border border-border bg-card/40 p-4">
            <p className="text-sm text-foreground mb-1">Waiting for you to click the link…</p>
            <p className="text-xs text-muted-foreground">
              Check inbox, spam, and promotions for <span className="font-mono">{email}</span>.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { handleSendLink(); }}
            className="w-full"
            disabled={loading}
          >
            {loading ? "Resending…" : "Resend magic link"}
          </Button>
          <button
            onClick={() => { setLinkSent(false); }}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Use a different email
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default SignInStep;
