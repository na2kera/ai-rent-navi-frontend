import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postRentPrediction } from './api';
import type { RentPredictionRequest, ProcessedRentPredictionResponse } from './api';
import './App.css';

function Result() {
  const location = useLocation();
  const navigate = useNavigate();

  // location.stateからすべての項目を取得
  const {
    address,
    structure,
    nearest_station,
    distance_from_station,
    area,
    layout,
    age,
    rent,
    parking_spaces,
    deposit,
    key_money,
    management_fee,
    total_units,
    conditions,
  } = location.state || {}; // デフォルト値を空オブジェクトにすることで、undefinedを許容

  const input: RentPredictionRequest = {
    address: address || '', // undefinedの場合は空文字列
    structure: parseInt(structure) || 0, // undefinedの場合は0、バックエンドで適切に処理
    nearest_station: nearest_station || '',
    distance_from_station: parseFloat(distance_from_station) || 0,
    area: parseFloat(area) || 0,
    layout: parseInt(layout) || 0,
    age: parseInt(age) || 0,
    rent: parseFloat(rent) || 0,

    // オプション項目はundefinedをそのまま渡す
    parking_spaces: parking_spaces === undefined ? undefined : parseInt(parking_spaces),
    deposit: deposit === undefined ? undefined : parseFloat(deposit),
    key_money: key_money === undefined ? undefined : parseFloat(key_money),
    management_fee: management_fee === undefined ? undefined : parseFloat(management_fee),
    total_units: total_units === undefined ? undefined : parseInt(total_units),
    conditions: conditions === undefined ? undefined : conditions,
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
        <div style={{ textAlign: 'center' }}>
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

  // 表示用のマッピング
  const layoutMap: { [key: number]: string } = {
    1: '1K', 2: '1DK', 3: '1LDK',
    4: '2K', 5: '2DK', 6: '2LDK',
    7: '3K', 8: '3DK', 9: '3LDK',
    10: '4K', 11: '4DK', 12: '4LDK以上'
  };
  const displayLayout = layoutMap[parseInt(layout)] || layout;

  const structureMap: { [key: number]: string } = {
    1: '木造', 2: 'S造 (鉄骨造)', 3: 'RC造 (鉄筋コンクリート造)', 4: 'SRC造 (鉄骨鉄筋コンクリート造)', 5: 'その他'
  };
  const displayStructure = structureMap[parseInt(structure)] || structure;

  return (
    <div className="form-container result-container">
      <h2>判定結果</h2>
      {/* 必須項目 */}
      <p>住所: <span className="value">{address}</span></p>
      <p>構造: <span className="value">{displayStructure}</span></p>
      <p>最寄り駅: <span className="value">{nearest_station}</span></p>
      <p>最寄駅からの分数: <span className="value">{distance_from_station}</span> 分</p>
      <p>面積: <span className="value">{area}</span> ㎡</p>
      <p>間取り: <span className="value">{displayLayout}</span></p>
      <p>築年数: <span className="value">{age}</span> 年</p>
      <p>現在の家賃: <span className="currency">¥</span><span className="value">{parseFloat(rent).toLocaleString()}</span></p>

      {/* オプション項目 (入力がある場合のみ表示) */}
      {parking_spaces !== undefined && <p>駐車場数: <span className="value">{parking_spaces}</span></p>}
      {deposit !== undefined && <p>敷金: <span className="currency">¥</span><span className="value">{parseFloat(deposit).toLocaleString()}</span></p>}
      {key_money !== undefined && <p>礼金: <span className="currency">¥</span><span className="value">{parseFloat(key_money).toLocaleString()}</span></p>}
      {management_fee !== undefined && <p>管理費: <span className="currency">¥</span><span className="value">{parseFloat(management_fee).toLocaleString()}</span></p>}
      {total_units !== undefined && <p>総戸数: <span className="value">{total_units}</span> 戸</p>}
      {conditions !== undefined && <p>条件: <span className="value">{conditions}</span></p>}


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

      <div style={{ textAlign: 'center' }}>
        <button onClick={() => navigate('/')} className="submit-button">戻る</button>
      </div>
    </div>
  );
}

export default Result;