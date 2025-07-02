import OcrCameraModal from "./OcrCameraModal";
import { extractRentalPropertyData } from "./geminiService";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  // 必須項目 - location.stateから初期値を設定
  const [postal_code, setPostalCode] = useState(
    location.state?.postal_code || ""
  ); // 郵便番号
  const [address, setAddress] = useState(location.state?.address || ""); // 住所
  const [nearest_station, setNearestStation] = useState(
    location.state?.nearest_station || ""
  ); // 最寄り駅
  const [distance_from_station, setDistanceFromStation] = useState(
    location.state?.distance_from_station?.toString() || ""
  ); // 最寄駅からの分数
  const [area, setArea] = useState(location.state?.area?.toString() || ""); // 面積
  const [age, setAge] = useState(location.state?.age?.toString() || ""); // 築年数
  const [structure, setStructure] = useState(
    location.state?.structure?.toString() || ""
  ); // 構造
  const [layout, setLayout] = useState(
    location.state?.layout?.toString() || ""
  ); // 間取り
  const [rent, setRent] = useState(location.state?.rent?.toString() || ""); // 家賃価格

  // オプション項目 - location.stateから初期値を設定
  const [management_fee, setManagementFee] = useState(
    location.state?.management_fee?.toString() || ""
  ); // 管理費
  const [total_units, setTotalUnits] = useState(
    location.state?.total_units?.toString() || ""
  ); // 総戸数

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // 半角数字のみ・整数かを判定
  const isValidInteger = (value: string) =>
    /^[0-9]+$/.test(value) || value === ""; // 空文字も許容する
  // 空白が含まれているかチェック
  const hasWhitespace = (value: string) => /\s/.test(value);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // 必須項目に対するバリデーション (指定された順序に並べ替え)
    const requiredFields = [
      { key: "postal_code", value: postal_code, type: "text", msg: "郵便番号" },
      { key: "address", value: address, type: "text", msg: "住所" },

      {
        key: "nearest_station",
        value: nearest_station,
        type: "text",
        msg: "最寄り駅",
      },
      {
        key: "distance_from_station",
        value: distance_from_station,
        type: "number",
        msg: "最寄駅からの分数",
      },
      { key: "area", value: area, type: "number", msg: "面積" },
      { key: "age", value: age, type: "number", msg: "築年数" },
      { key: "structure", value: structure, type: "number", msg: "構造" },
      { key: "layout", value: layout, type: "number", msg: "間取り" },
      { key: "rent", value: rent, type: "number", msg: "家賃価格" },
    ];

    requiredFields.forEach(({ key, value, type, msg }) => {
      if (value.trim() === "") {
        newErrors[key] = `${msg}は必須項目です。`;
      } else if (hasWhitespace(value)) {
        newErrors[key] = "空白文字が含まれています。削除してください。";
      } else if (type === "number") {
        if (!isValidInteger(value)) {
          newErrors[key] = "半角数字のみ入力してください。(小数不可)";
        } else if (Number(value) < 0) {
          newErrors[key] = "0以上を入力してください。";
        }
      }
      // 郵便番号のバリデーションを追加
      if (
        key === "postal_code" &&
        value.trim() !== "" &&
        !/^\d{7}$/.test(value)
      ) {
        newErrors[key] = "郵便番号は半角数字7桁で入力してください。";
      }
    });

    // 特定の項目の追加バリデーション
    if (layout !== "" && (Number(layout) < 1 || Number(layout) > 12)) {
      newErrors.layout = "間取りは1から12までの数値を入力してください。";
    }
    if (structure !== "" && (Number(structure) < 1 || Number(structure) > 5)) {
      // 例: 1:木造, 2:S, 3:RC, 4:SRC, 5:その他
      newErrors.structure = "構造は1から5までの数値を入力してください。"; // バックエンドの定義に合わせる
    }

    // オプション項目に対する数字バリデーション (入力があれば数値チェック)
    const optionalNumberFields = [
      { key: "management_fee", value: management_fee, msg: "管理費" },
      { key: "total_units", value: total_units, msg: "総戸数" },
    ];

    optionalNumberFields.forEach(({ key, value, msg }) => {
      if (value !== "") {
        // 値が入力されている場合のみチェック
        if (hasWhitespace(value)) {
          newErrors[key] = "空白文字が含まれています。削除してください。";
        } else if (!isValidInteger(value)) {
          newErrors[key] = `${msg}は半角数字のみ入力してください。(小数不可)`;
        } else if (Number(value) < 0) {
          newErrors[key] = `${msg}は0以上を入力してください。`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<string>>, key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setter(e.target.value);
      setErrors((prev) => ({ ...prev, [key]: "" }));
    };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    // 数値項目をnumber型に変換（オプション項目は空文字の場合undefinedにする）
    // こちらも指定された順序に並べ替え
    navigate("/result", {
      state: {
        postal_code: postal_code,
        address: address,
        nearest_station: nearest_station,
        distance_from_station: parseInt(distance_from_station),
        area: parseFloat(area),
        age: parseInt(age),
        structure: parseInt(structure),
        layout: parseInt(layout),
        rent: parseFloat(rent),

        management_fee:
          management_fee === "" ? undefined : parseFloat(management_fee),
        total_units: total_units === "" ? undefined : parseInt(total_units),
      },
    });
  };

  const handleOcrCapture = async (imageData: string) => {
    try {
      const extractedData = await extractRentalPropertyData(imageData);

      // extracted dataをフォームに反映
      if (extractedData.postal_code) setPostalCode(extractedData.postal_code);
      if (extractedData.address) setAddress(extractedData.address);
      if (extractedData.nearest_station)
        setNearestStation(extractedData.nearest_station);
      if (extractedData.distance_from_station)
        setDistanceFromStation(extractedData.distance_from_station.toString());
      if (extractedData.area) setArea(extractedData.area.toString());
      if (extractedData.age) setAge(extractedData.age.toString());
      if (extractedData.structure)
        setStructure(extractedData.structure.toString());
      if (extractedData.layout) setLayout(extractedData.layout.toString());
      if (extractedData.rent) setRent(extractedData.rent.toString());
      if (extractedData.management_fee)
        setManagementFee(extractedData.management_fee.toString());
      if (extractedData.total_units)
        setTotalUnits(extractedData.total_units.toString());

      // エラーをクリア
      setErrors({});
    } catch (error) {
      console.error("OCR error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "OCR処理中にエラーが発生しました。"
      );
    }
  };

  const handleReset = () => {
    setPostalCode("");
    setAddress("");
    setNearestStation("");
    setDistanceFromStation("");
    setArea("");
    setAge("");
    setStructure("");
    setLayout("");
    setRent("");
    setManagementFee("");
    setTotalUnits("");
    setErrors({});
  };

  return (
    <div className="form-container">
      <h1>AI家賃ナビ</h1>

      <button
        type="button"
        className="ocr-button"
        onClick={() => setIsOcrModalOpen(true)}
      >
        📷 OCR で読み取り
      </button>

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => navigate("/history")}
          className="detail-toggle-button"
          style={{ width: "200px", margin: "0 auto" }}
        >
          判定履歴を見る
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={handleReset}
          className="detail-toggle-button"
          style={{
            position: "absolute",
            top: "-120px",
            left: "0",
            width: "70px",
            fontSize: "11px",
            padding: "4px 8px",
            minHeight: "28px",
            backgroundColor: "#6c757d",
            borderColor: "#6c757d",
            boxShadow: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#5a6268";
            e.currentTarget.style.borderColor = "#5a6268";
            e.currentTarget.style.boxShadow = "none";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#6c757d";
            e.currentTarget.style.borderColor = "#6c757d";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          リセット
        </button>

        {/* 必須項目: 郵便番号 */}
        <div className="form-row">
          <div className="form-group">
            <label>郵便番号 (ハイフンなし)</label>
            <input
              type="text"
              value={postal_code}
              onChange={handleChange(setPostalCode, "postal_code")}
              placeholder="例: 1234567 (半角数字7桁)"
              required
              maxLength={7} // 7桁に制限
            />
            {errors.postal_code && (
              <p className="error-message">{errors.postal_code}</p>
            )}
          </div>
          {/* 必須項目: 住所 */}
          <div className="form-group">
            <label>住所 (市区町村名)</label>
            <input
              type="text"
              value={address}
              onChange={handleChange(setAddress, "address")}
              placeholder="例: 杉並区荻窪1-2-3-101"
              required
            />
            {errors.address && (
              <p className="error-message">{errors.address}</p>
            )}
          </div>
        </div>

        <div className="form-row">
          {/* 必須項目: 最寄り駅 */}
          <div className="form-group">
            <label>最寄り駅 (駅名)</label>
            <input
              type="text"
              value={nearest_station}
              onChange={handleChange(setNearestStation, "nearest_station")}
              placeholder="例: 荻窪"
              required
            />
            {errors.nearest_station && (
              <p className="error-message">{errors.nearest_station}</p>
            )}
          </div>
          {/* 必須項目: 最寄駅からの分数 */}
          <div className="form-group">
            <label>最寄駅からの分数</label>
            <input
              type="text"
              value={distance_from_station}
              onChange={handleChange(
                setDistanceFromStation,
                "distance_from_station"
              )}
              placeholder="例: 5 (半角数字のみ)"
              required
            />
            {errors.distance_from_station && (
              <p className="error-message">{errors.distance_from_station}</p>
            )}
          </div>
        </div>

        <div className="form-row">
          {/* 必須項目: 面積 */}
          <div className="form-group">
            <label>面積 (㎡)</label>
            <input
              type="text"
              value={area}
              onChange={handleChange(setArea, "area")}
              placeholder="例: 40 (半角数字のみ)"
              required
            />
            {errors.area && <p className="error-message">{errors.area}</p>}
          </div>
          {/* 必須項目: 築年数 */}
          <div className="form-group">
            <label>築年数</label>
            <input
              type="text"
              value={age}
              onChange={handleChange(setAge, "age")}
              placeholder="例: 20 (半角数字のみ)"
              required
            />
            {errors.age && <p className="error-message">{errors.age}</p>}
          </div>
        </div>

        <div className="form-row">
          {/* 必須項目: 構造 */}
          <div className="form-group">
            <label>構造</label>
            <select
              value={structure}
              onChange={handleChange(setStructure, "structure")}
              required
            >
              <option value="">選択してください</option>
              <option value="1">木造</option>
              <option value="2">S造 (鉄骨造)</option>
              <option value="3">RC造 (鉄筋コンクリート造)</option>
              <option value="4">SRC造 (鉄骨鉄筋コンクリート造)</option>
              <option value="5">その他</option>
            </select>
            {errors.structure && (
              <p className="error-message">{errors.structure}</p>
            )}
          </div>
          {/* 必須項目: 間取り */}
          <div className="form-group">
            <label>間取り</label>
            <select
              value={layout}
              onChange={handleChange(setLayout, "layout")}
              required
            >
              <option value="">選択してください</option>
              <option value="1">1K</option>
              <option value="2">1DK</option>
              <option value="3">1LDK</option>
              <option value="4">2K</option>
              <option value="5">2DK</option>
              <option value="6">2LDK</option>
              <option value="7">3K</option>
              <option value="8">3DK</option>
              <option value="9">3LDK</option>
              <option value="10">4K</option>
              <option value="11">4DK</option>
              <option value="12">4LDK以上</option>
            </select>
            {errors.layout && <p className="error-message">{errors.layout}</p>}
          </div>
        </div>

        <div className="form-row">
          {/* 必須項目: 家賃価格 */}
          <div className="form-group">
            <label>家賃価格 (円)</label>
            <input
              type="text"
              value={rent}
              onChange={handleChange(setRent, "rent")}
              placeholder="例: 60000 (半角数字のみ)"
              required
            />
            {errors.rent && <p className="error-message">{errors.rent}</p>}
          </div>
          {/* レイアウトを維持するための空のdiv */}
          <div className="form-group"></div>
        </div>

        <hr
          style={{ margin: "20px auto", width: "80%", borderColor: "#ddd" }}
        />
        <h3>オプション情報 (任意)</h3>

        {/* オプション項目: 管理費、総戸数 */}
        <div className="form-row">
          <div className="form-group">
            <label>管理費 (円)</label>
            <input
              type="text"
              value={management_fee}
              onChange={handleChange(setManagementFee, "management_fee")}
              placeholder="例: 5000 (半角数字のみ)"
            />
            {errors.management_fee && (
              <p className="error-message">{errors.management_fee}</p>
            )}
          </div>

          <div className="form-group">
            <label>総戸数 (マンションの場合)</label>
            <input
              type="text"
              value={total_units}
              onChange={handleChange(setTotalUnits, "total_units")}
              placeholder="例: 30 (半角数字のみ)"
            />
            {errors.total_units && (
              <p className="error-message">{errors.total_units}</p>
            )}
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button type="submit" className="submit-button">
            判定
          </button>
        </div>
      </form>

      <OcrCameraModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onCapture={handleOcrCapture}
      />
    </div>
  );
}

export default Home;
