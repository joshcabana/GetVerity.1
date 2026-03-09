import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

const AdminSettings = () => {
  return (
    <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="font-serif text-2xl text-foreground mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground/60 mb-6">Platform configuration and controls</p>

      <div className="space-y-4">
        {[
          { title: "AI moderation sensitivity", description: "Adjust the confidence threshold for automatic flagging", value: "0.60" },
          { title: "Call duration", description: "Default video call length in seconds", value: "45" },
          { title: "Spark decision window", description: "Time after call ends to decide (seconds)", value: "30" },
          { title: "Minimum engagement time", description: "Seconds before Pass button becomes active", value: "15" },
        ].map((setting) => (
          <div key={setting.title} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{setting.title}</p>
              <p className="text-xs text-muted-foreground/60">{setting.description}</p>
            </div>
            <Input className="w-20 text-center text-sm" defaultValue={setting.value} />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AdminSettings;
