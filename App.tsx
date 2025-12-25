
import React, { useState, useCallback, useEffect, useRef } from 'react';
import CameraView from './components/CameraView';
import EmotionDashboard from './components/EmotionDashboard';
import MediaAnalyzer from './components/MediaAnalyzer';
import { analyzeEmotion } from './services/geminiService';
import { compressImage } from './utils/imageUtils';
import { AppState, EmotionData, AppMode } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    mode: 'Live',
    isAnalyzing: false,
    history: [],
    currentEmotion: null,
    error: null,
    autoMode: false,
    mediaUrl: null,
    mediaType: null
  });

  const autoModeTimer = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(async (base64: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      // SPEED OPTIMIZATION: Reduce image payload size before API call
      const optimizedBase64 = await compressImage(base64, 512);
      const result = await analyzeEmotion(optimizedBase64);
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        currentEmotion: result,
        history: [...prev.history, result].slice(-100)
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: err.message,
        autoMode: false
      }));
    }
  }, []);

  const triggerLiveCapture = () => {
    const video = document.querySelector('video');
    const canvas = document.createElement('canvas');
    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        handleCapture(base64);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setState(prev => ({
        ...prev,
        mode: 'Media',
        mediaUrl: url,
        mediaType: type,
        currentEmotion: null,
        history: []
      }));
    }
  };

  const resetMedia = () => {
    if (state.mediaUrl) {
      URL.revokeObjectURL(state.mediaUrl);
    }
    setState(prev => ({
      ...prev,
      mediaUrl: null,
      mediaType: null,
      currentEmotion: null,
      history: []
    }));
  };

  useEffect(() => {
    if (state.mode === 'Live' && state.autoMode) {
      // PERFORMANCE: Faster 2.5s interval for a more "real-time" feel
      autoModeTimer.current = window.setInterval(() => {
        if (!state.isAnalyzing) {
          triggerLiveCapture();
        }
      }, 2500);
    } else if (autoModeTimer.current) {
      clearInterval(autoModeTimer.current);
    }
    return () => {
      if (autoModeTimer.current) clearInterval(autoModeTimer.current);
    };
  }, [state.autoMode, state.isAnalyzing, state.mode]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 font-sans selection:bg-blue-500 selection:text-white text-slate-100">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                <i className="fa-solid fa-brain text-white text-xl"></i>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter">
                SENTIENT Internflow's <span className="text-blue-500">AI</span>
              </h1>
            </div>
            <p className="text-slate-400 font-medium">Affective Intelligence & Recognition Suite</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex gap-1 mr-2">
              <button 
                onClick={() => setState(prev => ({ ...prev, mode: 'Live' }))}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${state.mode === 'Live' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="fa-solid fa-video mr-1.5"></i> Live
              </button>
              <button 
                onClick={() => setState(prev => ({ ...prev, mode: 'Media' }))}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${state.mode === 'Media' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="fa-solid fa-file-video mr-1.5"></i> Media
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*" 
              onChange={handleFileUpload} 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-upload"></i>
              Upload Media
            </button>

            {state.mode === 'Live' && (
              <>
                <button 
                  onClick={() => setState(prev => ({ ...prev, autoMode: !prev.autoMode }))}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                    state.autoMode 
                      ? 'bg-blue-600 border-blue-400 text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${state.autoMode ? 'fa-stop' : 'fa-play'}`}></i>
                  {state.autoMode ? 'Stop Auto' : 'Auto-Scan'}
                </button>
                
                <button 
                  disabled={state.isAnalyzing}
                  onClick={triggerLiveCapture}
                  className="flex-1 md:flex-none px-8 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-950 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"
                >
                  {state.isAnalyzing ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-camera"></i>}
                  Capture
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <span className={`w-1.5 h-1.5 rounded-full ${state.mode === 'Live' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                   {state.mode === 'Live' ? 'Real-Time Neural Feed' : 'Media Asset Processing'}
                </h3>
             </div>

             {state.mode === 'Live' ? (
               <CameraView onCapture={handleCapture} isActive={true} />
             ) : state.mediaUrl ? (
               <MediaAnalyzer 
                 url={state.mediaUrl} 
                 type={state.mediaType!} 
                 onCapture={handleCapture}
                 onReset={resetMedia}
                 isAnalyzing={state.isAnalyzing}
                 currentEmotion={state.currentEmotion}
               />
             ) : (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="w-full aspect-video bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-900/80 transition-all group"
               >
                 <div className="w-16 h-16 bg-slate-800 group-hover:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-slate-300 transition-all">
                    <i className="fa-solid fa-clapperboard text-3xl"></i>
                 </div>
                 <div className="text-center">
                    <p className="text-slate-300 font-bold text-lg">Upload Video or Image</p>
                    <p className="text-slate-500 text-sm">Drag and drop files to start recognition</p>
                 </div>
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
               <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-2">Confidence Level</span>
               <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-400">
                    {state.currentEmotion ? (state.currentEmotion.confidence * 100).toFixed(0) : '0'}%
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold uppercase">Accuracy Score</span>
               </div>
             </div>
             <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
               <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-2">Recognition Accuracy</span>
               <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${state.currentEmotion?.faceDetected ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {state.currentEmotion?.faceRecognitionScore ? (state.currentEmotion.faceRecognitionScore * 100).toFixed(0) + '%' : 'IDLE'}
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold uppercase">Match Certainty</span>
               </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-6">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                 Affective Analytics
              </h3>
           </div>
           <EmotionDashboard current={state.currentEmotion} history={state.history} />
           
           {state.error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-shake">
                 <i className="fa-solid fa-triangle-exclamation text-red-500 mt-1"></i>
                 <div className="text-xs">
                    <p className="font-bold text-red-500 uppercase mb-1">Processing Fault</p>
                    <p className="text-red-400 leading-relaxed">{state.error}</p>
                 </div>
              </div>
            )}
        </div>
      </main>

      <style>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(200%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
      `}</style>
    </div>
  );
};

export default App;
