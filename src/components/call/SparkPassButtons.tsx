import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

interface SparkPassButtonsProps {
  onChoice: (choice: "spark" | "pass") => void;
  elapsed: number;
}

const SparkPassButtons = ({ onChoice, elapsed }: SparkPassButtonsProps) => {
  const passDisabled = elapsed < 15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <p className="text-center font-serif text-lg text-foreground mb-2">
        Time's up.
      </p>
      <p className="text-center text-sm text-muted-foreground mb-6">
        Did you feel a spark?
      </p>

      <div className="flex items-center justify-center gap-5">
        <Button
          variant="outline"
          size="xl"
          disabled={passDisabled}
          onClick={() => onChoice("pass")}
          className="min-w-[130px] gap-2 border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-40"
          aria-label="Pass — no spark"
        >
          <X className="w-4 h-4" />
          Pass
        </Button>
        <Button
          variant="gold"
          size="xl"
          onClick={() => onChoice("spark")}
          className="min-w-[130px] gap-2"
          aria-label="Spark — I felt a connection"
        >
          <Sparkles className="w-4 h-4" />
          Spark
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground/45 mt-4">
        Your choice is completely private. Only mutual sparks are ever revealed.
      </p>
    </motion.div>
  );
};

export default SparkPassButtons;
