import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SparkReflectionProps {
  callId: string;
  wasMutual: boolean;
  onContinue: () => void;
}

const SparkReflection = ({ callId, wasMutual, onContinue }: SparkReflectionProps) => {
  const [feelingScore, setFeelingScore] = useState(0);
  const [likedText, setLikedText] = useState("");
  const [nextTimeText, setNextTimeText] = useState("");
  const [aiReflection, setAiReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("spark-reflection-ai", {
        body: {
          call_id: callId,
          feeling_score: feelingScore || null,
          liked_text: likedText.trim() || null,
          next_time_text: nextTimeText.trim() || null,
        },
      });

      if (error) {
        console.error("Reflection error:", error);
        toast.error("Couldn't generate reflection. You can still continue.");
      } else if (data?.ai_reflection) {
        setAiReflection(data.ai_reflection);
      }
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong.");
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      key="reflection"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-serif text-2xl text-foreground mb-2">Spark Reflection</h2>
          <p className="text-sm text-muted-foreground">
            Private insight for your personal growth only.
          </p>
        </div>

        {!submitted ? (
          <div className="space-y-6 mb-8">
            {/* Feeling score */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">How did that feel?</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => setFeelingScore(score)}
                    className="transition-all"
                    aria-label={`${score} star`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        score <= feelingScore
                          ? "text-primary fill-primary"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* What did you like? */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                What did you like?
              </label>
              <Textarea
                value={likedText}
                onChange={(e) => setLikedText(e.target.value)}
                placeholder="e.g. They were easy to talk to..."
                className="resize-none"
                rows={2}
                maxLength={500}
              />
            </div>

            {/* What would you try next time? */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                What would you try next time?
              </label>
              <Textarea
                value={nextTimeText}
                onChange={(e) => setNextTimeText(e.target.value)}
                placeholder="e.g. Ask more open-ended questions..."
                className="resize-none"
                rows={2}
                maxLength={500}
              />
            </div>

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating insight…
                </span>
              ) : (
                "Get my reflection"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 mb-8">
            {/* AI Reflection */}
            {aiReflection && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-lg p-5"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Your AI Insight
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {aiReflection}
                </p>
              </motion.div>
            )}

            {!aiReflection && (
              <div className="bg-card border border-border rounded-lg p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Reflection saved. AI insight wasn't available this time.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Privacy note */}
        <p className="text-xs text-muted-foreground/40 text-center mb-6">
          This reflection is never shared with your match or anyone else.
        </p>

        {submitted && (
          <Button variant="gold" size="lg" className="w-full" onClick={onContinue}>
            {wasMutual ? "Continue to Voice Intro" : "Return to lobby"}
          </Button>
        )}

        {!submitted && (
          <button
            onClick={() => {
              setSubmitted(true);
              onContinue();
            }}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full text-center mt-2"
          >
            Skip reflection
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SparkReflection;
