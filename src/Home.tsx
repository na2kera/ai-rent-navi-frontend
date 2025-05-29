import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [postalCode, setPostalCode] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [age, setAge] = useState('');
  const [roomCount, setRoomCount] = useState('');
  const [rent, setRent] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    navigate('/result', {
    state: {
        postalCode,
        fullAddress,
        age,
        roomCount,
        rent
    }
    });

  };

  return (
    <div className="form-container">
      <h1>AI家賃ナビ</h1>
      <form onSubmit={handleSubmit}>
        <div>
            <label>郵便番号</label><br />
            <input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="例:123-4567"
                required
            />
        </div>

        <div>
            <label>住所</label><br />
            <input
            value={fullAddress}
            onChange={(e) => setFullAddress(e.target.value)}
            placeholder="例:東京都新宿区西新宿1-1-1"
            required
            />
        </div>

        <div>
            <label>築年数</label><br />
            <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="例:20"
            required
            />
        </div>

        <div>
            <label>部屋数</label><br />
            <input
            value={roomCount}
            onChange={(e) => setRoomCount(e.target.value)}
            placeholder="例:2LDK"
            required
            />
        </div>

        <div>
            <label>家賃価格</label><br />
            <input
            value={rent}
            onChange={(e) => setRent(e.target.value)}
            placeholder="例:60000"
            required
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
