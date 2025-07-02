// 履歴データの型定義
export interface PropertyInput {
  postal_code: string;
  address: string;
  nearest_station: string;
  distance_from_station: number;
  area: number;
  age: number;
  structure: number;
  layout: number;
  rent: number;
  management_fee?: number;
  total_units?: number;
}

export interface PredictionResult {
  predicted_rent: number;
  difference: number;
  is_reasonable: boolean;
  message: string;
  price_evaluation: number; // 価格評価を追加
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  input: PropertyInput;
  result: PredictionResult;
}