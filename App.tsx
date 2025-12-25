
import React, { useState, useCallback, useEffect, useRef } from 'react';
import CameraView from './components/CameraView';
import EmotionDashboard from './components/EmotionDashboard';
import { analyzeEmotion } from './services/geminiService';
import { AppState, EmotionData } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isAnalyzing: false,
    history: [],
    currentEmotion: null,
    error: null,
    autoMode: false
  });

  const cameraRef = useRef<{ capture: () => void }>(null);
  const autoModeTimer = useRef<number | null>(null);

  const handleCapture = useCallback(async (base64: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      const result = await analyzeEmotion(base64);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        currentEmotion: result,
        history: [...prev.history, result].slice(-50) // Keep last 50 for performance
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: err.message,
        autoMode: false // Stop auto mode on error
      }));
    }
  }, []);

  // Use a proxy component to trigger capture since CameraView internalizes refs
  const triggerCapture = () => {
    // Find the invisible capture button or use a direct trigger mechanism
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

  useEffect(() => {
    if (state.autoMode) {
      autoModeTimer.current = window.setInterval(() => {
        if (!state.isAnalyzing) {
          triggerCapture();
        }
      }, 5000); // Analyze every 5 seconds in auto mode
    } else if (autoModeTimer.current) {
      clearInterval(autoModeTimer.current);
    }
    return () => {
      if (autoModeTimer.current) clearInterval(autoModeTimer.current);
    };
  }, [state.autoMode, state.isAnalyzing]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-brain text-white text-xl"></i>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">
              SENTIENT<span className="text-blue-500">AI</span>
            </h1>
          </div>
          <p className="text-slate-400 font-medium">Facial Affective Computing System v3.0</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setState(prev => ({ ...prev, autoMode: !prev.autoMode }))}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
              state.autoMode 
                ? 'bg-blue-600 border-blue-400 text-white' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <i className={`fa-solid ${state.autoMode ? 'fa-stop' : 'fa-play'}`}></i>
            {state.autoMode ? 'Stop Auto-Scan' : 'Start Auto-Scan'}
          </button>
          
          <button 
            disabled={state.isAnalyzing}
            onClick={triggerCapture}
            className="flex-1 md:flex-none px-8 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-950 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {state.isAnalyzing ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin"></i>
                Analyzing...
              </>
            ) : (
              <>
                <i className="fa-solid fa-camera"></i>
                Capture Frame
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Vision Feed */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                   Visual Input Stream
                </h3>
             </div>
             <CameraView onCapture={handleCapture} isActive={true} />
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">System Status</h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Processing Engine</span>
                  <span className="text-blue-400 font-mono">Gemini-3-Flash</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Samples</span>
                  <span className="text-slate-200 font-mono">{state.history.length}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Session Latency</span>
                  <span className="text-slate-200 font-mono">~1.2s</span>
               </div>
            </div>
            
            {state.error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                 <i className="fa-solid fa-triangle-exclamation text-red-500 mt-1"></i>
                 <div className="text-xs">
                    <p className="font-bold text-red-500 uppercase mb-1">Detection Error</p>
                    <p className="text-red-400 leading-relaxed">{state.error}</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Analytics Dashboard */}
        <div className="lg:col-span-7">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                 Affective Analytics
              </h3>
              {state.history.length > 0 && (
                <button 
                  onClick={() => setState(prev => ({ ...prev, history: [], currentEmotion: null }))}
                  className="text-[10px] text-slate-500 hover:text-red-400 uppercase font-bold tracking-tighter"
                >
                  Clear History
                </button>
              )}
           </div>
           <EmotionDashboard current={state.currentEmotion} history={state.history} />
        </div>
      </main>

      {/* Footer / Info */}
      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-900 text-center">
         <p className="text-slate-600 text-xs font-medium">
            Proprietary Emotional Intelligence Engine. For demonstration purposes only.
         </p>
      </footer>

      {/* Style overrides for specific animations */}
      <style>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(200%); }
        }
      `}</style>
    </div>
  );
};

export default App;
