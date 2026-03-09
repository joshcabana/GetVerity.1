import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminUsers = () => {
  const [userSearch, setUserSearch] = useState("");

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles", userSearch],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (userSearch.trim()) {
        query = query.or(`display_name.ilike.%${userSearch}%,handle.ilike.%${userSearch}%,user_id.eq.${userSearch.trim()}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="font-serif text-2xl text-foreground mb-1">Users</h1>
      <p className="text-sm text-muted-foreground/60 mb-6">Search and manage user accounts</p>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
        <Input
          placeholder="Search by name or handle…"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Tokens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground/50 py-8">
                  No users found
                </TableCell>
              </TableRow>
            )}
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{profile.user_id.slice(0, 8)}</TableCell>
                <TableCell className="font-medium text-foreground">{profile.display_name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${
                    profile.verification_status === "verified" ? "text-primary border-primary/30" :
                    profile.is_active === false ? "text-destructive border-destructive/30" :
                    ""
                  }`}>
                    {profile.is_active === false ? "inactive" : profile.verification_status ?? "unverified"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{profile.subscription_tier ?? "free"}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{profile.token_balance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default AdminUsers;
