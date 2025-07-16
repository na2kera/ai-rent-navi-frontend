export const PREFECTURES = ["東京都"];

export const REGION_MAPPING: {
  [prefecture: string]: { [city: string]: string };
} = {
  東京都: {
    杉並区: "suginami",
    武蔵野市: "musashino",
    北区: "kitaku",
    中野区: "nakanoku",
    練馬区: "nerimaku",
  },
};

// 逆引き: APIキー -> 日本語市区町村名
export const REVERSE_REGION_MAPPING: { [key: string]: string } = {
  suginami: "杉並区",
  musashino: "武蔵野市",
  kitaku: "北区",
  nakanoku: "中野区",
  nerimaku: "練馬区",
};
