"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";

import { useAppT } from "./i18n";

// Live rear-camera preview; "Take photo" hands back a JPEG blob.
export default function CameraCapture({ onCapture, onClose }: { onCapture: (b: Blob) => void; onClose: () => void }) {
  const { t } = useAppT();
  const video = useRef<HTMLVideoElement>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((tr) => tr.stop());
          return;
        }
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setDenied(true));
    if (!navigator.mediaDevices) setDenied(true);
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  function snap() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob((b) => b && onCapture(b), "image/jpeg", 0.9);
  }

  return (
    <div className="relative overflow-hidden rounded-panel bg-fg">
      {denied ? (
        <p className="flex aspect-[4/3] items-center justify-center px-6 text-center text-body text-white/80">{t.scan.cameraDenied}</p>
      ) : (
        <video ref={video} autoPlay playsInline muted className="aspect-[4/3] w-full object-cover" />
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label={t.scan.closeCamera}
        className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      {!denied && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent p-5">
          <Button variant="calorie" size="lg" onClick={snap}>
            <Camera className="h-5 w-5" aria-hidden="true" />
            {t.scan.snap}
          </Button>
        </div>
      )}
    </div>
  );
}
