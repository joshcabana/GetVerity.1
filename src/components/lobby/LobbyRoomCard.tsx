import { motion } from "framer-motion";
import { Crown, ArrowRight, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Room } from "@/data/rooms";

interface LobbyRoomCardProps {
  room: Room;
  index: number;
  isSelected: boolean;
  isSuggested: boolean;
  onSelect: (roomId: string) => void;
  onEnter: (room: Room) => void;
}

const LobbyRoomCard = ({
  room,
  index,
  isSelected,
  isSuggested,
  onSelect,
  onEnter,
}: LobbyRoomCardProps) => {
  const occupancyPct = Math.round((room.occupancy / room.maxOccupancy) * 100);
  const Icon = room.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onClick={() => onSelect(room.id)}
      className={`relative group cursor-pointer rounded-lg border transition-all duration-500 ${
        isSelected
          ? "border-primary/40 bg-primary/[0.04] shadow-[0_0_50px_hsl(43_72%_55%/0.06)]"
          : "border-border bg-card hover:border-primary/20"
      }`}
    >
      {/* Suggested badge */}
      {isSuggested && (
        <div className="absolute -top-3 left-5">
          <span className="text-[10px] tracking-luxury uppercase text-primary bg-background border border-primary/25 px-3 py-1 rounded-full">
            Best match
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Top row: icon + premium badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors duration-500 ${
              isSelected
                ? "bg-primary/15"
                : "bg-primary/[0.06] group-hover:bg-primary/10"
            }`}
          >
            <Icon className="w-5 h-5 text-primary" />
          </div>
          {room.premium && (
            <div className="flex items-center gap-1.5 text-[10px] text-primary/70 tracking-luxury uppercase">
              <Crown className="w-3 h-3" />
              Verity Pass
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif text-xl text-foreground mb-2">{room.name}</h3>

        {/* Tagline */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          {room.tagline}
        </p>

        {/* Occupancy row */}
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground/70" />
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground/80 font-medium tabular-nums">{room.occupancy}</span>{" "}
              online right now
            </span>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="w-full h-[3px] rounded-full bg-secondary/60 overflow-hidden mt-2 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${occupancyPct}%` }}
            transition={{ duration: 1.2, delay: 0.3 + index * 0.1, ease: "easeOut" }}
            className="h-full rounded-full bg-primary/40"
          />
        </div>

        {/* Peak hours */}
        <p className="text-[11px] text-muted-foreground/40">
          Peak hours: {room.peakHours}
        </p>
      </div>

      {/* Expanded CTA */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="px-6 pb-6 pt-0"
        >
          <div className="border-t border-border pt-5 flex flex-col gap-3">
            <Button
              variant="gold"
              size="lg"
              className="w-full group/btn"
              onClick={(e) => {
                e.stopPropagation();
                onEnter(room);
              }}
            >
              Enter {room.name}
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
            {!room.premium && (
              <p className="text-center text-[11px] text-muted-foreground/50 flex items-center justify-center gap-1">
                <Coins className="w-3 h-3" />
                Uses 1 token · Free for Verity Pass holders
              </p>
            )}
            {room.premium && (
              <p className="text-center text-[11px] text-primary/50 flex items-center justify-center gap-1">
                <Crown className="w-3 h-3" />
                Included with your Verity Pass
              </p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LobbyRoomCard;
