import { useState } from "react";
import { motion } from "framer-motion";
import { User, Crown, Download, Trash2, FileText, Shield, Lock, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

const Settings = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [deletePending, setDeletePending] = useState(false);

  const subscriptionTier = profile?.subscription_tier ?? "free";
  const isPassHolder = subscriptionTier === "pass_monthly" || subscriptionTier === "pass_annual";
  const tierLabel = isPassHolder
    ? `Verity Pass · ${subscriptionTier === "pass_annual" ? "Annual" : "Monthly"}`
    : "Free tier";

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Unable to open subscription portal");
    }
  };

  const handleDownloadData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("export-my-data");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "verity-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch {
      toast.error("Failed to export data. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    setDeletePending(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await signOut();
      navigate("/");
      toast.success("Your account has been deleted.");
    } catch {
      toast.error("Failed to delete account. Please contact privacy@getverity.com.au.");
    } finally {
      setDeletePending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{title}</h2>
      <Card>
        <CardContent className="p-4 space-y-3">{children}</CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>Settings — Verity</title>
        <meta name="description" content="Manage your Verity account, subscription, and privacy settings." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-5 pt-5 pb-4">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-2xl text-foreground">
            Settings
          </motion.h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-5 pt-6 space-y-6">
        {/* Account */}
        <Section title="Account">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
              <User className="w-3.5 h-3.5 mr-1.5" />
              Edit profile
            </Button>
          </div>
        </Section>

        {/* Subscription */}
        <Section title="Subscription">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Crown className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{tierLabel}</p>
                <p className="text-xs text-muted-foreground">{isPassHolder ? "Active" : "Upgrade anytime"}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={isPassHolder ? handleManageSubscription : () => navigate("/tokens")}>
              {isPassHolder ? "Manage" : "Upgrade"}
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </Section>

        {/* Privacy & Data */}
        <Section title="Privacy & Data">
          <button onClick={handleDownloadData} className="flex items-center gap-3 w-full py-2 text-sm text-foreground hover:text-primary transition-colors">
            <Download className="w-4 h-4 text-muted-foreground" />
            Download my data
          </button>
          <Separator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-3 w-full py-2 text-sm text-destructive hover:text-destructive/80 transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete my account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={deletePending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deletePending ? "Submitting…" : "Delete account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        {/* Legal */}
        <Section title="Legal">
          <a href="/privacy" className="flex items-center gap-3 py-2 text-sm text-foreground hover:text-primary transition-colors">
            <Lock className="w-4 h-4 text-muted-foreground" />
            Privacy Policy
          </a>
          <Separator />
          <a href="/terms" className="flex items-center gap-3 py-2 text-sm text-foreground hover:text-primary transition-colors">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Terms of Service
          </a>
          <Separator />
          <a href="/safety" className="flex items-center gap-3 py-2 text-sm text-foreground hover:text-primary transition-colors">
            <Shield className="w-4 h-4 text-muted-foreground" />
            Safety Promise
          </a>
        </Section>

        {/* Sign Out */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </motion.div>
      </main>

      <BottomNav activeTab="profile" />
    </div>
  );
};

export default Settings;
