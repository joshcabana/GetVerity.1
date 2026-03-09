import { motion } from "framer-motion";
import { AlertTriangle, Users, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminGuardian = () => {
  const { data: guardianAlerts = [] } = useQuery({
    queryKey: ["admin-guardian-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guardian_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Aggregate guardian alerts per user
  const guardianByUser = (() => {
    const map = new Map<string, { count: number; latest: string }>();
    for (const a of guardianAlerts) {
      const existing = map.get(a.user_id);
      if (existing) {
        existing.count++;
        if (a.created_at > existing.latest) existing.latest = a.created_at;
      } else {
        map.set(a.user_id, { count: 1, latest: a.created_at });
      }
    }
    return Array.from(map.entries())
      .map(([userId, { count, latest }]) => ({ userId, count, latest }))
      .sort((a, b) => b.count - a.count);
  })();

  return (
    <motion.div key="guardian" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="font-serif text-2xl text-foreground mb-1">Guardian Alerts</h1>
      <p className="text-sm text-muted-foreground/60 mb-6">
        {guardianAlerts.length} total alerts from {guardianByUser.length} users
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[11px] text-muted-foreground/60">Total Alerts</span>
          </div>
          <span className="font-serif text-xl text-foreground">{guardianAlerts.length}</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[11px] text-muted-foreground/60">Unique Users</span>
          </div>
          <span className="font-serif text-xl text-foreground">{guardianByUser.length}</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[11px] text-muted-foreground/60">Repeat Offenders (3+)</span>
          </div>
          <span className="font-serif text-xl text-foreground">
            {guardianByUser.filter((u) => u.count >= 3).length}
          </span>
        </div>
      </div>

      {/* Per-user table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Alert Count</TableHead>
              <TableHead>Last Alert</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guardianByUser.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground/50 py-8">
                  No guardian alerts recorded
                </TableCell>
              </TableRow>
            )}
            {guardianByUser.map((row) => (
              <TableRow key={row.userId}>
                <TableCell className="font-mono text-xs text-muted-foreground">{row.userId.slice(0, 8)}</TableCell>
                <TableCell className="tabular-nums text-foreground font-medium">{row.count}</TableCell>
                <TableCell className="text-muted-foreground/60 text-sm">
                  {new Date(row.latest).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      row.count >= 5
                        ? "text-destructive border-destructive/30"
                        : row.count >= 3
                        ? "text-primary border-primary/30"
                        : ""
                    }`}
                  >
                    {row.count >= 5 ? "High" : row.count >= 3 ? "Medium" : "Low"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default AdminGuardian;
