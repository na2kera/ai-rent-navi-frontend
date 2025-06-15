import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [area, setArea] = useState('');
  const [age, setAge] = useState('');
  const [distance, setDistance] = useState('');
  const [rent, setRent] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();

  // 半角数字のみ・整数かを判定
  const isValidInteger = (value: string) => /^[1-9][0-9]*$/.test(value) || value === '0';

  // 空白が含まれているかチェック
  const hasWhitespace = (value: string) => /\s/.test(value);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

　const fields = [
    { key: 'area', value: area },
    { key: 'age', value: age },
    { key: 'distance', value: distance },
    { key: 'rent', value: rent }
  ];


    fields.forEach(({ key, value }) => {
      if (value === '') {
        newErrors[key] = `必須項目です。(不明な場合大体の数値を入力してください。)`;
      } else if (hasWhitespace(value)) {
        newErrors[key] = '空白文字が含まれています。削除してください。';
      } else if (!isValidInteger(value)) {
        newErrors[key] = '半角数字のみ入力してください。(小数不可)';
      } else if (Number(value) < 0) {
        newErrors[key] = '0以上を入力してください。';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<string>>, key: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setErrors(prev => ({ ...prev, [key]: '' }));
    };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    navigate('/result', {
      state: { area, age, distance, rent }
    });
  };

  return (
    <div className="form-container">
      <h1>AI家賃ナビ</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>面積 (㎡)</label>
            <input
              type="text"
              value={area}
              onChange={handleChange(setArea, 'area')}
              placeholder="例: 40 (半角数字のみ)"
              required
            />
            {errors.area && <p className="error-message">{errors.area}</p>}
          </div>

          <div className="form-group">
            <label>築年数</label>
            <input
              type="text"
              value={age}
              onChange={handleChange(setAge, 'age')}
              placeholder="例: 20 (半角数字のみ)"
              required
            />
            {errors.age && <p className="error-message">{errors.age}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>最寄駅までの距離 (分)</label>
            <input
              type="text"
              value={distance}
              onChange={handleChange(setDistance, 'distance')}
              placeholder="例: 10 (半角数字のみ)"
              required
            />
            {errors.distance && <p className="error-message">{errors.distance}</p>}
          </div>

          <div className="form-group">
            <label>家賃価格 (円)</label>
            <input
              type="text"
              value={rent}
              onChange={handleChange(setRent, 'rent')}
              placeholder="例: 60000 (半角数字のみ)"
              required
            />
            {errors.rent && <p className="error-message">{errors.rent}</p>}
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="submit-button">判定</button>
        </div>
      </form>
    </div>
  );
}

export default Home;
