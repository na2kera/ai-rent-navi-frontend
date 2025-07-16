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
