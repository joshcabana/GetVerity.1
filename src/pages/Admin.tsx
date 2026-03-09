import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, BarChart3, Users, Settings,
  MessageSquare, TrendingUp, Calendar, Bell
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import AdminModeration from "@/components/admin/AdminModeration";
import AdminAppeals from "@/components/admin/AdminAppeals";
import AdminGuardian from "@/components/admin/AdminGuardian";
import AdminDrops from "@/components/admin/AdminDrops";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminPilot from "@/components/admin/AdminPilot";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminSettings from "@/components/admin/AdminSettings";

type AdminSection = "moderation" | "appeals" | "analytics" | "pilot" | "users" | "guardian" | "drops" | "settings";

const navItems: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: "moderation", label: "Moderation", icon: Shield },
  { id: "appeals", label: "Appeals", icon: MessageSquare },
  { id: "guardian", label: "Guardian", icon: AlertTriangle },
  { id: "drops", label: "Drops", icon: Calendar },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "pilot", label: "Pilot", icon: TrendingUp },
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const Admin = () => {
  const [section, setSection] = useState<AdminSection>("moderation");

  const { data: alerts = [] } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("runtime_alert_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <Helmet>
        <title>Admin — Verity</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card/50 p-4 gap-1">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-serif text-lg text-foreground">Admin</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}

        {/* Alerts */}
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-2 px-2 mb-3">
            <Bell className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-luxury">Alerts</span>
          </div>
          <div className="space-y-2">
            {alerts.length === 0 && (
              <p className="text-[11px] text-muted-foreground/40 px-2">No recent alerts</p>
            )}
            {alerts.map((alert) => (
              <div key={alert.id} className="px-2 py-1.5 rounded-md bg-secondary/30">
                <p className="text-[11px] text-foreground/80 leading-tight">{alert.message}</p>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 py-6 md:py-8 mt-12 md:mt-0">
          <AnimatePresence mode="wait">
            {section === "moderation" && <AdminModeration key="moderation" />}
            {section === "appeals" && <AdminAppeals key="appeals" />}
            {section === "guardian" && <AdminGuardian key="guardian" />}
            {section === "drops" && <AdminDrops key="drops" />}
            {section === "analytics" && <AdminAnalytics key="analytics" />}
            {section === "pilot" && <AdminPilot key="pilot" />}
            {section === "users" && <AdminUsers key="users" />}
            {section === "settings" && <AdminSettings key="settings" />}
          </AnimatePresence>
        </div>
      </main>
    </div>
    </>
  );
};

export default Admin;
