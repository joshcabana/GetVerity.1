import { motion } from "framer-motion";
import { Activity, TrendingUp, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PilotDashboard = () => {
  const { data: callStats } = useQuery({
    queryKey: ["pilot-call-stats"],
    queryFn: async () => {
      const { count: total } = await supabase.from("calls").select("*", { count: "exact", head: true });
      const { count: completed } = await supabase.from("calls").select("*", { count: "exact", head: true }).not("ended_at", "is", null);
      const { count: sparks } = await supabase.from("calls").select("*", { count: "exact", head: true }).eq("is_mutual_spark", true);
      return { total: total ?? 0, completed: completed ?? 0, sparks: sparks ?? 0 };
    },
  });

  const { data: modStats } = useQuery({
    queryKey: ["pilot-mod-stats"],
    queryFn: async () => {
      const { count: totalFlags } = await supabase.from("moderation_flags").select("*", { count: "exact", head: true });
      const { count: cleared } = await supabase.from("moderation_flags").select("*", { count: "exact", head: true }).eq("action_taken", "clear");
      return { totalFlags: totalFlags ?? 0, cleared: cleared ?? 0 };
    },
  });

  const completionRate = callStats && callStats.total > 0 ? ((callStats.completed / callStats.total) * 100).toFixed(1) : "—";
  const sparkRate = callStats && callStats.total > 0 ? ((callStats.sparks / callStats.total) * 100).toFixed(1) : "—";
  const fpRate = modStats && modStats.totalFlags > 0 ? ((modStats.cleared / modStats.totalFlags) * 100).toFixed(1) : "—";

  return (
    <motion.div key="pilot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="font-serif text-2xl text-foreground mb-1">Pilot Metrics</h1>
      <p className="text-sm text-muted-foreground/60 mb-6">Real-time health indicators for the pilot launch</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground/60">Call Completion Rate</span>
          </div>
          <span className="font-serif text-3xl text-foreground">{completionRate}%</span>
          <p className="text-[10px] text-muted-foreground/40 mt-1">{callStats?.completed ?? 0} / {callStats?.total ?? 0} calls completed</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary/60" />
            <span className="text-xs text-muted-foreground/60">Mutual Spark Rate</span>
          </div>
          <span className="font-serif text-3xl text-primary">{sparkRate}%</span>
          <p className="text-[10px] text-muted-foreground/40 mt-1">{callStats?.sparks ?? 0} mutual sparks</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground/60">Moderation False-Positive Rate</span>
          </div>
          <span className="font-serif text-3xl text-foreground">{fpRate}%</span>
          <p className="text-[10px] text-muted-foreground/40 mt-1">{modStats?.cleared ?? 0} cleared / {modStats?.totalFlags ?? 0} total flags</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PilotDashboard;
