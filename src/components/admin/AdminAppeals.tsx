import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminAppeals = () => {
  const queryClient = useQueryClient();

  const { data: appeals = [] } = useQuery({
    queryKey: ["admin-appeals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appeals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const appealActionMutation = useMutation({
    mutationFn: async ({ appealId, status }: { appealId: string; status: "upheld" | "denied" }) => {
      const { error } = await supabase
        .from("appeals")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", appealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appeals"] });
      toast.success("Appeal updated");
    },
  });

  return (
    <motion.div key="appeals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="font-serif text-2xl text-foreground mb-1">Appeals Inbox</h1>
      <p className="text-sm text-muted-foreground/60 mb-6">Review user appeals with care and fairness</p>

      {appeals.length === 0 && (
        <p className="text-center text-muted-foreground/50 py-16 text-sm">No appeals to review.</p>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appeals.map((appeal) => (
              <TableRow key={appeal.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{appeal.user_id.slice(0, 8)}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{appeal.explanation}</TableCell>
                <TableCell className="text-muted-foreground/60 text-sm">{new Date(appeal.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={appeal.status === "pending" ? "outline" : "secondary"}
                    className={`text-[10px] ${
                      appeal.status === "upheld" ? "text-primary border-primary/30" :
                      appeal.status === "denied" ? "text-destructive border-destructive/30" : ""
                    }`}
                  >
                    {appeal.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {appeal.status === "pending" && (
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary"
                        onClick={() => appealActionMutation.mutate({ appealId: appeal.id, status: "upheld" })}>
                        <Check className="w-3 h-3 mr-1" />
                        Uphold
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => appealActionMutation.mutate({ appealId: appeal.id, status: "denied" })}>
                        <X className="w-3 h-3 mr-1" />
                        Deny
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default AdminAppeals;
