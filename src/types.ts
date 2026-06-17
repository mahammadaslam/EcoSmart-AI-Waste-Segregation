export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  google_id?: string | null;
  profile_image?: string | null;
  created_at: string;
}

export interface Scan {
  id: number;
  user_id: number;
  image_url: string;
  category: string;
  confidence: number;
  recommendation: string;
  disposal_method?: string;
  recycling_method?: string;
  environmental_impact?: string;
  created_at: string;
  detected_object?: string;
  classification_reason?: string;
  // Admin expansion mapping
  username?: string;
  userEmail?: string;
}

export interface ChatHistory {
  id: number;
  user_id: number;
  question: string;
  answer: string;
  created_at: string;
}

export interface DashboardStats {
  totalScans: number;
  plasticCount: number;
  paperCount: number;
  metalCount: number;
  organicCount: number;
  eWasteCount: number;
  glassCount: number;
  otherCount: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface CategoryDist {
  name: string;
  value: number;
}
