
import React, { useRef, useEffect, useCallback } from 'react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  isActive: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
      }
    };

    if (isActive) {
      startCamera();
    } else if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        onCapture(base64);
      }
    }
  }, [onCapture]);

  // Handle external triggers or automated capturing logic could be added here
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        // Only if we wanted true continuous stream, but usually 
        // we trigger this from the parent to save API costs
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
      />
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
          <i className="fa-solid fa-camera-slash text-4xl mb-4"></i>
          <p className="font-medium">Camera is offline</p>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* HUD Overlays */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500/20 backdrop-blur-md rounded-full border border-red-500/50">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Live Feed</span>
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-mono">
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
