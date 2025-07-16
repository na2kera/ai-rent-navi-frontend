import { useState, useEffect } from "react";

import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postRentPrediction } from "./api";
import type { ProcessedRentPredictionResponse } from "./api";
import { saveHistoryItem } from "./historyUtils";
import type { PropertyInput, PredictionResult } from "./types";
import "./App.css"; // App.css をインポート

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const REVERSE_REGION_MAPPING: { [key: string]: string } = {
      "suginami": "杉並区",
      "musashino": "武蔵野市",
      "kitaku": "北区",
      "nakanoku": "中野区",
      "nerimaku": "練馬区",
  };

  const {
    postal_code, // 郵便番号を追加
    address, // 住所を追加
    structure, // 構造を追加
    nearest_station, // 最寄り駅を追加
    distance_from_station, // 最寄駅からの分数
    area, // 面積
    layout, // 間取り
    age, // 築年数
    rent, // 家賃価格
    

    // オプション項目も追加
    parking_spaces,
    deposit,
    key_money,
    management_fee,
    total_units,
    conditions,
    prefecture, // 追加
    city,        // 追加
  } = location.state || {};

  // APIリクエストのための入力データを準備
  // parseFloat や parseInt が失敗した場合に NaN になることを防ぐため、
  // デフォルト値 (|| 0) を指定していますが、APIが NaN を許容しない場合は、
  // ゼロ値が問題になる可能性もあります。その場合は、入力値のバリデーションを強化し、
  // 不正な値の時にAPIリクエスト自体を送らないなどの対策が必要です。
  const inputForPrediction = {
    area: parseFloat(area) || 0,
    age: parseInt(age) || 0,
    layout: parseInt(layout) || 0,
    distance_from_station: parseFloat(distance_from_station) || 0,
    rent: parseFloat(rent) || 0,
    region: city || "",
    // APIに送るデータは予測に必要なものに限定。
    // postal_code, address, nearest_station, structure, parking_spaces, deposit, key_money, management_fee, total_units, conditions
    // はAPI予測には不要で、表示のためにのみ使用される想定。
    // 必要に応じてAPIの引数に追加してください。
  };

  const { data, isLoading, isError, error } = useQuery<
    ProcessedRentPredictionResponse,
    Error
  >({
    queryKey: ["rentPrediction", inputForPrediction],
    queryFn: () => postRentPrediction(inputForPrediction),
    retry: false, // エラー発生時のリトライを無効化
  });

  // データが正常に取得できた場合、履歴に保存
  useEffect(() => {
    if (data && location.state) {
      const historyInput: PropertyInput = {
        postal_code: postal_code || "",
        address: address || "",
        nearest_station: nearest_station || "",
        distance_from_station: parseInt(distance_from_station) || 0,
        area: parseFloat(area) || 0,
        age: parseInt(age) || 0,
        structure: parseInt(structure) || 0,
        layout: parseInt(layout) || 0,
        rent: parseFloat(rent) || 0,
        management_fee: management_fee ? parseFloat(management_fee) : undefined,
        total_units: total_units ? parseInt(total_units) : undefined,
      };

      const historyResult: PredictionResult = {
        predicted_rent: data.predicted_rent,
        difference: data.difference,
        is_reasonable: data.is_reasonable,
        message: data.message,
        price_evaluation: data.price_evaluation, // 評価を履歴に追加
      };

      saveHistoryItem(historyInput, historyResult);
    }
  }, [
    data,
    location.state,
    postal_code,
    address,
    nearest_station,
    distance_from_station,
    area,
    age,
    structure,
    layout,
    rent,
    management_fee,
    total_units,
  ]);

  // ローディング中の表示
  if (isLoading)
    return (
      <div className="form-container result-container">
        <p>AIが査定中です...</p>
      </div>
    );

  // エラー発生時の表示
  // 評価に応じてクラス名を返すヘルパー関数
  const getEvaluationClass = (evaluation: number) => {
    switch (evaluation) {
      case 1:
        return "evaluation-cheaper"; // 割安
      case 2:
        return "evaluation-slightly-cheaper"; // 適正だが安い
      case 3:
        return "evaluation-fair"; // 相場通り
      case 4:
        return "evaluation-slightly-expensive"; // 適正だが高い
      case 5:
        return "evaluation-expensive"; // 割高
      default:
        return "";
    }
  };

  if (isError) {
    let errorMessage = "不明なエラーが発生しました。";
    if (error?.message) {
      if (error.message.includes("422")) {
        // 422エラーは通常、入力データのバリデーション失敗を意味します
        errorMessage =
          "入力データに問題があります。もう一度入力内容を確認してください。";
      } else {
        errorMessage = `エラーが発生しました: ${error.message}`;
      }
    }
    return (
      <div className="form-container result-container">
        {/* エラーメッセージを表示する領域 */}
        <p className="error-message">{errorMessage}</p>
        <button onClick={() => navigate("/")} className="submit-button">
          もう一度試す
        </button>
      </div>
    );
  }

  // データが見つからない場合の表示
  if (!data)
    return (
      <div className="form-container result-container">
        <p>査定データが見つかりませんでした。</p>
        <button onClick={() => navigate("/")} className="submit-button">
          ホームに戻る
        </button>
      </div>
    );

  // 予測結果の変数定義
  const predictedRent = data.predicted_rent;
  const difference = data.difference;
  const message = data.message;
  // const reasonableRange = data.reasonable_range; // 現在は使用されていません

  // 間取りの数値から文字列へのマッピング
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

  // 構造の数値から文字列へのマッピング
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
      {/* 料金が適切かどうかを示す一番目立つメッセージ */}
      {/* isReasonable が true の場合も赤文字にするため、ok クラスを付与し、App.css で色を調整 */}
      <h2
        className={`important-message ${getEvaluationClass(
          data.price_evaluation
        )}`}
        style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}
      >
        {message}
      </h2>

      {/* 簡潔な結果表示 */}
      <p>
        だいたいの予測家賃: <span className="currency">¥</span>
        <span className="value">
          {Math.round(predictedRent).toLocaleString()}
        </span>
      </p>
      <p>
        予測との差額: <span className="currency">¥</span>
        <span className="value">
          {Math.round(Math.abs(difference)).toLocaleString()}
        </span>{" "}
        （
        <span className={difference > 0 ? "price-higher" : "price-lower"}>
          {difference > 0 ? "予測より高い" : "予測より安い"}
        </span>
        ）
      </p>

      {/* 詳細トグルボタン */}
      <button
        className="detail-toggle-button" // App.css でスタイル定義済み
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? "詳細を閉じる" : "詳細を表示"}
      </button>

      {/* 詳細情報（トグル表示） */}
      {showDetails && (
        <div className="detail-section">
          {" "}
          {/* detail-section クラスを適用 */}
          <hr className="result-divider" /> {/* 区切り線 */}
          <h3>入力情報の詳細</h3> {/* 詳細情報のタイトル */}
          <p>
            <strong>住所:</strong>{" "}
            <span className="value">{prefecture || "N/A"}</span>
            <span className="value">{REVERSE_REGION_MAPPING[city] || city || "N/A"}</span>
          </p>
          <p>
            <strong>最寄り駅:</strong>{" "}
            <span className="value">{nearest_station || "N/A"}</span>
          </p>
          <p>
            <strong>最寄駅からの分数:</strong>{" "}
            <span className="value">{distance_from_station || "N/A"}</span> 分
          </p>
          <p>
            <strong>面積:</strong>{" "}
            <span className="value">{area || "N/A"}</span> ㎡
          </p>
          <p>
            <strong>築年数:</strong>{" "}
            <span className="value">{age || "N/A"}</span> 年
          </p>
          <p>
            <strong>構造:</strong>{" "}
            <span className="value">{displayStructure || "N/A"}</span>
          </p>
          <p>
            <strong>間取り:</strong>{" "}
            <span className="value">{displayLayout || "N/A"}</span>
          </p>
          <p>
            <strong>現在の家賃:</strong> <span className="currency">¥</span>
            <span className="value">
              {(parseFloat(rent) || 0).toLocaleString()}
            </span>
          </p>
          {/* 各種オプション情報の表示 (値が存在する場合のみ) */}
          {management_fee && (
            <p>
              <strong>管理費:</strong> <span className="currency">¥</span>
              <span className="value">
                {(parseFloat(management_fee) || 0).toLocaleString()}
              </span>
            </p>
          )}
          {total_units && (
            <p>
              <strong>総戸数:</strong>{" "}
              <span className="value">{total_units}</span> 戸
            </p>
          )}
          {parking_spaces && ( // 追加: 駐車場数
            <p>
              <strong>駐車場数:</strong>{" "}
              <span className="value">{parking_spaces}</span>
            </p>
          )}
          {deposit && ( // 追加: 敷金
            <p>
              <strong>敷金:</strong> <span className="currency">¥</span>
              <span className="value">
                {(parseFloat(deposit) || 0).toLocaleString()}
              </span>
            </p>
          )}
          {key_money && ( // 追加: 礼金
            <p>
              <strong>礼金:</strong> <span className="currency">¥</span>
              <span className="value">
                {(parseFloat(key_money) || 0).toLocaleString()}
              </span>
            </p>
          )}
          {conditions && ( // 追加: 条件
            <p>
              <strong>条件:</strong> <span className="value">{conditions}</span>
            </p>
          )}
        </div>
      )}

      {/* ナビゲーションボタンエリア */}
      <div
        style={{
          textAlign: "center",
          marginTop: "2rem",
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate("/history")}
          className="detail-toggle-button"
          style={{ width: "200px", position: "static", transform: "none" }}
        >
          判定履歴を見る
        </button>

        {/* 「再判定する」ボタンは画面下部に固定 */}
        <button
          onClick={() =>
            navigate("/", {
              state: {
                ...location.state,
                city: REVERSE_REGION_MAPPING[city] || city,
              },
            })
          }
          className="submit-button"
        >
          再判定する
        </button>
      </div>
    </div>
  );
}

export default Result;
