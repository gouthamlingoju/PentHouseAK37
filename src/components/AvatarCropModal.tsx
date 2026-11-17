import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  Move,
  Loader2,
  Crop,
} from 'lucide-react';
import { exportCroppedAvatar, CroppedAvatarResult } from '../lib/avatar';

type AspectPresetId = '1:1' | '4:5' | '4:3';

const ASPECT_PRESETS: { id: AspectPresetId; label: string; width: number; height: number }[] = [
  { id: '1:1', label: '1:1 Square', width: 240, height: 240 },
  { id: '4:5', label: '4:5 Portrait', width: 208, height: 260 },
  { id: '4:3', label: '4:3 Landscape', width: 260, height: 195 },
];

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onApply: (cropped: CroppedAvatarResult) => Promise<void> | void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onCancel,
  onApply,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [aspectId, setAspectId] = useState<AspectPresetId>('1:1');
  const [zoom, setZoom] = useState(1);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(
    null
  );

  const preset = ASPECT_PRESETS.find((p) => p.id === aspectId) || ASPECT_PRESETS[0];

  // Clamp pan offset so empty canvas edges never appear inside crop frame
  const clampOffset = useCallback(
    (x: number, y: number, nextZoom: number, nextRot: number, w: number, h: number) => {
      const img = imgRef.current;
      if (!img) return { x: 0, y: 0 };

      const isRotatedOdd = Math.abs(nextRot % 180) === 90;
      const effW = isRotatedOdd ? img.naturalHeight : img.naturalWidth;
      const effH = isRotatedOdd ? img.naturalWidth : img.naturalHeight;

      const baseScale = Math.max(w / effW, h / effH);
      const scale = baseScale * nextZoom;

      const maxX = Math.max(0, (effW * scale - w) / 2);
      const maxY = Math.max(0, (effH * scale - h) / 2);

      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    []
  );

  // Load image whenever modal opens with a new src
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setImgLoaded(false);
    setLoadError('');
    setAspectId('1:1');
    setZoom(1);
    setRotationDeg(0);
    setOffset({ x: 0, y: 0 });
    setSaving(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => {
      setLoadError('Could not load image for cropping. Please try selecting the photo again.');
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Re-clamp offset when aspect ratio, zoom, or rotation changes
  useEffect(() => {
    if (!imgLoaded) return;
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom, rotationDeg, preset.width, preset.height));
  }, [imgLoaded, zoom, rotationDeg, preset.width, preset.height, clampOffset]);

  // Paint WYSIWYG Retina canvas preview
  useEffect(() => {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(preset.width * dpr);
    canvas.height = Math.round(preset.height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isRotatedOdd = Math.abs(rotationDeg % 180) === 90;
    const effW = isRotatedOdd ? img.naturalHeight : img.naturalWidth;
    const effH = isRotatedOdd ? img.naturalWidth : img.naturalHeight;
    const baseScale = Math.max(preset.width / effW, preset.height / effH);
    const scale = baseScale * zoom;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, preset.width, preset.height);

    ctx.save();
    ctx.translate(preset.width / 2 + offset.x, preset.height / 2 + offset.y);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Subtle rule-of-thirds crop guides
    ctx.strokeStyle = dragging ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      const gx = (preset.width / 3) * i;
      const gy = (preset.height / 3) * i;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, preset.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(preset.width, gy);
      ctx.stroke();
    }

    // Subtle avatar framing ring for 1:1 square
    if (aspectId === '1:1') {
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(preset.width / 2, preset.height / 2, preset.width / 2 - 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [imgLoaded, preset.width, preset.height, aspectId, zoom, rotationDeg, offset, dragging]);

  if (!isOpen || !imageSrc) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!imgLoaded) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: offset.x,
      startY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    setOffset(
      clampOffset(
        dragStartRef.current.startX + dx,
        dragStartRef.current.startY + dy,
        zoom,
        rotationDeg,
        preset.width,
        preset.height
      )
    );
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((z) => Math.max(1, Math.min(3, Number((z + delta).toFixed(2)))));
  };

  const handleRotate = () => {
    setRotationDeg((r) => (r + 90) % 360);
  };

  const handleReset = () => {
    setAspectId('1:1');
    setZoom(1);
    setRotationDeg(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleApply = async () => {
    if (!imgRef.current || saving) return;
    setSaving(true);
    try {
      const cropped = await exportCroppedAvatar({
        image: imgRef.current,
        cropWidth: preset.width,
        cropHeight: preset.height,
        offsetX: offset.x,
        offsetY: offset.y,
        zoom,
        rotationDeg,
        maxOutputDim: 384,
      });
      await onApply(cropped);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to crop image.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Adjust & Crop Photo</h3>
              <p className="text-[11px] text-slate-400">Drag to reposition, pinch/slide to zoom</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Aspect Ratio Presets */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            {ASPECT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setAspectId(p.id)}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all ${
                  aspectId === p.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Interactive Crop Viewport */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 p-4 min-h-[290px]">
            {loadError ? (
              <p className="text-xs text-rose-300 text-center px-4">{loadError}</p>
            ) : !imgLoaded ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Loading image...</span>
              </div>
            ) : (
              <>
                <div
                  className="relative rounded-2xl overflow-hidden ring-2 ring-indigo-500/60 shadow-2xl"
                  style={{ width: preset.width, height: preset.height }}
                >
                  <canvas
                    ref={canvasRef}
                    style={{ width: preset.width, height: preset.height }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onWheel={handleWheel}
                    className={`block touch-none select-none ${
                      dragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                  />
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Move className="w-3 h-3 text-indigo-400" />
                  <span>Drag image to frame • {Math.round(zoom * 100)}% zoom</span>
                </div>
              </>
            )}
          </div>

          {/* Zoom & Rotate Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, Number((z - 0.15).toFixed(2))))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min={1}
                max={3}
                step={0.02}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-500 cursor-pointer"
                aria-label="Zoom level"
              />

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.15).toFixed(2))))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rotate 90°</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!imgLoaded || saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Apply & Upload</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
