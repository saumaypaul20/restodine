import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCw,
  Sparkles,
  Upload,
  Check,
  AlertCircle,
  FileText,
  RefreshCw,
  Receipt,
} from 'lucide-react';

interface TransactionCameraModalProps {
  isOpen: boolean;
  billNumber: string;
  tableNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  onCapture: (imageDataUrl: string, referenceNote?: string) => void;
  onClose: () => void;
}

export const TransactionCameraModal: React.FC<TransactionCameraModalProps> = ({
  isOpen,
  billNumber,
  tableNumber,
  amount,
  currency,
  paymentMethod,
  onCapture,
  onClose,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [referenceNote, setReferenceNote] = useState('');
  const [flashEffect, setFlashEffect] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start Camera Stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setIsStartingCamera(true);
    setCameraError(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser. Please use the upload option.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access warning:', err);
      let msg = 'Could not access device camera. Please check camera permissions or upload an image.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser settings or upload a slip photo.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this system. You can upload a slip photo or generate a sample receipt.';
      }
      setCameraError(msg);
    } finally {
      setIsStartingCamera(false);
    }
  }, [stream]);

  // Clean up stream on unmount or close
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  // Switch between front & back camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame from live video
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger flash animation
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Add watermark banner on the captured slip
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, height - 42, width, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`BILL: ${billNumber}  |  TABLE: ${tableNumber}  |  ${paymentMethod}`, 16, height - 24);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(new Date().toLocaleString(), 16, height - 9);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // File fallback handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCapturedImage(event.target.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate a realistic, instant sample transaction receipt (useful for testing & desktop demos)
  const handleGenerateSampleReceipt = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 620;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background receipt paper
    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Paper border and shadows
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    // Header
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('THE CURRY ROOM', canvas.width / 2, 50);

    ctx.fillStyle = '#78716c';
    ctx.font = '11px monospace';
    ctx.fillText('42 Heritage Boulevard, Connaught Place', canvas.width / 2, 72);
    ctx.fillText('GSTIN: 07AAAAA0000A1Z5', canvas.width / 2, 88);

    // Divider
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#a8a29e';
    ctx.beginPath();
    ctx.moveTo(28, 105);
    ctx.lineTo(canvas.width - 28, 105);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bill info
    ctx.textAlign = 'left';
    ctx.fillStyle = '#292524';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`TRANSACTION PROOF · ${paymentMethod}`, 30, 130);

    ctx.font = '12px monospace';
    ctx.fillText(`BILL NO: ${billNumber}`, 30, 155);
    ctx.fillText(`TABLE: Table ${tableNumber}`, 30, 175);
    ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, 30, 195);
    ctx.fillText(`TIME: ${new Date().toLocaleTimeString()}`, 30, 215);

    // Channel details
    const refCode = `${paymentMethod}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    ctx.fillText(`CHANNEL: ${paymentMethod === 'UPI' ? 'UPI QR Pay' : paymentMethod === 'CARD' ? 'EDC POS Swipe' : 'Cash Counter'}`, 30, 240);
    ctx.fillText(`TXN REF: ${refCode}`, 30, 260);

    // Divider
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(28, 280);
    ctx.lineTo(canvas.width - 28, 280);
    ctx.stroke();
    ctx.setLineDash([]);

    // Grand total box
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(28, 295, canvas.width - 56, 70);
    ctx.strokeStyle = '#d6d3d1';
    ctx.strokeRect(28, 295, canvas.width - 56, 70);

    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('AMOUNT SETTLED:', 42, 335);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`${currency}${amount.toFixed(2)}`, canvas.width - 42, 340);

    // Verification Stamp
    ctx.save();
    ctx.translate(canvas.width / 2, 450);
    ctx.rotate(-0.08);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    ctx.strokeRect(-130, -35, 260, 70);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('PAID & VERIFIED', 0, -8);
    ctx.font = '10px monospace';
    ctx.fillText(`TERMINAL STATION · ${new Date().toLocaleTimeString()}`, 0, 16);
    ctx.restore();

    // Barcode emulation
    ctx.fillStyle = '#292524';
    const barcodeY = 525;
    for (let x = 40; x < canvas.width - 40; x += 5) {
      const barW = (x % 3 === 0 ? 3 : 1.5);
      ctx.fillRect(x, barcodeY, barW, 35);
    }

    ctx.textAlign = 'center';
    ctx.font = '9px monospace';
    ctx.fillStyle = '#78716c';
    ctx.fillText(`*${billNumber}-${tableNumber}-${refCode}*`, canvas.width / 2, 575);
    ctx.fillText('CUSTOMER COPY · RESTAURANT ARCHIVE', canvas.width / 2, 595);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    setReferenceNote(refCode);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    onCapture(capturedImage, referenceNote.trim() || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Camera Transaction Proof</h3>
              <p className="text-[11px] text-slate-400">
                {billNumber} · Table {tableNumber} · {currency}{amount.toFixed(2)} ({paymentMethod})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder or Preview Area */}
        <div className="relative flex-1 bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          {flashEffect && <div className="absolute inset-0 bg-white z-30 animate-fade-out" />}

          {capturedImage ? (
            /* Image Preview */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-3 bg-slate-950">
              <img
                src={capturedImage}
                alt="Captured Transaction Proof"
                className="max-h-[340px] max-w-full rounded-xl object-contain border border-slate-800 shadow-lg"
              />
              <div className="absolute top-5 right-5 bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <Check className="w-3.5 h-3.5" />
                <span>Photo Snapped</span>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative w-full h-full flex items-center justify-center">
              {cameraError ? (
                <div className="p-6 text-center space-y-3 max-w-xs text-slate-300">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-xs font-medium text-slate-300">{cameraError}</p>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload / Select Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateSampleReceipt}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Generate Sample Slip</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover max-h-[360px]"
                  />

                  {/* Receipt Guide Framing Overlay */}
                  <div className="absolute inset-6 border-2 border-dashed border-amber-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between text-[10px] font-mono text-amber-300 bg-slate-900/60 px-2 py-0.5 rounded self-start">
                      ALIGN RECEIPT / SLIP IN FRAME
                    </div>
                    <div className="text-center text-[10px] text-slate-300 bg-slate-900/60 py-1 rounded">
                      Hold still over cash bill, card slip, or UPI screen
                    </div>
                  </div>

                  {/* Switch Camera Button (top-right of viewfinder) */}
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors shadow-md"
                    title="Flip camera"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Bottom Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {/* Notes or Ref ID */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Slip Reference / Authorization Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Card Auth #4920, UPI UTR 29481903, Cash drawer slip #12"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
          </div>

          {/* Action Buttons */}
          {capturedImage ? (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Use This Transaction Photo</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              {/* Shutter Button Bar */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload File</span>
                </button>

                {/* Big Shutter Button */}
                <button
                  type="button"
                  onClick={handleSnapPhoto}
                  disabled={Boolean(cameraError)}
                  className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg transition-transform border-4 border-slate-800 disabled:opacity-40"
                  title="Snap photo with camera"
                >
                  <Camera className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={handleGenerateSampleReceipt}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Generate realistic digital slip for demo"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sample Slip</span>
                </button>
              </div>

              <p className="text-[10px] text-center text-slate-500">
                Tap the camera button to snap an image of the physical bill or transaction slip
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
