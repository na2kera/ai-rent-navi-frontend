import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [area, setArea] = useState('');
  const [age, setAge] = useState('');
  const [distance, setDistance] = useState('');
  const [rent, setRent] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate('/result', {
      state: { area, age, distance, rent }
    });
  };

  return (
    <div className="form-container">
      <h1>AI家賃ナビ</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>面積 (㎡)</label><br />
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="例: 40"
            required
            type="number"
          />
        </div>

        <div>
          <label>築年数</label><br />
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="例: 20"
            required
            type="number"
          />
        </div>

        <div>
          <label>最寄駅までの距離 (分)</label><br />
          <input
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="例: 10"
            required
            type="number"
          />
        </div>

        <div>
          <label>家賃価格 (円)</label><br />
          <input
            value={rent}
            onChange={(e) => setRent(e.target.value)}
            placeholder="例: 60000"
            required
            type="number"
          />
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button type="submit">送信</button>
        </div>
      </form>
    </div>
  );
}

export default Home;