// frontend/api.ts

import axios from 'axios'; // axiosのインスタンスが適切に設定されていることを確認してください

// バックエンドのRentPredictionRequestに完全に合わせます
export interface RentPredictionRequest {
  area: number;
  age: number;
  layout: number;
  station_person: number;
  rent: number; // 万円単位で送信されることを想定
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
  predicted_rent: number; // 円単位
  reasonable_range: {
    min: number; // 円単位
    max: number; // 円単位
  };
  price_evaluation: number;

  difference: number; // 円単位
  is_reasonable: boolean;
  message: string;
}

export const postRentPrediction = async (
  data: {
    area: number;
    age: number;
    layout: number;
    distance_from_station: number; // この値はここでは使用しない（ダミー値を使用するため）
    rent: number; // 円単位で受け取る
  }
): Promise<ProcessedRentPredictionResponse> => {
  // バックエンドのAPIが期待する形式にペイロードを変換
  // FastAPIのスキーマが期待する全てのフィールドを送信
  const payload: RentPredictionRequest = {
    area: data.area,
    age: data.age,
    layout: data.layout, // InputFormから受け取ったlayoutをそのまま送信
    station_person: 50, // ダミー値で送信
    rent: Math.max(1, data.rent / 10000), // 円を万円に変換して送信。最低1万円を保証
  };

  // ★★★ この部分が最重要修正点です！ ★★★
  // ここでpayloadオブジェクト全体を送信することで、FastAPIのバリデーションを通過させます。
  const response = await axios.post<RentPredictionResponseFromBackend>(
    'http://localhost:8000/api/v1/predict', // バックエンドのURL
    payload // ★★★ payloadオブジェクト全体を送信する！ ★★★
  );

  const backendData = response.data;

  // バックエンドからのpredicted_rentとreasonable_rangeは万円単位なので、フロントエンド表示用に円に戻す
  const predictedRentYen = backendData.predicted_rent * 10000;
  const reasonableMinYen = backendData.reasonable_range.min * 10000;
  const reasonableMaxYen = backendData.reasonable_range.max * 10000;

  // 入力された家賃（円）と予測家賃（円）の差分
  const difference = data.rent - predictedRentYen;
  const isReasonable = data.rent >= reasonableMinYen && data.rent <= reasonableMaxYen;

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
    input_conditions: backendData.input_conditions, // バックエンドが解釈した条件をそのまま返す
    predicted_rent: predictedRentYen,
    reasonable_range: {
      min: reasonableMinYen,
      max: reasonableMaxYen,
    },
    price_evaluation: backendData.price_evaluation,
    difference: difference,
    is_reasonable: isReasonable,
    message: message,
  };
};