import { motion } from "framer-motion";
import { Activity, Users, Shield, TrendingUp } from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const chartConfig = {
  sparks: { label: "Sparks", color: "hsl(43 72% 55%)" },
  value: { label: "Users", color: "hsl(43 72% 55%)" },
};

const pieColors = ["hsl(43 72% 55%)", "hsl(43 60% 70%)", "hsl(0 0% 40%)", "hsl(40 10% 60%)"];

const AdminAnalytics = () => {
  const { data: platformStats } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_stats")
        .select("*")
        .order("stat_date", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: roomStats = [] } = useQuery({
    queryKey: ["admin-room-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("name, active_users")
        .order("active_users", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data.map((r) => ({ name: r.name, value: r.active_users ?? 0 }));
    },
  });

  const genderBalance = platformStats?.gender_balance as { men?: number; women?: number; nonbinary?: number } | null;

  return (
    <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="font-serif text-2xl text-foreground mb-1">Analytics</h1>
      <p className="text-sm text-muted-foreground/60 mb-6">Platform health and engagement overview</p>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total sparks", value: String(platformStats?.total_sparks ?? 0), icon: Activity },
          { label: "Active users", value: String(platformStats?.active_users ?? 0), icon: Users },
          { label: "Moderation flags", value: String(platformStats?.moderation_flags_count ?? 0), icon: Shield },
          { label: "AI accuracy", value: `${platformStats?.ai_accuracy ?? 0}%`, icon: TrendingUp },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-[11px] text-muted-foreground/60">{kpi.label}</span>
            </div>
            <span className="font-serif text-xl text-foreground">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Gender Balance</h3>
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <BarChart data={[
              { gender: "Women", count: genderBalance?.women ?? 0 },
              { gender: "Men", count: genderBalance?.men ?? 0 },
              { gender: "Non-binary", count: genderBalance?.nonbinary ?? 0 },
            ]} layout="vertical">
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis type="category" dataKey="gender" tickLine={false} axisLine={false} fontSize={12} width={80} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(43 72% 55%)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Room Popularity</h3>
          {roomStats.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={roomStats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                  {roomStats.map((_: unknown, i: number) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground/50 text-center py-16">No room data yet</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminAnalytics;
