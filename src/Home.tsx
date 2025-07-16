import OcrCameraModal from "./OcrCameraModal";
import { PREFECTURES, REGION_MAPPING } from "./constants/region";
import { extractRentalPropertyData } from "./geminiService";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  // 必須項目 - location.stateから初期値を設定
  const [prefecture, setPrefecture] = useState(
    location.state?.prefecture || ""
  ); // 都道府県
  const [region, setCity] = useState(location.state?.city || ""); // 市区町村
  const [nearest_station, setNearestStation] = useState(
    location.state?.nearest_station || ""
  ); // 最寄り駅
  const [station_distance, setDistanceFromStation] = useState(
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
  const [kanrihi, setManagementFee] = useState(
    location.state?.management_fee?.toString() || ""
  ); // 管理費
  const [soukosuu, setTotalUnits] = useState(
    location.state?.total_units?.toString() || ""
  ); // 総戸数

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // 半角数字のみ・整数かを判定
  const isValidInteger = (value: string) =>
    /^[0-9]+$/.test(value) || value === ""; // 空文字も許容する
  // 空白が含まれているかチェック
  const hasWhitespace = (value: string) => /\s/.test(value);

  const validate = (fieldKey?: string, fieldValue?: string) => {
    const newErrors: { [key: string]: string } = { ...errors }; // 現在のエラーをコピー

    // 必須項目に対するバリデーション (指定された順序に並べ替え)
    const requiredFields = [
      {
        key: "prefecture",
        value:
          fieldValue !== undefined && fieldKey === "prefecture"
            ? fieldValue
            : prefecture,
        type: "text",
        msg: "都道府県",
      },
      {
        key: "city",
        value:
          fieldValue !== undefined && fieldKey === "city" ? fieldValue : region,
        type: "text",
        msg: "市区町村",
      },
      {
        key: "nearest_station",
        value:
          fieldValue !== undefined && fieldKey === "nearest_station"
            ? fieldValue
            : nearest_station,
        type: "text",
        msg: "最寄り駅",
      },
      {
        key: "distance_from_station",
        value:
          fieldValue !== undefined && fieldKey === "distance_from_station"
            ? fieldValue
            : station_distance,
        type: "number",
        msg: "最寄駅からの分数",
      },
      {
        key: "area",
        value:
          fieldValue !== undefined && fieldKey === "area" ? fieldValue : area,
        type: "number",
        msg: "面積",
      },
      {
        key: "age",
        value:
          fieldValue !== undefined && fieldKey === "age" ? fieldValue : age,
        type: "number",
        msg: "築年数",
      },
      {
        key: "structure",
        value:
          fieldValue !== undefined && fieldKey === "structure"
            ? fieldValue
            : structure,
        type: "number",
        msg: "構造",
      },
      {
        key: "layout",
        value:
          fieldValue !== undefined && fieldKey === "layout"
            ? fieldValue
            : layout,
        type: "number",
        msg: "間取り",
      },
      {
        key: "rent",
        value:
          fieldValue !== undefined && fieldKey === "rent" ? fieldValue : rent,
        type: "number",
        msg: "家賃価格",
      },
    ];

    const fieldsToValidate = fieldKey
      ? requiredFields.filter((f) => f.key === fieldKey)
      : requiredFields;

    fieldsToValidate.forEach(({ key, value, type }) => {
      if (value.trim() === "") {
        newErrors[key] = `必須項目です。`;
      } else if (hasWhitespace(value)) {
        newErrors[key] = "空白文字が含まれています。削除してください。";
      } else if (type === "number") {
        if (!isValidInteger(value)) {
          newErrors[key] = "半角数字のみ入力してください。(小数不可)";
        } else if (Number(value) < 0) {
          newErrors[key] = "0以上を入力してください。";
        } else {
          delete newErrors[key]; // エラーが解消されたら削除
        }
      } else {
        delete newErrors[key]; // エラーが解消されたら削除
      }
    });

    // 特定の項目の追加バリデーション
    if (fieldKey === "layout" || fieldKey === undefined) {
      if (layout !== "" && (Number(layout) < 1 || Number(layout) > 12)) {
        newErrors.layout = "間取りは1から12までの数値を入力してください。";
      } else if (
        fieldKey === "layout" &&
        layout.trim() !== "" &&
        !newErrors.layout
      ) {
        delete newErrors.layout;
      }
    }
    if (fieldKey === "structure" || fieldKey === undefined) {
      if (
        structure !== "" &&
        (Number(structure) < 1 || Number(structure) > 5)
      ) {
        // 例: 1:木造, 2:S, 3:RC, 4:SRC, 5:その他
        newErrors.structure = "構造は1から5までの数値を入力してください。"; // バックエンドの定義に合わせる
      } else if (
        fieldKey === "structure" &&
        structure.trim() !== "" &&
        !newErrors.structure
      ) {
        delete newErrors.structure;
      }
    }

    // オプション項目に対する数字バリデーション (入力があれば数値チェック)
    const optionalNumberFields = [
      {
        key: "management_fee",
        value:
          fieldValue !== undefined && fieldKey === "management_fee"
            ? fieldValue
            : kanrihi,
        msg: "管理費",
      },
      {
        key: "total_units",
        value:
          fieldValue !== undefined && fieldKey === "total_units"
            ? fieldValue
            : soukosuu,
        msg: "総戸数",
      },
    ];

    const optionalFieldsToValidate = fieldKey
      ? optionalNumberFields.filter((f) => f.key === fieldKey)
      : optionalNumberFields;

    optionalFieldsToValidate.forEach(({ key, value }) => {
      if (value !== "") {
        // 値が入力されている場合のみチェック
        if (hasWhitespace(value)) {
          newErrors[key] = "空白文字が含まれています。削除してください。";
        } else if (!isValidInteger(value)) {
          newErrors[key] = `半角数字のみ入力してください。(小数不可)`;
        } else if (Number(value) < 0) {
          newErrors[key] = `0以上を入力してください。`;
        } else {
          delete newErrors[key]; // エラーが解消されたら削除
        }
      } else {
        delete newErrors[key]; // 空文字ならエラーなし
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
      const newValue = e.target.value;
      setter(newValue);
      // 入力と同時にバリデーションを実行
      validate(key, newValue);
    };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return; // 最終チェック

    const backendRegionKey = REGION_MAPPING[prefecture]?.[region];
    if (!backendRegionKey) {
      alert(
        `対応する地域が見つかりません: "${region}"。入力を見直してください。\n利用可能な地域: ${Object.keys(
          REGION_MAPPING[prefecture] || {}
        ).join(", ")}`
      );
      return; // 処理を中断します
    }

    // 「駅」で終わる場合は末尾を削除
    const sanitizedStation = nearest_station.trim().endsWith("駅")
      ? nearest_station.trim().slice(0, -1)
      : nearest_station.trim();

    // 数値項目をnumber型に変換（オプション項目は空文字の場合undefinedにする）
    // こちらも指定された順序に並べ替え
    navigate("/result", {
      state: {
        prefecture: prefecture,
        city: backendRegionKey,
        nearest_station: sanitizedStation,
        distance_from_station: parseInt(station_distance),
        area: parseFloat(area),
        age: parseInt(age),
        structure: parseInt(structure),
        layout: parseInt(layout),
        rent: parseFloat(rent),

        management_fee: kanrihi === "" ? undefined : parseFloat(kanrihi),
        total_units: soukosuu === "" ? undefined : parseInt(soukosuu),
      },
    });
  };

  const handleOcrCapture = async (imageData: string) => {
    try {
      const extractedData = await extractRentalPropertyData(imageData);

      // extracted dataをフォームに反映
      if (extractedData.prefecture) setPrefecture(extractedData.prefecture);
      if (extractedData.city) setCity(extractedData.city);
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

      // OCRで入力された場合もバリデーションを実行
      validate();
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
    setPrefecture("");
    setCity("");
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

  const cityOptions = REGION_MAPPING[prefecture]
    ? Object.keys(REGION_MAPPING[prefecture])
    : null;

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

        <p className="required-message">
          <span className="required-asterisk">*</span>は必須項目です。
        </p>

        {/* 必須項目: 都道府県 */}
        <div className="form-row">
          <div className="form-group">
            <label>
              都道府県<span className="required-asterisk">*</span>
            </label>
            <select
              value={prefecture}
              onChange={handleChange(setPrefecture, "prefecture")}
              required
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((pref) => (
                <option key={pref} value={pref}>
                  {pref}
                </option>
              ))}
            </select>
            {errors.prefecture && (
              <p className="error-message" style={{ fontSize: "1rem" }}>
                {errors.prefecture}
              </p>
            )}
          </div>
        </div>

        {/* 市区町村のみ都道府県が選択された時だけ表示 */}
        {prefecture !== "" && (
          <div className="form-row">
            <div className="form-group">
              <label>
                市区町村<span className="required-asterisk">*</span>
              </label>
              {cityOptions ? (
                <select
                  value={region}
                  onChange={handleChange(setCity, "city")}
                  required
                >
                  <option value="">選択してください</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={region}
                  onChange={handleChange(setCity, "city")}
                  placeholder="例: ○○市 / ○○区"
                  required
                />
              )}
              {errors.city && (
                <p className="error-message" style={{ fontSize: "1rem" }}>
                  {errors.city}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 最寄り駅 */}
        <div className="form-row">
          <div className="form-group">
            <label>
              最寄り駅 (駅名)<span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              value={nearest_station}
              onChange={handleChange(setNearestStation, "nearest_station")}
              placeholder="例: 荻窪 (“駅”はつけない )"
              required
            />
            {errors.nearest_station && (
              <p className="error-message" style={{ fontSize: "1rem" }}>
                {errors.nearest_station}
              </p>
            )}
          </div>
        </div>

        {/* 最寄駅からの分数 */}
        <div className="form-row">
          <div className="form-group">
            <label>
              最寄駅からの分数<span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              value={station_distance}
              onChange={handleChange(
                setDistanceFromStation,
                "distance_from_station"
              )}
              placeholder="例: 5 (半角数字のみ)"
              required
            />
            {errors.distance_from_station && (
              <p className="error-message" style={{ fontSize: "1rem" }}>
                {errors.distance_from_station}
              </p>
            )}
          </div>
        </div>

        {/* 面積 */}
        <div className="form-row">
          <div className="form-group">
            <label>
              面積 (㎡)<span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              value={area}
              onChange={handleChange(setArea, "area")}
              placeholder="例: 40 (半角数字のみ)"
              required
            />
            {errors.area && (
              <p className="error-message" style={{ fontSize: "1rem" }}>
                {errors.area}
              </p>
            )}
          </div>
        </div>

        {/* 築年数 */}
        <div className="form-row">
          <div className="form-group">
            <label>
              築年数<span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              value={age}
              onChange={handleChange(setAge, "age")}
              placeholder="例: 20 (半角数字のみ)"
              required
            />
            {errors.age && (
              <p className="error-message" style={{ fontSize: "1rem" }}>
                {errors.age}
              </p>
            )}
          </div>
        </div>

        {/* 構造 */}
        <div className="form-row">
          <div className="form-group">
            <label>
              構造<span className="required-asterisk">*</span>
            </label>
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
              <p className="error-message" style={{ fontSize: "1rem" }}>
                {errors.structure}
              </p>
            )}
          </div>
        </div>

        {/* 間取り */}
        <div className="form-row">
          <div className="form-group">
            <label>
              間取り<span className="required-asterisk">*</span>
            </label>
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
            {errors.layout && (
              <p className="error-message" style={{ fontSize: "1rem" }}>
                {errors.layout}
              </p>
            )}
          </div>
        </div>

        {/* 家賃価格 */}
        <div className="form-row">
          <div className="form-group">
            <label>
              家賃価格 (円)<span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              value={rent}
              onChange={handleChange(setRent, "rent")}
              placeholder="例: 60000 (半角数字のみ)"
              required
            />
            {errors.rent && (
              <p className="error-message" style={{ fontSize: "1rem" }}>
                {errors.rent}
              </p>
            )}
          </div>
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
              value={kanrihi}
              onChange={handleChange(setManagementFee, "management_fee")}
              placeholder="例: 5000 (半角数字のみ)"
            />
            {errors.management_fee && (
              <p className="error-message" style={{ fontSize: "1rem" }}>
                {errors.management_fee}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>総戸数 (マンションの場合)</label>
            <input
              type="text"
              value={soukosuu}
              onChange={handleChange(setTotalUnits, "total_units")}
              placeholder="例: 30 (半角数字のみ)"
            />
            {errors.total_units && (
              <p className="error-message" style={{ fontSize: "1rem" }}>
                {errors.total_units}
              </p>
            )}
          </div>
        </div>

        <hr
          style={{
            margin: "100px auto 80px",
            width: "80%",
            borderColor: "#ddd",
          }}
        />

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
