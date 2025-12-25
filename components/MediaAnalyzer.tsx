
import React, { useRef, useState, useEffect } from 'react';
import { EmotionData } from '../types';

interface MediaAnalyzerProps {
  url: string;
  type: 'image' | 'video';
  onCapture: (base64: string) => void;
  onReset: () => void;
  isAnalyzing: boolean;
  currentEmotion: EmotionData | null;
}

const MediaAnalyzer: React.FC<MediaAnalyzerProps> = ({ url, type, onCapture, onReset, isAnalyzing, currentEmotion }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const captureFrame = () => {
    const element = type === 'video' ? videoRef.current : (document.getElementById('source-image') as HTMLImageElement);
    if (!element || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'video') {
      const video = element as HTMLVideoElement;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
    } else {
      const img = element as HTMLImageElement;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    }

    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    onCapture(base64);
  };

  useEffect(() => {
    let interval: number;
    if (type === 'video' && isPlaying && !isAnalyzing) {
      // PERFORMANCE: Faster 2.5s analysis loop for smoother video tracking
      interval = window.setInterval(() => {
        captureFrame();
      }, 2500); 
    }
    return () => clearInterval(interval);
  }, [type, isPlaying, isAnalyzing]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl group">
      {type === 'video' ? (
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-contain"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
        />
      ) : (
        <img
          id="source-image"
          src={url}
          className="w-full h-full object-contain"
          alt="Analysis target"
        />
      )}

      {/* Media Controls Bar */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <button
          onClick={onReset}
          className="bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm transition-all"
        >
          <i className="fa-solid fa-arrow-rotate-left"></i>
          Change Media
        </button>
      </div>

      {/* Analysis Overlay UI */}
      {currentEmotion?.faceDetected && currentEmotion.boundingBox && (
        <div 
          className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none transition-all duration-500 ease-out flex items-start justify-center"
          style={{
            top: `${currentEmotion.boundingBox.ymin / 10}%`,
            left: `${currentEmotion.boundingBox.xmin / 10}%`,
            width: `${(currentEmotion.boundingBox.xmax - currentEmotion.boundingBox.xmin) / 10}%`,
            height: `${(currentEmotion.boundingBox.ymax - currentEmotion.boundingBox.ymin) / 10}%`,
          }}
        >
          <div className="absolute -top-10 left-0 flex flex-col items-start gap-1">
            <div className="whitespace-nowrap bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter shadow-md">
              <i className="fa-solid fa-user-check"></i>
              {currentEmotion.primaryEmotion} detected
            </div>
            {currentEmotion.faceRecognitionScore !== undefined && (
              <div className="whitespace-nowrap bg-slate-800 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 shadow-md">
                RECOGNITION: {(currentEmotion.faceRecognitionScore * 100).toFixed(1)}%
              </div>
            )}
          </div>
          {/* Corner Markers */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-blue-400" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-blue-400" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-blue-400" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-blue-400" />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Manual Trigger for Images */}
      {type === 'image' && !isAnalyzing && (
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
           <button 
             onClick={captureFrame}
             className="pointer-events-auto bg-white text-slate-950 px-6 py-2 rounded-full font-bold text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform hover:scale-105 active:scale-95"
           >
             Analyze Selection
           </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
             <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
             <span className="text-xs font-bold text-blue-400 tracking-widest uppercase animate-pulse">Scanning Neural Paths</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaAnalyzer;
