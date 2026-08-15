"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, RotateCcw, X } from "lucide-react";
import {
  captureVideoFrame,
  compressMessagePhoto,
  requestCameraStream,
  stopCameraStream,
} from "@/lib/messagePhotoCapture";

interface MessageCameraSheetProps {
  open: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
}

/** 앨범 없이 카메라로만 촬영 */
export function MessageCameraSheet({
  open,
  onClose,
  onCapture,
}: MessageCameraSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
      setPreview(null);
      setError(null);
      setLoading(false);
      setProcessing(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const stream = await requestCameraStream();
        if (cancelled) {
          stopCameraStream(stream);
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "카메라를 켤 수 없어요. 권한을 확인해 주세요.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  const handleShutter = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      setPreview(captureVideoFrame(video));
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "촬영에 실패했어요.");
    }
  };

  const handleRetake = async () => {
    setPreview(null);
    setError(null);
    setLoading(true);
    try {
      const stream = await requestCameraStream();
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "카메라를 다시 켤 수 없어요.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUsePhoto = async () => {
    if (!preview) return;
    setProcessing(true);
    setError(null);
    try {
      const compressed = await compressMessagePhoto(preview);
      onCapture(compressed);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "사진 처리에 실패했어요.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-white">지금 찍은 사진만 첨부</p>
        <div className="h-10 w-10" />
      </div>

      <div className="relative flex-1 overflow-hidden bg-black">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="촬영 미리보기"
            className="h-full w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full w-full object-cover"
          />
        )}

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
            카메라 준비 중…
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="px-4 py-2 text-center text-xs text-rose-300">{error}</p>
      ) : null}

      <div className="flex items-center justify-center gap-4 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        {preview ? (
          <>
            <button
              type="button"
              onClick={() => void handleRetake()}
              disabled={processing}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-semibold text-white"
            >
              <RotateCcw className="h-4 w-4" />
              다시 찍기
            </button>
            <button
              type="button"
              onClick={() => void handleUsePhoto()}
              disabled={processing}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white"
            >
              <Check className="h-4 w-4" />
              {processing ? "처리 중…" : "이 사진 사용"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleShutter}
            disabled={loading || !!error}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 text-white transition active:scale-95 disabled:opacity-50"
            aria-label="촬영"
          >
            <Camera className="h-7 w-7" />
          </button>
        )}
      </div>
    </div>
  );
}
