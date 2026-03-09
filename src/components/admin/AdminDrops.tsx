import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

interface DropForm {
  title: string;
  description: string;
  room_id: string;
  scheduled_at: string;
  duration_minutes: number;
  max_capacity: number;
  region: string;
  timezone: string;
  is_friendfluence: boolean;
}

const emptyDropForm: DropForm = {
  title: "",
  description: "",
  room_id: "",
  scheduled_at: "",
  duration_minutes: 60,
  max_capacity: 50,
  region: "AU",
  timezone: "Australia/Sydney",
  is_friendfluence: false,
};

const AdminDrops = () => {
  const queryClient = useQueryClient();
  const [dropFormOpen, setDropFormOpen] = useState(false);
  const [editingDrop, setEditingDrop] = useState<(Tables<"drops"> & { rooms?: { name: string } | null }) | null>(null);
  const [dropForm, setDropForm] = useState<DropForm>(emptyDropForm);

  const { data: adminDrops = [] } = useQuery({
    queryKey: ["admin-drops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drops")
        .select("*, rooms(name)")
        .order("scheduled_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createDropMutation = useMutation({
    mutationFn: async (form: DropForm) => {
      const { error } = await supabase.from("drops").insert({
        title: form.title,
        description: form.description || null,
        room_id: form.room_id,
        scheduled_at: form.scheduled_at,
        duration_minutes: form.duration_minutes,
        max_capacity: form.max_capacity,
        region: form.region,
        timezone: form.timezone,
        is_friendfluence: form.is_friendfluence,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-drops"] });
      setDropFormOpen(false);
      setDropForm(emptyDropForm);
      toast.success("Drop created");
    },
    onError: () => toast.error("Failed to create drop"),
  });

  const updateDropMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: DropForm }) => {
      const { error } = await supabase.from("drops").update({
        title: form.title,
        description: form.description || null,
        room_id: form.room_id,
        scheduled_at: form.scheduled_at,
        duration_minutes: form.duration_minutes,
        max_capacity: form.max_capacity,
        region: form.region,
        timezone: form.timezone,
        is_friendfluence: form.is_friendfluence,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-drops"] });
      setEditingDrop(null);
      setDropForm(emptyDropForm);
      toast.success("Drop updated");
    },
    onError: () => toast.error("Failed to update drop"),
  });

  const deleteDropMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-drops"] });
      toast.success("Drop deleted");
    },
    onError: () => toast.error("Failed to delete drop"),
  });

  const openEditDrop = (drop: typeof adminDrops[0]) => {
    setEditingDrop(drop);
    setDropForm({
      title: drop.title,
      description: drop.description || "",
      room_id: drop.room_id,
      scheduled_at: drop.scheduled_at.slice(0, 16),
      duration_minutes: drop.duration_minutes,
      max_capacity: drop.max_capacity,
      region: drop.region,
      timezone: drop.timezone,
      is_friendfluence: drop.is_friendfluence,
    });
  };

  const DropFormFields = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={dropForm.title} onChange={(e) => setDropForm((f) => ({ ...f, title: e.target.value }))} placeholder="Friday Night Drop" />
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Textarea value={dropForm.description} onChange={(e) => setDropForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Room</Label>
          <Select value={dropForm.room_id} onValueChange={(v) => setDropForm((f) => ({ ...f, room_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
            <SelectContent>
              {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Scheduled at</Label>
          <Input type="datetime-local" value={dropForm.scheduled_at} onChange={(e) => setDropForm((f) => ({ ...f, scheduled_at: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Duration (min)</Label>
          <Input type="number" value={dropForm.duration_minutes} onChange={(e) => setDropForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))} />
        </div>
        <div>
          <Label className="text-xs">Max capacity</Label>
          <Input type="number" value={dropForm.max_capacity} onChange={(e) => setDropForm((f) => ({ ...f, max_capacity: Number(e.target.value) }))} />
        </div>
        <div>
          <Label className="text-xs">Region</Label>
          <Select value={dropForm.region} onValueChange={(v) => setDropForm((f) => ({ ...f, region: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["AU", "NZ", "US", "UK"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={dropForm.is_friendfluence} onCheckedChange={(v) => setDropForm((f) => ({ ...f, is_friendfluence: v }))} />
        <Label className="text-xs">Friendfluence (bring a friend)</Label>
      </div>
    </div>
  );

  return (
    <motion.div key="drops" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-foreground mb-1">Drop Scheduling</h1>
          <p className="text-sm text-muted-foreground/60">{adminDrops.length} drops total</p>
        </div>
        <Button variant="default" size="sm" onClick={() => { setDropForm(emptyDropForm); setDropFormOpen(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Drop
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminDrops.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground/50 py-8">No drops created yet</TableCell>
              </TableRow>
            )}
            {adminDrops.map((drop) => (
              <TableRow key={drop.id}>
                <TableCell className="font-medium text-foreground text-sm">{drop.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{(drop as unknown as { rooms?: { name: string } | null }).rooms?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {format(new Date(drop.scheduled_at), "MMM d, h:mm a")}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{drop.max_capacity}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{drop.region}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${
                    drop.status === "live" ? "text-primary border-primary/30" :
                    drop.status === "completed" ? "text-muted-foreground" : ""
                  }`}>{drop.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDrop(drop)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{drop.title}"?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this drop and all associated RSVPs.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDropMutation.mutate(drop.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={dropFormOpen} onOpenChange={setDropFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Drop</DialogTitle></DialogHeader>
          <DropFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDropFormOpen(false)}>Cancel</Button>
            <Button onClick={() => createDropMutation.mutate(dropForm)} disabled={!dropForm.title || !dropForm.room_id || !dropForm.scheduled_at}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDrop} onOpenChange={(open) => { if (!open) setEditingDrop(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Drop</DialogTitle></DialogHeader>
          <DropFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDrop(null)}>Cancel</Button>
            <Button onClick={() => editingDrop && updateDropMutation.mutate({ id: editingDrop.id, form: dropForm })}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminDrops;
