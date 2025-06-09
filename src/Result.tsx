import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postRentPrediction } from './api';
import type { RentPredictionRequest, ProcessedRentPredictionResponse } from './api';
import './App.css';

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { area, age, distance, rent } = location.state || { area: '', age: '', distance: '', rent: '' };

  const input: RentPredictionRequest = {
    area: parseFloat(area) || 0,
    age: parseInt(age) || 0,
    distance: parseFloat(distance) || 0,
    rent: parseFloat(rent) || 0,
  };

  const { data, isLoading, error } = useQuery<ProcessedRentPredictionResponse, Error>({
    queryKey: ['rentPrediction', input],
    queryFn: () => postRentPrediction(input),
    retry: false,
  });

  if (isLoading) {
    return <div className="form-container result-container"><h2>評価中...</h2></div>;
  }

  if (error) {
    return (
      <div className="form-container result-container">
        <h2>エラーが発生しました</h2>
        <p>{error.message}</p>
        <div style={{ textAlign: 'center' }}> {/* ボタンを中央揃えにするためのdivを追加 */}
          <button onClick={() => navigate('/')} className="submit-button">戻る</button>
        </div>
      </div>
    );
  }

  const predictedRent = data.predicted_rent;
  const difference = data.difference;
  const isReasonable = data.is_reasonable;
  const message = data.message;
  const reasonableRange = data.reasonable_range;

  return (
    <div className="form-container result-container">
      <h2>判定結果</h2> {/* タイトルを変更 */}
      <p>面積: <span className="value">{area}</span> ㎡</p>
      <p>築年数: <span className="value">{age}</span> 年</p>
      <p>最寄駅までの距離: <span className="value">{distance}</span> 分</p>
      <p>現在の家賃: <span className="currency">¥</span><span className="value">{parseFloat(rent).toLocaleString()}</span></p>

      <hr className="result-divider" />

      {predictedRent !== undefined && (
        <p>
          **予測家賃:** <span className="currency">¥</span><span className="value">{Math.round(predictedRent).toLocaleString()}</span>
        </p>
      )}
      {reasonableRange && (
        <p>
          **適正家賃範囲:** <span className="currency">¥</span><span className="value">{Math.round(reasonableRange.min).toLocaleString()}</span> ～ <span className="currency">¥</span><span className="value">{Math.round(reasonableRange.max).toLocaleString()}</span>
        </p>
      )}
      {difference !== undefined && (
        <p>
          **現在の家賃との差額:** <span className="currency">¥</span><span className="value">{Math.round(difference).toLocaleString()}</span>
        </p>
      )}
      {typeof isReasonable === 'boolean' && (
        <p>
          **相場に対して適正:** <span className={isReasonable ? 'ok' : 'ng'}>{isReasonable ? 'はい' : 'いいえ'}</span>
        </p>
      )}
      {message && (
        <p className={`important-message ${isReasonable ? 'ok' : 'ng'}`}>
          {message}
        </p>
      )}

      <div style={{ textAlign: 'center' }}> {/* ボタンを中央揃えにするためのdiv */}
        <button onClick={() => navigate('/')} className="submit-button">戻る</button>
      </div>
    </div>
  );
}

export default Result;