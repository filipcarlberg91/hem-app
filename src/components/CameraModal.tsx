import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Upload, X, Check, Image as ImageIcon } from 'lucide-react';

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (base64DataUrl: string, mimeType: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ open, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileGalleryInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>('image/jpeg');
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const getNativeCapCamera = () => {
    if (typeof window === 'undefined') return null;
    return (window as any).Capacitor?.Plugins?.Camera || null;
  };

  const getNativeBridge = () => {
    if (typeof window === 'undefined') return null;
    return (window as any).HemNativeBridge || null;
  };

  const stopActiveStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__onHemNativeCameraCapture = (dataUrl: string) => {
      if (dataUrl && typeof dataUrl === 'string') {
        setPreviewMime('image/jpeg');
        setPreviewDataUrl(dataUrl);
        setCameraError(null);
      }
    };
    const onPermGranted = () => {
      setRetryCount((c) => c + 1);
    };
    window.addEventListener('hem-camera-permission-granted', onPermGranted);
    return () => {
      window.removeEventListener('hem-camera-permission-granted', onPermGranted);
      delete (window as any).__onHemNativeCameraCapture;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      stopActiveStream();
      setPreviewDataUrl(null);
      setCameraError(null);
      setIsStreamActive(false);
      return;
    }

    let cancelled = false;

    const initCamera = async () => {
      try {
        setCameraError(null);
        stopActiveStream();

        const bridge = getNativeBridge();
        if (bridge && typeof bridge.requestCameraPermission === 'function') {
          try {
            const hasPerm = bridge.requestCameraPermission();
            if (!hasPerm) {
              // Wait briefly in case user is tapping Allow on the Android permission prompt
              await new Promise((r) => setTimeout(r, 600));
            }
          } catch {
            // Continue
          }
        }

        const capCam = getNativeCapCamera();
        if (capCam?.requestPermissions) {
          try {
            await capCam.requestPermissions({ permissions: ['camera', 'photos'] });
          } catch {
            // Continue
          }
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('WebRTC camera unavailable');
        }

        let mediaStream: MediaStream | null = null;
        const constraintCandidates: MediaStreamConstraints[] = [
          {
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 960 },
            },
            audio: false,
          },
          {
            video: { facingMode },
            audio: false,
          },
          {
            video: true,
            audio: false,
          },
        ];

        for (const constraints of constraintCandidates) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (mediaStream) break;
          } catch {
            // Try next fallback constraint
          }
        }

        if (!mediaStream) {
          throw new Error('Could not start camera stream');
        }

        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            await videoRef.current.play();
          } catch {
            // autoPlay handles this if play() is interrupted
          }
          setIsStreamActive(true);
          setCameraError(null);
        }
      } catch {
        if (!cancelled) {
          setIsStreamActive(false);
          setCameraError(
            'Kunde inte starta live-kameran direkt i vyn. Tryck på "Starta kameran" nedan för att ta ett foto med enhetens kamera!'
          );
        }
      }
    };

    initCamera();

    return () => {
      cancelled = true;
      stopActiveStream();
    };
  }, [open, facingMode, retryCount, stopActiveStream]);

  if (!open) return null;

  const handleNativeCameraShot = async (source: 'CAMERA' | 'PHOTOS') => {
    if (source === 'CAMERA') {
      const bridge = getNativeBridge();
      if (bridge && typeof bridge.openNativeCamera === 'function') {
        try {
          const launched = bridge.openNativeCamera();
          if (launched) return;
        } catch {
          // Fall through
        }
      }
    }

    const capCam = getNativeCapCamera();
    if (capCam?.getPhoto) {
      try {
        if (capCam.requestPermissions) {
          await capCam.requestPermissions({ permissions: ['camera', 'photos'] });
        }
        const photo = await capCam.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: 'dataUrl',
          source,
        });
        if (photo?.dataUrl) {
          setPreviewMime(`image/${photo.format || 'jpeg'}`);
          setPreviewDataUrl(photo.dataUrl);
          return;
        }
      } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('cancel') || msg.includes('user cancelled')) {
          return;
        }
      }
    }

    if (source === 'CAMERA') {
      fileCameraInputRef.current?.click();
    } else {
      fileGalleryInputRef.current?.click();
    }
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewMime('image/jpeg');
    setPreviewDataUrl(dataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewMime(file.type || 'image/jpeg');
        setPreviewDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D8F3E3] text-[#183D2C]">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#141E18]">Fota recept eller maträtt</h3>
              <p className="text-xs text-[#4E6357]">
                Kameran tolkar ingredienser och steg automatiskt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#38493F] hover:bg-[#E3EFE7]"
            aria-label="Stäng kamera"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hidden native inputs for fallback camera & gallery */}
        <input
          ref={fileCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={fileGalleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-4 overflow-hidden rounded-2xl bg-[#101D15] relative aspect-4/3 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${
              !previewDataUrl && !cameraError ? 'block' : 'hidden'
            }`}
          />

          {previewDataUrl && (
            <img
              src={previewDataUrl}
              alt="Förhandsgranskning av receptfoto"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          )}

          {!previewDataUrl && cameraError && (
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#183D2C] text-[#A6F2C6]">
                <Camera className="h-7 w-7" />
              </div>
              <p className="text-xs sm:text-sm text-[#D8F3E3] max-w-xs mx-auto leading-relaxed">
                {cameraError}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleNativeCameraShot('CAMERA')}
                  className="w-full sm:w-auto min-h-[46px] rounded-2xl bg-[#A6F2C6] px-5 py-2.5 text-xs font-extrabold text-[#082114] hover:bg-[#8CE6B4] flex items-center justify-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Starta kameran
                </button>
                <button
                  type="button"
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="w-full sm:w-auto min-h-[46px] rounded-2xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/25 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Försök live-kamera igen
                </button>
                <button
                  type="button"
                  onClick={() => handleNativeCameraShot('PHOTOS')}
                  className="w-full sm:w-auto min-h-[46px] rounded-2xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/25 flex items-center justify-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Välj ur fotoalbum
                </button>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
          {!previewDataUrl ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {isStreamActive && (
                  <button
                    type="button"
                    onClick={() =>
                      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                    }
                    className="min-h-[44px] rounded-2xl border border-[#CDE0D4] px-3.5 py-2 text-xs font-semibold text-[#183D2C] hover:bg-[#E7F3EC] flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Byt kamera
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleNativeCameraShot('CAMERA')}
                  className="min-h-[44px] rounded-2xl border border-[#CDE0D4] bg-white px-3.5 py-2 text-xs font-bold text-[#183D2C] hover:bg-[#E7F3EC] flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Camera className="h-4 w-4" />
                  Systemkamera
                </button>
                <button
                  type="button"
                  onClick={() => handleNativeCameraShot('PHOTOS')}
                  className="min-h-[44px] rounded-2xl border border-[#CDE0D4] bg-white px-3.5 py-2 text-xs font-semibold text-[#183D2C] hover:bg-[#E7F3EC] flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Upload className="h-4 w-4" />
                  Välj bildfil
                </button>
              </div>
              {isStreamActive && !cameraError && (
                <button
                  type="button"
                  onClick={takeSnapshot}
                  className="min-h-[44px] rounded-2xl bg-[#183D2C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0F291E] flex items-center gap-2 whitespace-nowrap"
                >
                  <Camera className="h-4 w-4" />
                  Ta bild
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPreviewDataUrl(null)}
                className="min-h-[44px] rounded-2xl border border-[#CDE0D4] px-4 py-2 text-xs font-semibold text-[#2E4035] hover:bg-[#E7F3EC] whitespace-nowrap"
              >
                Ta om bild
              </button>
              <button
                type="button"
                onClick={() => {
                  onCapture(previewDataUrl, previewMime);
                  onClose();
                }}
                className="min-h-[44px] rounded-2xl bg-[#183D2C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0F291E] flex items-center gap-2 whitespace-nowrap"
              >
                <Check className="h-4 w-4" />
                Skanna recept från bild
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
