import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";
import type { ConnectionQuality } from "@/hooks/useAgoraCall";

interface ConnectionIndicatorProps {
  quality: ConnectionQuality;
}

const QUALITY_CONFIG: Record<ConnectionQuality, { label: string; color: string; bars: number }> = {
  excellent: { label: "Strong", color: "text-green-400", bars: 3 },
  good: { label: "Good", color: "text-green-400", bars: 2 },
  poor: { label: "Weak", color: "text-amber-400", bars: 1 },
  disconnected: { label: "Lost", color: "text-red-400", bars: 0 },
  reconnecting: { label: "Reconnecting…", color: "text-amber-400", bars: 0 },
};

export default function ConnectionIndicator({ quality }: ConnectionIndicatorProps) {
  const config = QUALITY_CONFIG[quality];

  return (
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-label={`Connection quality: ${config.label}`}
    >
      {quality === "disconnected" ? (
        <WifiOff className={`w-3.5 h-3.5 ${config.color}`} />
      ) : quality === "reconnecting" ? (
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
          <Wifi className={`w-3.5 h-3.5 ${config.color}`} />
        </motion.div>
      ) : (
        <Wifi className={`w-3.5 h-3.5 ${config.color}`} />
      )}

      {/* Signal strength bars */}
      <div className="flex items-end gap-px" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={`w-[3px] rounded-sm transition-colors duration-300 ${
              bar <= config.bars ? config.color.replace("text-", "bg-") : "bg-muted-foreground/20"
            }`}
            style={{ height: `${bar * 4 + 4}px` }}
          />
        ))}
      </div>

      {/* Show label only for non-excellent states */}
      <AnimatePresence>
        {quality !== "excellent" && quality !== "good" && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            className={`text-[10px] font-medium ${config.color}`}
          >
            {config.label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
