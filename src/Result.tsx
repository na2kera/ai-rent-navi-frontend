// Result.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postRentPrediction } from "./api"; // api.tsがsrcディレクトリ直下にある場合
import type { ProcessedRentPredictionResponse } from "./api";
import "./App.css";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();

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
  } = location.state || {};

  // postRentPredictionに渡すためのデータオブジェクトを生成
  // api.tsのpostRentPredictionが期待する形式に合わせる
  const inputForPrediction = {
    area: parseFloat(area) || 0,
    age: parseInt(age) || 0,
    layout: parseInt(layout) || 0,
    distance_from_station: parseFloat(distance_from_station) || 0,
    rent: parseFloat(rent) || 0, // 円単位でそのまま渡す
  };

  const { data, isLoading, isError, error } = useQuery<
    ProcessedRentPredictionResponse,
    Error
  >({
    queryKey: ["rentPrediction", inputForPrediction],
    queryFn: () => postRentPrediction(inputForPrediction),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container result-container">
        <p>AIが査定中です...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container result-container">
        <p>エラーが発生しました: {error?.message || "不明なエラー"}</p>
        <button onClick={() => navigate("/")} className="button">
          もう一度試す
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container result-container">
        <p>査定データが見つかりませんでした。</p>
        <button onClick={() => navigate("/")} className="button">
          ホームに戻る
        </button>
      </div>
    );
  }

  const predictedRent = data.predicted_rent;
  const difference = data.difference;
  const isReasonable = data.is_reasonable;
  const message = data.message;
  const reasonableRange = data.reasonable_range;

  const layoutMap: { [key: number]: string } = {
    1: "1K",
    2: "1DK",
    3: "1LDK",
    4: "2K",
    5: "2DK",
    6: "2LDK",
    7: "3K",
    8: "3DK",
    9: "3LDK",
    10: "4K",
    11: "4DK",
    12: "4LDK以上",
  };
  const displayLayout = layoutMap[parseInt(layout)] || layout;

  const structureMap: { [key: number]: string } = {
    1: "木造",
    2: "S造 (鉄骨造)",
    3: "RC造 (鉄筋コンクリート造)",
    4: "SRC造 (鉄骨鉄筋コンクリート造)",
    5: "その他",
  };
  const displayStructure = structureMap[parseInt(structure)] || structure;

  return (
    <div className="form-container result-container">
      <h2>判定結果</h2>
      <p>
        住所: <span className="value">{address}</span>
      </p>
      <p>
        構造: <span className="value">{displayStructure}</span>
      </p>
      <p>
        最寄り駅: <span className="value">{nearest_station}</span>
      </p>
      <p>
        最寄駅からの分数: <span className="value">{distance_from_station}</span>{" "}
        分
      </p>
      <p>
        面積: <span className="value">{area}</span> ㎡
      </p>
      <p>
        間取り: <span className="value">{displayLayout}</span>
      </p>
      <p>
        築年数: <span className="value">{age}</span> 年
      </p>
      <p>
        現在の家賃: <span className="currency">¥</span>
        <span className="value">{parseFloat(rent).toLocaleString()}</span>
      </p>

      {parking_spaces !== undefined && parking_spaces !== "" && (
        <p>
          駐車場数: <span className="value">{parking_spaces}</span>
        </p>
      )}
      {deposit !== undefined && deposit !== "" && (
        <p>
          敷金: <span className="currency">¥</span>
          <span className="value">{parseFloat(deposit).toLocaleString()}</span>
        </p>
      )}
      {key_money !== undefined && key_money !== "" && (
        <p>
          礼金: <span className="currency">¥</span>
          <span className="value">
            {parseFloat(key_money).toLocaleString()}
          </span>
        </p>
      )}
      {management_fee !== undefined && management_fee !== "" && (
        <p>
          管理費: <span className="currency">¥</span>
          <span className="value">
            {parseFloat(management_fee).toLocaleString()}
          </span>
        </p>
      )}
      {total_units !== undefined && total_units !== "" && (
        <p>
          総戸数: <span className="value">{total_units}</span> 戸
        </p>
      )}
      {conditions !== undefined && conditions !== "" && (
        <p>
          条件: <span className="value">{conditions}</span>
        </p>
      )}

      <hr className="result-divider" />

      {predictedRent !== undefined && (
        <>
          <p>
            **予測家賃:** <span className="currency">¥</span>
            <span className="value">
              {Math.round(predictedRent).toLocaleString()}
            </span>
          </p>
          <p>
            適正価格帯: <span className="currency">¥</span>
            <span className="value">
              {Math.round(reasonableRange.min).toLocaleString()}
            </span>{" "}
            〜 <span className="currency">¥</span>
            <span className="value">
              {Math.round(reasonableRange.max).toLocaleString()}
            </span>
          </p>
          <p>
            予測との差額: <span className="currency">¥</span>
            <span className="value">
              {Math.round(Math.abs(difference)).toLocaleString()}
            </span>{" "}
            （{difference > 0 ? "予測より高い" : "予測より安い"}）
          </p>
          <p className={`important-message ${isReasonable ? "ok" : "ng"}`}>
            {message}
          </p>
        </>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => navigate("/")} className="submit-button">
          再判定する
        </button>
      </div>
    </div>
  );
}

export default Result;
