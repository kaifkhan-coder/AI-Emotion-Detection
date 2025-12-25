
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

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface EmotionData {
  primaryEmotion: EmotionType;
  confidence: number;
  secondaryEmotions: { emotion: EmotionType; intensity: number }[];
  description: string;
  timestamp: number;
  faceDetected: boolean;
  boundingBox?: BoundingBox;
  faceRecognitionScore?: number; // Added for face recognition accuracy
}

export type AppMode = 'Live' | 'Media';

export interface AppState {
  mode: AppMode;
  isAnalyzing: boolean;
  history: EmotionData[];
  currentEmotion: EmotionData | null;
  error: string | null;
  autoMode: boolean;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
}
