import { motion } from "framer-motion";
import { Ban, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminModeration = () => {
  const queryClient = useQueryClient();

  const { data: moderationFlags = [] } = useQuery({
    queryKey: ["admin-moderation-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_flags")
        .select("*")
        .is("action_taken", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const flagActionMutation = useMutation({
    mutationFn: async ({ flagId, action }: { flagId: string; action: "ban" | "warn" | "clear" }) => {
      const { error } = await supabase
        .from("moderation_flags")
        .update({ action_taken: action, reviewed_at: new Date().toISOString() })
        .eq("id", flagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-moderation-flags"] });
      toast.success("Action applied");
    },
  });

  return (
    <motion.div key="mod" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="font-serif text-2xl text-foreground mb-1">Moderation Queue</h1>
      <p className="text-sm text-muted-foreground/60 mb-6">{moderationFlags.length} items require attention</p>

      {moderationFlags.length === 0 && (
        <p className="text-center text-muted-foreground/50 py-16 text-sm">Queue is clear — no pending flags.</p>
      )}

      <div className="space-y-3">
        {moderationFlags.map((flag, i) => (
          <motion.div
            key={flag.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground font-mono">{flag.flagged_user_id.slice(0, 8)}</span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {new Date(flag.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground/70">{flag.reason ?? "No reason provided"}</p>
                {flag.ai_confidence != null && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-destructive/70"
                        style={{ width: `${Number(flag.ai_confidence) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground/50">
                      AI confidence: {Math.round(Number(flag.ai_confidence) * 100)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => flagActionMutation.mutate({ flagId: flag.id, action: "ban" })}>
                  <Ban className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => flagActionMutation.mutate({ flagId: flag.id, action: "warn" })}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary"
                  onClick={() => flagActionMutation.mutate({ flagId: flag.id, action: "clear" })}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AdminModeration;
