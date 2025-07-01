import type { HistoryItem, PropertyInput, PredictionResult } from './types';

const HISTORY_KEY = 'ai-rent-navi-history';
const MAX_HISTORY_ITEMS = 50; // 履歴の最大保存件数

// 履歴の取得
export const getHistory = (): HistoryItem[] => {
  try {
    const historyData = localStorage.getItem(HISTORY_KEY);
    return historyData ? JSON.parse(historyData) : [];
  } catch (error) {
    console.error('履歴の取得に失敗しました:', error);
    return [];
  }
};

// 履歴の保存
export const saveHistoryItem = (input: PropertyInput, result: PredictionResult): void => {
  try {
    const newItem: HistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      input,
      result,
    };

    const currentHistory = getHistory();
    const updatedHistory = [newItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('履歴の保存に失敗しました:', error);
  }
};

// 特定の履歴項目の削除
export const deleteHistoryItem = (id: string): void => {
  try {
    const currentHistory = getHistory();
    const updatedHistory = currentHistory.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('履歴の削除に失敗しました:', error);
  }
};

// 全履歴の削除
export const clearAllHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('履歴の全削除に失敗しました:', error);
  }
};

// 履歴から入力フォームデータを復元
export const restoreFromHistory = (historyItem: HistoryItem): PropertyInput => {
  return historyItem.input;
};