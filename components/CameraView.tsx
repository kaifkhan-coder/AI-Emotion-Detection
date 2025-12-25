
import React, { useRef, useEffect, useCallback, useState } from 'react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  isActive: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isRequestingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    if (isRequestingRef.current) return;
    
    setError(null);
    setPermissionRequested(true);
    isRequestingRef.current = true;

    try {
      // 1. First attempt: Ideal high-quality constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("First camera attempt failed, trying fallback...", e);
        // 2. Second attempt: Bare minimum constraints (maximum compatibility)
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure play is called after setting source
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('denied')) {
        setError("Camera access is blocked by your browser. Please click the lock or camera icon in your browser's address bar to reset permissions, then click 'Retry'.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera hardware was detected. Please connect a camera and try again.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError("Camera is already in use by another application. Please close other apps and try again.");
      } else {
        setError(`Unable to access camera: ${err.message || 'Unknown Error'}`);
      }
    } finally {
      isRequestingRef.current = false;
    }
  };

  useEffect(() => {
    if (isActive && !permissionRequested) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const handleManualRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    stopCamera();
    startCamera();
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-500 ${isActive && !error && permissionRequested ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-950/95 backdrop-blur-md z-30">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <i className="fa-solid fa-camera-slash text-red-500 text-3xl animate-pulse"></i>
          </div>
          <h4 className="text-white text-xl font-bold mb-3">Camera Access Blocked</h4>
          <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
            {error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button 
              onClick={handleManualRetry}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-arrows-rotate"></i>
              Retry
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors border border-slate-700 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-rotate"></i>
              Refresh
            </button>
          </div>
          <p className="mt-8 text-[10px] text-slate-500 uppercase tracking-widest font-black">
            Check the lock icon <i className="fa-solid fa-lock mx-1"></i> in your address bar
          </p>
        </div>
      ) : !permissionRequested && isActive ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
            <i className="fa-solid fa-video text-blue-400 text-2xl"></i>
          </div>
          <h4 className="text-white font-bold mb-4">Camera Required</h4>
          <p className="text-slate-500 text-sm mb-6 max-w-xs">Please click the button below and allow camera access to start the analysis.</p>
          <button 
            onClick={handleManualRetry}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-xl shadow-blue-500/30"
          >
            Enable Camera
          </button>
        </div>
      ) : !isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
          <i className="fa-solid fa-power-off text-4xl mb-4"></i>
          <p className="font-medium">Analysis Stream Offline</p>
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
      
      {/* HUD Overlays */}
      {isActive && !error && permissionRequested && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500/20 backdrop-blur-md rounded-full border border-red-500/50">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Live Feed</span>
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-mono bg-slate-900/60 px-2 py-1 rounded backdrop-blur-sm border border-slate-700/30">
            {new Date().toLocaleTimeString()}
          </div>
          {/* Scanning lines effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-1/2 animate-[scan_4s_linear_infinite]" />
        </div>
      )}
    </div>
  );
};

export default CameraView;
