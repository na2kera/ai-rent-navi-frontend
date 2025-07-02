import { GoogleGenerativeAI } from "@google/generative-ai";

interface RentalPropertyData {
  postal_code?: string;
  address?: string;
  nearest_station?: string;
  distance_from_station?: number;
  area?: number;
  age?: number;
  structure?: number;
  layout?: number;
  rent?: number;
  management_fee?: number;
  total_units?: number;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key is not set. Please set VITE_GEMINI_API_KEY in your environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

const PROMPT = `
この画像から賃貸物件情報を抽出し、JSON形式で返してください。
以下のキーを使用してください：
- postal_code: 郵便番号（ハイフンなし、7桁の数字文字列）
- address: 住所（市区町村名以降）
- nearest_station: 最寄り駅名
- distance_from_station: 最寄駅からの分数（数値）
- area: 面積（㎡、数値）
- age: 築年数（数値）
- structure: 構造（数値: 1=木造, 2=S造, 3=RC造, 4=SRC造, 5=その他）
- layout: 間取り（数値: 1=1K, 2=1DK, 3=1LDK, 4=2K, 5=2DK, 6=2LDK, 7=3K, 8=3DK, 9=3LDK, 10=4K, 11=4DK, 12=4LDK以上）
- rent: 家賃（円、数値）
- management_fee: 管理費（円、数値、オプション）
- total_units: 総戸数（数値、オプション）

該当する情報が見つからない項目は null にしてください。
JSONのみを返してください。説明文は不要です。

構造の判定基準：
- 木造、木 → 1
- 鉄骨、S造、軽量鉄骨 → 2
- 鉄筋コンクリート、RC造、鉄筋コンクリート造 → 3
- 鉄骨鉄筋コンクリート、SRC造 → 4
- その他、不明 → 5

間取りの判定基準：
- 1K → 1
- 1DK → 2
- 1LDK → 3
- 2K → 4
- 2DK → 5
- 2LDK → 6
- 3K → 7
- 3DK → 8
- 3LDK → 9
- 4K → 10
- 4DK → 11
- 4LDK以上 → 12
`;

export const extractRentalPropertyData = async (imageBase64: string): Promise<RentalPropertyData> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured. Please set VITE_GEMINI_API_KEY environment variable.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imagePart = {
      inlineData: {
        data: imageBase64.split(",")[1], // Remove data:image/jpeg;base64, prefix
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini API response:", text);

    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Valid JSON not found in response");
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    
    // データの検証と変換
    const validatedData: RentalPropertyData = {};
    
    if (extractedData.postal_code && typeof extractedData.postal_code === 'string') {
      // 郵便番号からハイフンを除去し、7桁の数字のみに
      const cleanPostalCode = extractedData.postal_code.replace(/[^0-9]/g, '');
      if (cleanPostalCode.length === 7) {
        validatedData.postal_code = cleanPostalCode;
      }
    }
    
    if (extractedData.address && typeof extractedData.address === 'string') {
      validatedData.address = extractedData.address.trim();
    }
    
    if (extractedData.nearest_station && typeof extractedData.nearest_station === 'string') {
      validatedData.nearest_station = extractedData.nearest_station.trim();
    }
    
    // 数値項目の検証
    const numericFields = ['distance_from_station', 'area', 'age', 'structure', 'layout', 'rent', 'management_fee', 'total_units'];
    numericFields.forEach(field => {
      if (extractedData[field] !== null && extractedData[field] !== undefined) {
        const numValue = Number(extractedData[field]);
        if (!isNaN(numValue) && numValue >= 0) {
          (validatedData as Record<string, unknown>)[field] = numValue;
        }
      }
    });
    
    // 構造と間取りの範囲チェック
    if (validatedData.structure && (validatedData.structure < 1 || validatedData.structure > 5)) {
      delete validatedData.structure;
    }
    if (validatedData.layout && (validatedData.layout < 1 || validatedData.layout > 12)) {
      delete validatedData.layout;
    }

    return validatedData;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("OCR処理中にエラーが発生しました。画像が不鮮明な場合は、再度撮影してください。");
  }
};