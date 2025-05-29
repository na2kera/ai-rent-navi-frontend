import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css'; // form-container のスタイルを読み込む

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { postalCode, fullAddress, age, roomCount, rent } = location.state || {};

  const evaluateRent = () => {
    const rentNum = parseFloat(rent);
    if (isNaN(rentNum)) return 1;
    if (rentNum <= 50000) return 5;
    if (rentNum <= 70000) return 4;
    if (rentNum <= 90000) return 3;
    if (rentNum <= 110000) return 2;
    return 1;
  };

  const rating = evaluateRent();
  const messages = [
    '高すぎます',
    'やや高めです',
    '適正価格です',
    'やや安めです',
    '安すぎます',
  ];

  const renderStars = (rating: number) => {
    return (
      <div style={{ fontSize: '24px', color: '#FFD700', marginBottom: '8px' }}>
        {'★'.repeat(rating)}
        {'☆'.repeat(5 - rating)}
      </div>
    );
  };

  return (
    <div className="form-container">
      <h2>結果ページ</h2>
      <p>郵便番号: {postalCode}</p>
      <p>住所: {fullAddress}</p>
      <p>築年数: {age} 年</p>
      <p>部屋数: {roomCount}</p>

      <h3>家賃評価: {rating} / 5</h3>
      {renderStars(rating)}
      <p>{messages[rating - 1]}</p>

      <button onClick={() => navigate('/')}>戻る</button>
    </div>
  );
}

export default Result;
