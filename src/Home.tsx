import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  // 必須項目
  const [address, setAddress] = useState(""); // 新規: 住所
  const [structure, setStructure] = useState(""); // 新規: 構造
  const [nearest_station, setNearestStation] = useState(""); // 新規: 最寄り駅
  const [distance_from_station, setDistanceFromStation] = useState(""); // 新規: 最寄駅からの分数

  const [area, setArea] = useState(""); // 既存: 面積
  const [layout, setLayout] = useState(""); // 既存: 間取り
  const [age, setAge] = useState(""); // 既存: 築年数
  const [rent, setRent] = useState(""); // 既存: 家賃価格

  // オプション項目
  const [parking_spaces, setParkingSpaces] = useState(""); // 新規: 駐車場数
  const [deposit, setDeposit] = useState(""); // 新規: 敷金
  const [key_money, setKeyMoney] = useState(""); // 新規: 礼金
  const [management_fee, setManagementFee] = useState(""); // 新規: 管理費
  const [total_units, setTotalUnits] = useState(""); // 新規: 総戸数
  const [conditions, setConditions] = useState(""); // 新規: 条件

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();

  // 半角数字のみ・整数かを判定
  const isValidInteger = (value: string) =>
    /^[0-9]+$/.test(value) || value === ""; // 空文字も許容する
  // const isValidPositiveInteger = (value: string) => /^[1-9][0-9]*$/.test(value); // 0は不可

  // 空白が含まれているかチェック
  const hasWhitespace = (value: string) => /\s/.test(value);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // 必須項目に対するバリデーション
    const requiredFields = [
      { key: "address", value: address, type: "text", msg: "住所" },
      { key: "structure", value: structure, type: "number", msg: "構造" },
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
      { key: "layout", value: layout, type: "number", msg: "間取り" },
      { key: "age", value: age, type: "number", msg: "築年数" },
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
    });

    // 特定の項目の追加バリデーション
    if (layout !== "" && (Number(layout) < 1 || Number(layout) > 12)) {
      newErrors.layout = "間取りは1から12までの数値を入力してください。";
    }
    if (structure !== "" && (Number(structure) < 1 || Number(structure) > 5)) {
      // 例: 1:木造, 2:S, 3:RC, 4:SRC, 5:鉄骨造
      newErrors.structure = "構造は1から5までの数値を入力してください。"; // バックエンドの定義に合わせる
    }

    // オプション項目に対する数字バリデーション (入力があれば数値チェック)
    const optionalNumberFields = [
      { key: "parking_spaces", value: parking_spaces, msg: "駐車場数" },
      { key: "deposit", value: deposit, msg: "敷金" },
      { key: "key_money", value: key_money, msg: "礼金" },
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
    navigate("/result", {
      state: {
        address: address,
        structure: parseInt(structure),
        nearest_station: nearest_station,
        distance_from_station: parseInt(distance_from_station),
        area: parseFloat(area),
        layout: parseInt(layout),
        age: parseInt(age),
        rent: parseFloat(rent),

        parking_spaces:
          parking_spaces === "" ? undefined : parseInt(parking_spaces),
        deposit: deposit === "" ? undefined : parseFloat(deposit),
        key_money: key_money === "" ? undefined : parseFloat(key_money),
        management_fee:
          management_fee === "" ? undefined : parseFloat(management_fee),
        total_units: total_units === "" ? undefined : parseInt(total_units),
        conditions: conditions === "" ? undefined : conditions,
      },
    });
  };

  return (
    <div className="form-container">
      <h1>AI家賃ナビ</h1>

      <form onSubmit={handleSubmit}>
        {/* 新しい必須項目 */}
        <div className="form-row">
          <div className="form-group">
            <label>住所 (市区町村名)</label>
            <input
              type="text"
              value={address}
              onChange={handleChange(setAddress, "address")}
              placeholder="例: 世田谷区"
              required
            />
            {errors.address && (
              <p className="error-message">{errors.address}</p>
            )}
          </div>

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
              <option value="5">その他</option> {/* 必要に応じて追加 */}
            </select>
            {errors.structure && (
              <p className="error-message">{errors.structure}</p>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>最寄り駅 (駅名)</label>
            <input
              type="text"
              value={nearest_station}
              onChange={handleChange(setNearestStation, "nearest_station")}
              placeholder="例: 新宿"
              required
            />
            {errors.nearest_station && (
              <p className="error-message">{errors.nearest_station}</p>
            )}
          </div>

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

        {/* 既存の必須項目 */}
        <div className="form-row">
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
        </div>

        <hr
          style={{ margin: "20px auto", width: "80%", borderColor: "#ddd" }}
        />
        <h3>オプション情報 (任意)</h3>

        {/* オプション項目 */}
        <div className="form-row">
          <div className="form-group">
            <label>駐車場数</label>
            <input
              type="text"
              value={parking_spaces}
              onChange={handleChange(setParkingSpaces, "parking_spaces")}
              placeholder="例: 1 (半角数字のみ)"
            />
            {errors.parking_spaces && (
              <p className="error-message">{errors.parking_spaces}</p>
            )}
          </div>

          <div className="form-group">
            <label>敷金 (円)</label>
            <input
              type="text"
              value={deposit}
              onChange={handleChange(setDeposit, "deposit")}
              placeholder="例: 60000 (半角数字のみ)"
            />
            {errors.deposit && (
              <p className="error-message">{errors.deposit}</p>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>礼金 (円)</label>
            <input
              type="text"
              value={key_money}
              onChange={handleChange(setKeyMoney, "key_money")}
              placeholder="例: 60000 (半角数字のみ)"
            />
            {errors.key_money && (
              <p className="error-message">{errors.key_money}</p>
            )}
          </div>

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
        </div>

        <div className="form-row">
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

          <div className="form-group">
            <label>条件 (ペット不可、高齢者可など)</label>
            <textarea
              value={conditions}
              onChange={handleChange(setConditions, "conditions")}
              placeholder="例: ペット不可、楽器相談"
              rows={3} // 行数を調整
              style={{
                width: "95%",
                maxWidth: "320px",
                padding: "10px",
                border: "1px solid #bbb",
                borderRadius: "6px",
              }}
            ></textarea>
            {errors.conditions && (
              <p className="error-message">{errors.conditions}</p>
            )}
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button type="submit" className="submit-button">
            判定
          </button>
        </div>
      </form>
    </div>
  );
}

export default Home;
