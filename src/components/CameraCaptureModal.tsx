import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Camera,
  SwitchCamera,
  AlertCircle,
  Loader2,
  Upload,
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureFile: (file: File) => void;
  defaultFacingMode?: 'user' | 'environment';
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptureFile,
  defaultFacingMode = 'user',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(defaultFacingMode);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState('');

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (mode: 'user' | 'environment') => {
      stopStream();
      setStarting(true);
      setError('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStarting(false);
        setError('Live camera preview is not supported in this browser. Use the native camera option below.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1080 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStarting(false);
      } catch (err: any) {
        setStarting(false);
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setError('Camera permission was denied. Allow camera access or use the native camera button below.');
        } else if (err?.name === 'NotFoundError') {
          setError('No camera detected on this device.');
        } else {
          setError('Unable to open live camera. You can still capture using your device camera below.');
        }
      }
    },
    [stopStream]
  );

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }
    setFacingMode(defaultFacingMode);
    startCamera(defaultFacingMode);

    return () => {
      stopStream();
    };
  }, [isOpen, defaultFacingMode, startCamera, stopStream]);

  if (!isOpen) return null;

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror selfie capture so it matches what the user sees
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopStream();
        onCaptureFile(file);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    stopStream();
    onCaptureFile(file);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Take Photo</h3>
              <p className="text-[11px] text-slate-400">Snap a photo, then crop & adjust</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="p-5 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square flex items-center justify-center">
            {error ? (
              <div className="p-5 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg"
                >
                  <Upload className="w-4 h-4" />
                  <span>Open Device Camera</span>
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover ${
                    facingMode === 'user' ? '-scale-x-100' : ''
                  }`}
                />
                {starting && (
                  <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-slate-300">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    <span className="text-xs">Starting camera...</span>
                  </div>
                )}
              </>
            )}

            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture={facingMode}
              onChange={handleNativeCapture}
              className="hidden"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleSwitchCamera}
              disabled={starting || Boolean(error)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Flip Front / Back Camera"
            >
              <SwitchCamera className="w-4 h-4 text-indigo-400" />
              <span>Flip</span>
            </button>

            <button
              type="button"
              onClick={handleCapture}
              disabled={starting || Boolean(error)}
              className="flex-1 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Photo</span>
            </button>

            <button
              type="button"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
              title="Use native phone camera app"
            >
              Native
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
