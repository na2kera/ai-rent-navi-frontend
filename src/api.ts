// frontend/api.ts
import axios from 'axios';

export interface RentPredictionRequest {
  // 必須項目
  address: string; // 新規: 住所
  structure: number; // 新規: 構造 (例: 1=木造, 2=RCなど数値でマッピング)
  nearest_station: string; // 新規: 最寄り駅
  distance_from_station: number; // 新規: 最寄駅からの分数 (以前のdistanceと似ていますが、明確化)
  area: number; // 既存: 面積
  layout: number; // 既存: 間取り

  age: number; // 既存: 築年数
  rent: number; // 既存: 家賃価格

  // オプション項目 (undefinedを許容)
  parking_spaces?: number; // 新規: 駐車場数
  deposit?: number; // 新規: 敷金 (単位は rent と合わせるか、別途定義)
  key_money?: number; // 新規: 礼金 (単位は rent と合わせるか、別途定義)
  management_fee?: number; // 新規: 管理費
  total_units?: number; // 新規: 総戸数
  conditions?: string; // 新規: 条件 (テキスト入力)
}

export interface RentPredictionResponseFromBackend {
  input_conditions: RentPredictionRequest;
  predicted_rent: number;
  reasonable_range: {
    min: number;
    max: number;
  };
  price_evaluation: number;
}

export interface ProcessedRentPredictionResponse {
  input_conditions: RentPredictionRequest;
  predicted_rent: number;
  reasonable_range: {
    min: number;
    max: number;
  };
  price_evaluation: number;

  difference: number;
  is_reasonable: boolean;
  message: string;
}

export const postRentPrediction = async (
  data: RentPredictionRequest
): Promise<ProcessedRentPredictionResponse> => {
  const response = await axios.post<RentPredictionResponseFromBackend>(
    'http://localhost:8000/api/v1/predict',
    data
  );

  const backendData = response.data;

  const difference = data.rent - backendData.predicted_rent;
  const isReasonable = data.rent >= backendData.reasonable_range.min && data.rent <= backendData.reasonable_range.max;

  let message = '';
  switch (backendData.price_evaluation) {
    case 1: message = '現在の家賃は相場よりもかなり割安'; break;
    case 2: message = '現在の家賃は相場よりも少し安い'; break;
    case 3: message = '現在の家賃は相場通り'; break;
    case 4: message = '現在の家賃は相場よりも少し高い'; break;
    case 5: message = '現在の家賃は相場よりもかなり割高'; break;
    default: message = '価格評価ができません'; break;
  }

  return {
    input_conditions: backendData.input_conditions,
    predicted_rent: backendData.predicted_rent,
    reasonable_range: backendData.reasonable_range,
    price_evaluation: backendData.price_evaluation,
    difference: difference,
    is_reasonable: isReasonable,
    message: message,
  };
};