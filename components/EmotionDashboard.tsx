
import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts';
import { EmotionData, EmotionType } from '../types';

interface EmotionDashboardProps {
  current: EmotionData | null;
  history: EmotionData[];
}

// Accessible color palette for dark mode (using Tailwind 400/500 shades for visibility)
const emotionColors: Record<string, string> = {
  Happy: '#34d399',      // Emerald 400
  Sad: '#60a5fa',        // Blue 400
  Angry: '#f87171',      // Red 400
  Surprised: '#fbbf24',  // Amber 400
  Fearful: '#a78bfa',    // Violet 400
  Disgusted: '#e879f9',  // Fuchsia 400
  Neutral: '#cbd5e1',    // Slate 300
  Confused: '#f472b6',   // Pink 400
  Contemptuous: '#94a3b8' // Slate 400
};

const getEmotionIcon = (emotion: EmotionType) => {
  switch (emotion) {
    case 'Happy': return 'fa-face-smile';
    case 'Sad': return 'fa-face-sad-tear';
    case 'Angry': return 'fa-face-angry';
    case 'Surprised': return 'fa-face-surprise';
    case 'Fearful': return 'fa-face-frown-open';
    case 'Disgusted': return 'fa-face-grimace';
    case 'Neutral': return 'fa-face-meh';
    case 'Confused': return 'fa-face-rolling-eyes';
    default: return 'fa-face-smile';
  }
};

const EmotionDashboard: React.FC<EmotionDashboardProps> = ({ current, history }) => {
  if (!current) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 transition-all duration-700">
        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
           <i className="fa-solid fa-chart-line text-4xl text-slate-600"></i>
        </div>
        <h4 className="text-slate-200 font-bold mb-2">Awaiting Neural Input</h4>
        <p className="max-w-xs text-sm text-slate-400">Visual patterns must be streamed to activate the emotion analysis engine.</p>
      </div>
    );
  }

  if (current.faceDetected === false) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 rounded-3xl border border-red-500/30 transition-all duration-700 animate-in fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
           <i className="fa-solid fa-user-slash text-4xl text-red-400"></i>
        </div>
        <h4 className="text-red-400 font-bold mb-2 uppercase tracking-widest">Target Not Found</h4>
        <p className="max-w-xs text-sm text-slate-300">
          The scanner was unable to isolate a human face. 
          Please ensure the subject is well-lit and facing the camera directly.
        </p>
      </div>
    );
  }

  const radarData = (current.secondaryEmotions || []).map(e => ({
    subject: e.emotion,
    A: (e.intensity || 0) * 100,
    fullMark: 100,
  }));

  const historyData = history
    .filter(h => h.faceDetected)
    .slice(-30)
    .map(h => ({
      time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      confidence: (h.confidence || 0) * 100,
      emotion: h.primaryEmotion
    }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Primary Result Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-[0.05] transition-transform duration-1000 group-hover:scale-110">
             <i className={`fa-solid ${getEmotionIcon(current.primaryEmotion)} text-[200px]`}></i>
          </div>
          <span className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Dominant Signal</span>
          <div className="relative">
             <i className={`fa-solid ${getEmotionIcon(current.primaryEmotion)} text-7xl mb-4 transition-transform group-hover:scale-105 duration-500`} style={{ color: emotionColors[current.primaryEmotion] }}></i>
             <div className="absolute -inset-6 bg-white/5 rounded-full blur-2xl -z-10 animate-pulse"></div>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">{current.primaryEmotion}</h2>
          <div className="mt-6 px-5 py-2 bg-slate-800/80 rounded-full border border-slate-700 flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confidence</span>
            <span className="text-base font-black" style={{ color: emotionColors[current.primaryEmotion] }}>
              {(current.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col shadow-xl">
          <span className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-6">Cognitive Insight</span>
          <p className="text-xl text-slate-100 font-bold leading-relaxed mb-8">
            "{current.description}"
          </p>
          <div className="mt-auto grid grid-cols-2 gap-x-8 gap-y-5">
            {(current.secondaryEmotions || []).slice(0, 4).map((e, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-300 font-bold uppercase tracking-widest">{e.emotion}</span>
                  <span className="text-[11px] text-slate-100 font-mono font-bold">{(e.intensity * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,255,255,0.1)]" 
                    style={{ width: `${e.intensity * 100}%`, backgroundColor: emotionColors[e.emotion] || '#fff' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visualization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Affective Spectrum</span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-lg border border-blue-500/30 uppercase tracking-tighter">Radar Synthesis</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" strokeOpacity={0.4} />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 700 }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={false} 
                  axisLine={false} 
                />
                <Radar
                  name="Intensity"
                  dataKey="A"
                  stroke={emotionColors[current.primaryEmotion]}
                  strokeWidth={3}
                  fill={emotionColors[current.primaryEmotion]}
                  fillOpacity={0.25}
                  animationDuration={1200}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Neural Stability Trend</span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/30 uppercase tracking-tighter">Real-time Buffer</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  hide={historyData.length > 10} 
                />
                <YAxis hide domain={[0, 105]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    borderRadius: '12px', 
                    fontSize: '11px',
                    color: '#f1f5f9',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#60a5fa" 
                  fillOpacity={1} 
                  fill="url(#colorConf)" 
                  strokeWidth={3}
                  animationDuration={1200}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionDashboard;
