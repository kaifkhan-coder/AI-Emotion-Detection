
export type EmotionType = 
  | 'Happy' 
  | 'Sad' 
  | 'Angry' 
  | 'Surprised' 
  | 'Fearful' 
  | 'Disgusted' 
  | 'Neutral' 
  | 'Contemptuous' 
  | 'Confused';

export interface EmotionData {
  primaryEmotion: EmotionType;
  confidence: number;
  secondaryEmotions: { emotion: EmotionType; intensity: number }[];
  description: string;
  timestamp: number;
}

export interface AppState {
  isAnalyzing: boolean;
  history: EmotionData[];
  currentEmotion: EmotionData | null;
  error: string | null;
  autoMode: boolean;
}
