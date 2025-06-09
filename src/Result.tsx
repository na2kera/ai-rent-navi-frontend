import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postRentPrediction } from './api';
import type { RentPredictionRequest, RentPredictionResponse } from './api';
import './App.css';

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { area, age, distance, rent } = location.state || {};

  const input: RentPredictionRequest = {
    area: parseFloat(area) || 0,
    age: parseInt(age) || 0,
    distance: parseFloat(distance) || 0,
    rent: parseFloat(rent) || 0,
  };

  const { data, isLoading, error } = useQuery<RentPredictionResponse, Error>({
    queryKey: ['rentPrediction', input],
    queryFn: () => postRentPrediction(input),
    retry: false, 
  });

    if (isLoading) {
    return <div className="form-container">評価中...</div>;
  }

  if (error) {
    return <div className="form-container">エラーが発生しました: {error.message}</div>;
  }

  const predictedRent = data?.predicted_rent;
  const difference = data?.difference;
  const isReasonable = data?.is_reasonable;
  const message = data?.message;

  return (
    <div className="form-container">
      <h2>家賃評価結果</h2>
      <p>面積: {input.area} ㎡</p>
      <p>築年数: {input.age} 年</p>
      <p>最寄駅までの距離: {input.distance} 分</p>
      <p>現在の家賃: ¥{input.rent.toLocaleString()}</p>

      <hr style={{ margin: '1rem 0' }} />

      {predictedRent && (
        <p>
          **予測家賃:** ¥{Math.round(predictedRent).toLocaleString()}
        </p>
      )}
      {difference && (
        <p>
          **現在の家賃との差額:** ¥{Math.round(difference).toLocaleString()}
        </p>
      )}
      {typeof isReasonable === 'boolean' && (
        <p>
          **相場に対して適正:** {isReasonable ? 'はい' : 'いいえ'}
        </p>
      )}
      {message && (
        <p style={{ fontWeight: 'bold', fontSize: '1.2em', color: isReasonable ? 'green' : 'red' }}>
          {message}
        </p>
      )}

      <button onClick={() => navigate('/')}>戻る</button>
    </div>
  );
}

export default Result;