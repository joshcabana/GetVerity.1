import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";

interface SelfieStepProps {
  onNext: (verified: boolean) => void;
}

const SelfieStep = ({ onNext }: SelfieStepProps) => {
  const { user } = useAuth();
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isNative = Capacitor.isNativePlatform();

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Native camera flow using Capacitor Camera plugin
  const takeNativeSelfie = useCallback(async () => {
    if (!user) return;
    setUploading(true);
    try {
      const photo = await CapCamera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        direction: undefined, // front camera default on selfie
        width: 640,
        height: 480,
      });

      if (!photo.base64String) {
        toast.error("No photo captured. Try again.");
        setUploading(false);
        return;
      }

      // Convert base64 to blob
      const byteString = atob(photo.base64String);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: `image/${photo.format || "jpeg"}` });

      const path = `selfies/${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("verifications")
        .upload(path, blob, { contentType: "image/jpeg" });

      if (error) {
        toast.error("Upload failed. Try again.");
        setUploading(false);
        return;
      }

      setCaptured(true);
      setUploading(false);
      toast.success("Selfie captured!");
    } catch {
      toast.error("Camera access denied. You can verify later.");
      setUploading(false);
    }
  }, [user]);

  // Web browser camera flow (existing)
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCapturing(true);
    } catch {
      toast.error("Camera access denied. You can verify later.");
    }
  }, []);

  const stopCameraStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const captureAndUpload = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !user) return;

    // Guard against black frame if video isn't ready yet
    if (videoRef.current.readyState < 2) {
      toast.info("Camera is still warming up — try again in a moment.");
      return;
    }

    setUploading(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Stop camera
    streamRef.current?.getTracks().forEach((t) => t.stop());

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setUploading(false);
        return;
      }

      const path = `selfies/${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("verifications")
        .upload(path, blob, { contentType: "image/jpeg" });

      if (error) {
        toast.error("Upload failed. Try again.");
        setUploading(false);
        return;
      }

      setCaptured(true);
      setCapturing(false);
      setUploading(false);
      toast.success("Selfie captured!");
    }, "image/jpeg", 0.85);
  }, [user]);

  const handleTakeSelfie = isNative ? takeNativeSelfie : startCamera;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center text-center px-6"
    >
      {!capturing && !captured && (
        <>
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-3">
            Selfie verification
          </h2>
          <p className="text-muted-foreground max-w-md mb-4 text-sm leading-relaxed">
            A quick liveness check proves you're a real person. Verified members get
            access to exclusive Verified-only Drops.
          </p>
          <div className="flex items-center gap-2 text-xs text-primary/80 mb-10">
            <ShieldCheck className="w-4 h-4" />
            <span>Your selfie is processed on-device and never stored publicly.</span>
          </div>
          <div className="w-full max-w-sm space-y-3">
            <Button variant="gold" size="lg" onClick={handleTakeSelfie} disabled={uploading} className="group w-full">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Camera className="mr-2 h-4 w-4" /> Take selfie now</>
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={() => { stopCameraStream(); onNext(false); }} className="w-full text-muted-foreground">
              I'll do this later <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {capturing && !isNative && (
        <div className="w-full max-w-sm">
          <div className="relative rounded-2xl overflow-hidden mb-6 bg-secondary">
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <Button variant="gold" size="lg" onClick={captureAndUpload} disabled={uploading} className="w-full">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Camera className="mr-2 h-4 w-4" /> Capture</>
            )}
          </Button>
        </div>
      )}

      {captured && (
        <>
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-serif text-2xl text-foreground mb-3">Selfie submitted</h2>
          <p className="text-muted-foreground text-sm mb-8">Your selfie has been submitted and will be reviewed shortly.</p>
          <Button variant="gold" size="lg" onClick={() => onNext(true)} className="w-full max-w-sm">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </>
      )}
    </motion.div>
  );
};

export default SelfieStep;
