import axios from 'axios';

export interface RentPredictionRequest {
  area: number;
  age: number;
  distance: number;
  rent: number;
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