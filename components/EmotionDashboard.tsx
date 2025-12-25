
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts';
import { EmotionData, EmotionType } from '../types';

interface EmotionDashboardProps {
  current: EmotionData | null;
  history: EmotionData[];
}

const emotionColors: Record<string, string> = {
  Happy: '#10b981',
  Sad: '#3b82f6',
  Angry: '#ef4444',
  Surprised: '#f59e0b',
  Fearful: '#8b5cf6',
  Disgusted: '#d946ef',
  Neutral: '#94a3b8',
  Confused: '#ec4899',
  Contemptuous: '#64748b'
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
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
        <i className="fa-solid fa-chart-line text-4xl mb-4"></i>
        <p className="max-w-xs">Analysis results will appear here once you capture a frame or start auto-scan.</p>
      </div>
    );
  }

  const radarData = current.secondaryEmotions.map(e => ({
    subject: e.emotion,
    A: e.intensity * 100,
    fullMark: 100,
  }));

  const historyData = history.slice(-20).map(h => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    confidence: h.confidence * 100,
    emotion: h.primaryEmotion
  }));

  return (
    <div className="space-y-6">
      {/* Current State Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <i className={`fa-solid ${getEmotionIcon(current.primaryEmotion)} text-8xl`}></i>
          </div>
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Primary Detection</span>
          <i className={`fa-solid ${getEmotionIcon(current.primaryEmotion)} text-6xl mb-4`} style={{ color: emotionColors[current.primaryEmotion] }}></i>
          <h2 className="text-3xl font-black text-white">{current.primaryEmotion}</h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-slate-400">Confidence</span>
            <span className="text-lg font-bold" style={{ color: emotionColors[current.primaryEmotion] }}>
              {(current.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">AI Insight</span>
          <p className="text-lg text-slate-200 font-medium leading-relaxed mb-4">
            "{current.description}"
          </p>
          <div className="mt-auto pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
            {current.secondaryEmotions.slice(0, 4).map((e, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-xs text-slate-500 uppercase">{e.emotion}</span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${e.intensity * 100}%`, backgroundColor: emotionColors[e.emotion] || '#fff' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6 block">Emotion Spectrum</span>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Intensity"
                  dataKey="A"
                  stroke={emotionColors[current.primaryEmotion]}
                  fill={emotionColors[current.primaryEmotion]}
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6 block">Confidence History</span>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorConf)" 
                  strokeWidth={2}
                  animationDuration={1500}
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
