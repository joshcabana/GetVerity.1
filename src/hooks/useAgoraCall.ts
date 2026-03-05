import { useState, useEffect, useRef, useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  ILocalVideoTrack,
} from "agora-rtc-sdk-ng";

interface UseAgoraCallParams {
  appId: string;
  channel: string;
  token: string | null;
  uid: number;
  enabled: boolean;
}

/**
 * Creates an anonymized video track by drawing the camera feed to a canvas
 * with a heavy pixelation filter, then capturing the canvas as a MediaStream.
 * Throttled to ~15fps to save battery on mobile.
 */
function createAnonymizedTrack(
  cameraTrack: ICameraVideoTrack,
  canvas: HTMLCanvasElement,
): { processedTrack: MediaStreamTrack; stopLoop: () => void; pauseLoop: () => void; resumeLoop: () => void } {
  const ctx = canvas.getContext("2d")!;
  const video = document.createElement("video");
  video.srcObject = new MediaStream([cameraTrack.getMediaStreamTrack()]);
  video.muted = true;
  video.playsInline = true;
  video.play();

  canvas.width = 320;
  canvas.height = 240;

  let running = true;
  let paused = false;
  const TARGET_INTERVAL = 1000 / 15; // ~15fps
  let lastFrameTime = 0;

  const draw = (timestamp: number) => {
    if (!running) return;
    if (!paused && timestamp - lastFrameTime >= TARGET_INTERVAL) {
      lastFrameTime = timestamp;
      const pixelSize = 12;
      const w = canvas.width / pixelSize;
      const h = canvas.height / pixelSize;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(video, 0, 0, w, h);
      ctx.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);

  const stream = canvas.captureStream(15);
  const processedTrack = stream.getVideoTracks()[0];

  return {
    processedTrack,
    stopLoop: () => {
      running = false;
      paused = false;
      video.pause();
      video.srcObject = null;
    },
    pauseLoop: () => {
      paused = true;
    },
    resumeLoop: () => {
      paused = false;
    },
  };
}

export function useAgoraCall({ appId, channel, token, uid, enabled }: UseAgoraCallParams) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const localTracksRef = useRef<{
    audio: IMicrophoneAudioTrack | null;
    video: ICameraVideoTrack | null;
    customTrack: ILocalVideoTrack | null;
  }>({
    audio: null,
    video: null,
    customTrack: null,
  });
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const stopLoopRef = useRef<(() => void) | null>(null);
  const pauseLoopRef = useRef<(() => void) | null>(null);
  const resumeLoopRef = useRef<(() => void) | null>(null);

  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable refs for join/leave to avoid useEffect dependency loops
  const paramsRef = useRef({ appId, channel, token, uid, enabled });
  paramsRef.current = { appId, channel, token, uid, enabled };

  const cleanupTracks = useCallback(async () => {
    const { audio, video, customTrack } = localTracksRef.current;
    audio?.close();
    video?.close();
    customTrack?.close();
    localTracksRef.current = { audio: null, video: null, customTrack: null };
    stopLoopRef.current?.();
    stopLoopRef.current = null;
    pauseLoopRef.current = null;
    resumeLoopRef.current = null;

    if (clientRef.current) {
      try { await clientRef.current.leave(); } catch { /* ignore */ }
      clientRef.current = null;
    }
    setIsJoined(false);
    setIsRemoteConnected(false);
    setIsRevealed(false);
  }, []);

  const leave = useCallback(async () => {
    await cleanupTracks();
  }, [cleanupTracks]);

  /**
   * Swap from anonymized track to raw camera track (mutual Spark reveal).
   */
  const revealIdentity = useCallback(async () => {
    const client = clientRef.current;
    const rawVideo = localTracksRef.current.video;
    const anonTrack = localTracksRef.current.customTrack;

    if (!client || !rawVideo || !anonTrack || isRevealed) return;

    try {
      await client.unpublish(anonTrack);
      anonTrack.close();
      stopLoopRef.current?.();
      stopLoopRef.current = null;
      pauseLoopRef.current = null;
      resumeLoopRef.current = null;

      await client.publish(rawVideo);
      localTracksRef.current.customTrack = null;
      setIsRevealed(true);
    } catch (err) {
      console.error("Failed to reveal identity track:", err);
    }
  }, [isRevealed]);

  const toggleMic = useCallback(async () => {
    const track = localTracksRef.current.audio;
    if (track) {
      await track.setEnabled(!micOn);
      setMicOn(!micOn);
    }
  }, [micOn]);

  const toggleCamera = useCallback(async () => {
    const track = localTracksRef.current.video;
    const customTrack = localTracksRef.current.customTrack;
    if (track) {
      const nextState = !cameraOn;
      await track.setEnabled(nextState);

      // Also pause/resume the anonymized canvas loop and custom track
      if (customTrack) {
        await customTrack.setEnabled(nextState);
        if (nextState) {
          resumeLoopRef.current?.();
        } else {
          pauseLoopRef.current?.();
        }
      }

      setCameraOn(nextState);
    }
  }, [cameraOn]);

  // Stabilized join/leave effect — deps are only the primitive triggers
  useEffect(() => {
    if (!enabled || !appId || !channel) return;

    let cancelled = false;

    const doJoin = async () => {
      try {
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (remoteUser: IAgoraRTCRemoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === "video" && remoteVideoRef.current) {
            remoteUser.videoTrack?.play(remoteVideoRef.current);
            setIsRemoteConnected(true);
          }
          if (mediaType === "audio") {
            remoteUser.audioTrack?.play();
          }
        });

        client.on("user-unpublished", (_remoteUser: IAgoraRTCRemoteUser, mediaType) => {
          if (mediaType === "video") {
            setIsRemoteConnected(false);
          }
        });

        client.on("user-left", () => {
          setIsRemoteConnected(false);
        });

        await client.join(appId, channel, token || null, uid);

        if (cancelled) {
          await client.leave();
          return;
        }

        const [audioTrack, videoTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack({ facingMode: "user" }),
        ]);

        if (cancelled) {
          audioTrack.close();
          videoTrack.close();
          await client.leave();
          return;
        }

        localTracksRef.current.audio = audioTrack;
        localTracksRef.current.video = videoTrack;

        const { processedTrack, stopLoop, pauseLoop, resumeLoop } = createAnonymizedTrack(videoTrack, canvasRef.current);
        stopLoopRef.current = stopLoop;
        pauseLoopRef.current = pauseLoop;
        resumeLoopRef.current = resumeLoop;

        const customVideoTrack = AgoraRTC.createCustomVideoTrack({
          mediaStreamTrack: processedTrack,
        });
        localTracksRef.current.customTrack = customVideoTrack;

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        await client.publish([audioTrack, customVideoTrack]);
        setIsJoined(true);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to join call";
        console.error("Agora join error:", err);
        setError(message);
        await cleanupTracks();
      }
    };

    doJoin();

    return () => {
      cancelled = true;
      cleanupTracks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, appId, channel]);

  return {
    localVideoRef,
    remoteVideoRef,
    isRemoteConnected,
    isJoined,
    isRevealed,
    micOn,
    cameraOn,
    error,
    leave,
    toggleMic,
    toggleCamera,
    revealIdentity,
  };
}
