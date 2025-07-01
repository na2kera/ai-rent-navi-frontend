import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, deleteHistoryItem, clearAllHistory, restoreFromHistory } from "./historyUtils";
import type { HistoryItem } from "./types";
import "./App.css";

function History() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const navigate = useNavigate();

  // 履歴の読み込み
  useEffect(() => {
    setHistoryItems(getHistory());
  }, []);

  // 個別履歴項目の削除
  const handleDeleteItem = (id: string) => {
    deleteHistoryItem(id);
    setHistoryItems(getHistory());
    setShowDeleteConfirm(null);
  };

  // 全履歴の削除
  const handleClearAll = () => {
    clearAllHistory();
    setHistoryItems([]);
    setShowClearAllConfirm(false);
  };

  // 履歴から復元して再判定
  const handleRestoreAndRejudge = (item: HistoryItem) => {
    const restoredData = restoreFromHistory(item);
    navigate("/", { state: restoredData });
  };

  // 間取りの数値から文字列へのマッピング
  const layoutMap: { [key: number]: string } = {
    1: "1K", 2: "1DK", 3: "1LDK", 4: "2K", 5: "2DK", 6: "2LDK",
    7: "3K", 8: "3DK", 9: "3LDK", 10: "4K", 11: "4DK", 12: "4LDK以上",
  };

  // 構造の数値から文字列へのマッピング
  const structureMap: { [key: number]: string } = {
    1: "木造", 2: "S造", 3: "RC造", 4: "SRC造", 5: "その他",
  };

  // 日時フォーマット
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="form-container">
      <h1>判定履歴</h1>
      
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => navigate("/")} className="submit-button" style={{ marginRight: "10px" }}>
          ホームに戻る
        </button>
        
        {historyItems.length > 0 && (
          <button 
            onClick={() => setShowClearAllConfirm(true)} 
            className="submit-button"
            style={{ backgroundColor: "#dc3545" }}
          >
            全履歴削除
          </button>
        )}
      </div>

      {historyItems.length === 0 ? (
        <p>まだ履歴はありません。</p>
      ) : (
        <div className="history-list">
          {historyItems.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-header">
                <span className="history-date">{formatDateTime(item.timestamp)}</span>
                <div className="history-actions">
                  <button 
                    onClick={() => handleRestoreAndRejudge(item)}
                    className="detail-toggle-button"
                    style={{ marginRight: "10px" }}
                  >
                    復元して再判定
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(item.id)}
                    className="detail-toggle-button"
                    style={{ backgroundColor: "#dc3545" }}
                  >
                    削除
                  </button>
                </div>
              </div>

              <div className="history-content">
                <div className="history-result">
                  <h3 className={`important-message ${item.result.is_reasonable ? "ok" : "ng"}`}>
                    {item.result.message}
                  </h3>
                  <p>
                    予測家賃: <span className="currency">¥</span>
                    <span className="value">{Math.round(item.result.predicted_rent).toLocaleString()}</span>
                  </p>
                  <p>
                    差額: <span className="currency">¥</span>
                    <span className="value">{Math.round(Math.abs(item.result.difference)).toLocaleString()}</span>
                    （{item.result.difference > 0 ? "予測より高い" : "予測より安い"}）
                  </p>
                </div>

                <div className="history-details">
                  <h4>物件情報</h4>
                  <div className="detail-grid">
                    <p><strong>住所:</strong> {item.input.address}</p>
                    <p><strong>最寄り駅:</strong> {item.input.nearest_station}</p>
                    <p><strong>駅からの分数:</strong> {item.input.distance_from_station}分</p>
                    <p><strong>面積:</strong> {item.input.area}㎡</p>
                    <p><strong>築年数:</strong> {item.input.age}年</p>
                    <p><strong>構造:</strong> {structureMap[item.input.structure] || item.input.structure}</p>
                    <p><strong>間取り:</strong> {layoutMap[item.input.layout] || item.input.layout}</p>
                    <p><strong>家賃:</strong> ¥{item.input.rent.toLocaleString()}</p>
                    {item.input.management_fee && (
                      <p><strong>管理費:</strong> ¥{item.input.management_fee.toLocaleString()}</p>
                    )}
                    {item.input.total_units && (
                      <p><strong>総戸数:</strong> {item.input.total_units}戸</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 削除確認ダイアログ */}
              {showDeleteConfirm === item.id && (
                <div className="confirm-dialog">
                  <p>この履歴を削除しますか？</p>
                  <button onClick={() => handleDeleteItem(item.id)} className="submit-button" style={{ backgroundColor: "#dc3545", marginRight: "10px" }}>
                    削除
                  </button>
                  <button onClick={() => setShowDeleteConfirm(null)} className="submit-button">
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 全削除確認ダイアログ */}
      {showClearAllConfirm && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <p>全ての履歴を削除しますか？この操作は取り消せません。</p>
            <button onClick={handleClearAll} className="submit-button" style={{ backgroundColor: "#dc3545", marginRight: "10px" }}>
              全削除
            </button>
            <button onClick={() => setShowClearAllConfirm(false)} className="submit-button">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;