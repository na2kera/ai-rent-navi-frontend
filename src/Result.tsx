import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postRentPrediction } from "./api";
import type { ProcessedRentPredictionResponse } from "./api";
import "./App.css"; // App.css をインポート

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  // Home.tsxから渡される全ての値を適切に受け取るように更新
  // location.state が undefined の場合を考慮し、デフォルト値を空オブジェクトに設定
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

  // ローディング中の表示
  if (isLoading)
    return (
      <div className="form-container result-container">
        <p>AIが査定中です...</p>
      </div>
    );

  // エラー発生時の表示
  if (isError) {
    let errorMessage = "不明なエラーが発生しました。";
    if (error?.message) {
      if (error.message.includes("422")) {
        // 422エラーは通常、入力データのバリデーション失敗を意味します
        errorMessage = "入力データに問題があります。もう一度入力内容を確認してください。";
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
  const isReasonable = data.is_reasonable; // important-message の色判定に使用
  const message = data.message;
  // const reasonableRange = data.reasonable_range; // 現在は使用されていません

  // 間取りの数値から文字列へのマッピング
  const layoutMap: { [key: number]: string } = {
    1: "1K", 2: "1DK", 3: "1LDK", 4: "2K", 5: "2DK", 6: "2LDK",
    7: "3K", 8: "3DK", 9: "3LDK", 10: "4K", 11: "4DK", 12: "4LDK以上",
  };
  const displayLayout = layoutMap[parseInt(layout)] || layout;

  // 構造の数値から文字列へのマッピング
  const structureMap: { [key: number]: string } = {
    1: "木造", 2: "S造 (鉄骨造)", 3: "RC造 (鉄筋コンクリート造)",
    4: "SRC造 (鉄骨鉄筋コンクリート造)", 5: "その他",
  };
  const displayStructure = structureMap[parseInt(structure)] || structure;

  return (
    <div className="form-container result-container">
      {/* 料金が適切かどうかを示す一番目立つメッセージ */}
      {/* isReasonable が true の場合も赤文字にするため、ok クラスを付与し、App.css で色を調整 */}
      <h2
        className={`important-message ${isReasonable ? "ok" : "ng"}`}
        style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}
      >
        {message}
      </h2>

      {/* 簡潔な結果表示 */}
      <p>
        だいたいの予測家賃: <span className="currency">¥</span>
        <span className="value">{Math.round(predictedRent).toLocaleString()}</span>
      </p>
      <p>
        予測との差額: <span className="currency">¥</span>
        <span className="value">{Math.round(Math.abs(difference)).toLocaleString()}</span>{" "}
        （{difference > 0 ? "予測より高い" : "予測より安い"}）
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
        <div className="detail-section"> {/* detail-section クラスを適用 */}
          <hr className="result-divider" /> {/* 区切り線 */}
          <h3>入力情報の詳細</h3> {/* 詳細情報のタイトル */}
          <p>
            <strong>郵便番号:</strong> <span className="value">{postal_code || "N/A"}</span>
          </p>
          <p>
            <strong>住所:</strong> <span className="value">{address || "N/A"}</span>
          </p>
          <p>
            <strong>最寄り駅:</strong> <span className="value">{nearest_station || "N/A"}</span>
          </p>
          <p>
            <strong>最寄駅からの分数:</strong> <span className="value">{distance_from_station || "N/A"}</span> 分
          </p>
          <p>
            <strong>面積:</strong> <span className="value">{area || "N/A"}</span> ㎡
          </p>
          <p>
            <strong>築年数:</strong> <span className="value">{age || "N/A"}</span> 年
          </p>
          <p>
            <strong>構造:</strong> <span className="value">{displayStructure || "N/A"}</span>
          </p>
          <p>
            <strong>間取り:</strong> <span className="value">{displayLayout || "N/A"}</span>
          </p>
          <p>
            <strong>現在の家賃:</strong> <span className="currency">¥</span>
            <span className="value">{(parseFloat(rent) || 0).toLocaleString()}</span>
          </p>

          {/* 各種オプション情報の表示 (値が存在する場合のみ) */}
          {management_fee && (
            <p>
              <strong>管理費:</strong> <span className="currency">¥</span>
              <span className="value">{(parseFloat(management_fee) || 0).toLocaleString()}</span>
            </p>
          )}
          {total_units && (
            <p>
              <strong>総戸数:</strong> <span className="value">{total_units}</span> 戸
            </p>
          )}
          {parking_spaces && ( // 追加: 駐車場数
            <p>
              <strong>駐車場数:</strong> <span className="value">{parking_spaces}</span>
            </p>
          )}
          {deposit && ( // 追加: 敷金
            <p>
              <strong>敷金:</strong> <span className="currency">¥</span>
              <span className="value">{(parseFloat(deposit) || 0).toLocaleString()}</span>
            </p>
          )}
          {key_money && ( // 追加: 礼金
            <p>
              <strong>礼金:</strong> <span className="currency">¥</span>
              <span className="value">{(parseFloat(key_money) || 0).toLocaleString()}</span>
            </p>
          )}
          {conditions && ( // 追加: 条件
            <p>
              <strong>条件:</strong> <span className="value">{conditions}</span>
            </p>
          )}
        </div>
      )}

      {/* 「再判定する」ボタンは画面下部に固定 */}
      <button onClick={() => navigate("/")} className="submit-button">
        再判定する
      </button>
    </div>
  );
}

export default Result;
