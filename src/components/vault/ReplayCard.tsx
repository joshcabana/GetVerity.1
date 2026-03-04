import { motion } from "framer-motion";
import { Brain, Lock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface VaultItem {
  id: string;
  call_id: string;
  title: string | null;
  user_notes: string | null;
  ai_reflection: string | null;
  feeling_score: number | null;
  created_at: string;
  partner_name: string;
}

interface ReplayCardProps {
  item: VaultItem;
  index: number;
  isSubscriber: boolean;
  onView: (item: VaultItem) => void;
  onUpgrade: () => void;
}

const ReplayCard = ({ item, index, isSubscriber, onView, onUpgrade }: ReplayCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-4 flex items-center gap-4">
          {/* Icon area */}
          <div className="relative w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
            {!isSubscriber ? (
              <button onClick={onUpgrade} className="w-full h-full flex items-center justify-center backdrop-blur-sm rounded-lg">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </button>
            ) : (
              <button onClick={() => onView(item)} className="w-full h-full flex items-center justify-center hover:bg-primary/10 rounded-lg transition-colors">
                <Brain className="w-6 h-6 text-primary" />
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{item.partner_name}</p>
            <p className="text-xs text-muted-foreground">
              {item.title || "Spark Session"} · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </p>
            {item.feeling_score && (
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= item.feeling_score! ? "text-primary fill-primary" : "text-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
            )}
            {isSubscriber && item.ai_reflection && (
              <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                {item.ai_reflection.slice(0, 80)}…
              </p>
            )}
            {!isSubscriber && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                AI insight available
              </p>
            )}
          </div>

          {/* CTA for non-subscribers */}
          {!isSubscriber && (
            <Button variant="outline" size="sm" onClick={onUpgrade} className="shrink-0 text-xs">
              Unlock
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReplayCard;
