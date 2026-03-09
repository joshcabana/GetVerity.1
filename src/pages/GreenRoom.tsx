import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Mic, Wifi, Sun, Shield, Eye, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

type CheckStatus = "pending" | "ok" | "warn" | "error";

const GreenRoom = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  const [cameraStatus, setCameraStatus] = useState<CheckStatus>("pending");
  const [micStatus, setMicStatus] = useState<CheckStatus>("pending");
  const [networkStatus, setNetworkStatus] = useState<CheckStatus>("pending");
  const [micLevel, setMicLevel] = useState(0);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);

  // Camera + Mic
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraStatus("ok");
        setMicStatus("ok");

        // Audio analyser
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setMicLevel(Math.min(100, (avg / 128) * 100));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        if (!cancelled) {
          setCameraStatus("error");
          setMicStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  // Pre-load Agora SDK so it's cached before the call starts.
  // This avoids a 1.4MB download delay when entering a live call.
  useEffect(() => {
    import("agora-rtc-sdk-ng").catch(() => {
      // Non-critical — SDK will load on demand if pre-load fails
    });
  }, []);

  // Network check
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const start = performance.now();
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: "HEAD",
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const latency = Math.round(performance.now() - start);
        if (cancelled) return;
        setNetworkLatency(latency);
        setNetworkStatus(latency < 300 ? "ok" : latency < 800 ? "warn" : "error");
      } catch {
        if (!cancelled) setNetworkStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const statusColor = (s: CheckStatus) => {
    if (s === "ok") return "text-green-500";
    if (s === "warn") return "text-amber-500";
    if (s === "error") return "text-destructive";
    return "text-muted-foreground animate-pulse";
  };

  const statusLabel = (s: CheckStatus) => {
    if (s === "ok") return "Ready";
    if (s === "warn") return "Okay";
    if (s === "error") return "Issue";
    return "Checking…";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>Green Room — Verity</title>
        <meta name="description" content="Check your camera, mic, and connection before joining a Verity Drop." />
      </Helmet>

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container max-w-2xl mx-auto px-5 h-14 flex items-center">
          <h1 className="font-serif text-lg text-foreground">Green Room</h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-5 pt-6 space-y-6">
        {/* Camera preview */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden border border-border bg-card aspect-video">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          {cameraStatus === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <p className="text-sm text-muted-foreground">Camera not available — check browser permissions</p>
            </div>
          )}
          <Badge variant="secondary" className="absolute top-3 left-3 gap-1.5">
            <Eye className="w-3 h-3" />
            Anonymous filter ON
          </Badge>
        </motion.div>

        {/* Hardware checks */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3">
          {/* Camera */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2">
            <Camera className={`w-5 h-5 ${statusColor(cameraStatus)}`} />
            <span className="text-[11px] font-medium text-foreground">Camera</span>
            <span className={`text-[10px] ${statusColor(cameraStatus)}`}>{statusLabel(cameraStatus)}</span>
          </div>
          {/* Mic */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2">
            <Mic className={`w-5 h-5 ${statusColor(micStatus)}`} />
            <span className="text-[11px] font-medium text-foreground">Microphone</span>
            <span className={`text-[10px] ${statusColor(micStatus)}`}>{statusLabel(micStatus)}</span>
            {micStatus === "ok" && <Progress value={micLevel} className="h-1.5 w-full" />}
          </div>
          {/* Network */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2">
            <Wifi className={`w-5 h-5 ${statusColor(networkStatus)}`} />
            <span className="text-[11px] font-medium text-foreground">Network</span>
            <span className={`text-[10px] ${statusColor(networkStatus)}`}>
              {networkStatus === "pending" ? "Checking…" : networkLatency !== null ? `${networkLatency}ms` : "Issue"}
            </span>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sun className="w-4 h-4 text-primary" />
            Quick Tips
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Find good lighting — face a window if you can</li>
            <li>• Use headphones to avoid echo</li>
            <li>• Close other video apps for best performance</li>
          </ul>
        </motion.div>

        {/* Reassurance */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary/60" />
            <span>You can leave anytime · Nothing is recorded</span>
          </div>

          <Button variant="gold" size="lg" className="w-full max-w-xs" onClick={() => navigate("/lobby")}>
            Enter Lobby
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <button onClick={() => navigate("/drops/friendfluence")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
            <Users className="w-3.5 h-3.5" />
            Add a Guardian Net contact
          </button>
        </motion.div>
      </main>

      <BottomNav activeTab="home" />
    </div>
  );
};

export default GreenRoom;
