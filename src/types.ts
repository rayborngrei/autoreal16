export type Drive = "Передний" | "Полный";
export type Gearbox = "Механика" | "Автомат" | "Вариатор" | "Робот";

export interface Car {
  id: string;
  photo: string | null; // URL из /public или dataURL
  make: string; // марка
  model: string; // модель
  year: number; // год выпуска
  country: string; // страна выпуска
  trim: string; // комплектация
  mileage: number; // пробег, км
  drive: Drive; // привод
  engine: string; // объём двигателя, например "2.5 л"
  power?: number; // мощность двигателя, л.с.
  gearbox: Gearbox; // тип КПП
  color: string; // цвет
  price: number; // цена, ₽
  addedAt: number; // дата приёма на склад
}

export const DRIVES: Drive[] = ["Передний", "Полный"];
export const GEARBOXES: Gearbox[] = ["Механика", "Автомат", "Вариатор", "Робот"];

export const MAKES = [
  "Toyota", "Kia", "Hyundai", "BMW", "Mercedes-Benz", "Volkswagen", "LADA",
  "Nissan", "Mazda", "Škoda", "Renault", "Ford", "Audi", "Haval", "Chery",
  "Geely", "Mitsubishi", "Subaru", "Lexus", "Honda", "Volvo", "Chevrolet",
  "Peugeot", "Opel", "УАЗ", "ГАЗ",
];

export const COUNTRIES = [
  "Россия", "Германия", "Япония", "Южная Корея", "Чехия", "Китай", "Франция",
  "США", "Великобритания", "Швеция", "Италия", "Испания", "Словакия",
  "Турция", "Беларусь", "Казахстан", "Узбекистан",
];

export const COLOR_SWATCHES: Record<string, string> = {
  "Чёрный": "#1c1d21",
  "Белый": "#f2f2ef",
  "Серый": "#8b9096",
  "Серебристый": "#c7cbd1",
  "Графитовый": "#4b5058",
  "Синий": "#2356a6",
  "Голубой": "#7cc0e4",
  "Красный": "#c22a20",
  "Бордовый": "#7a202b",
  "Зелёный": "#2e7d4f",
  "Коричневый": "#6f4a2f",
  "Бежевый": "#d6c09a",
  "Оранжевый": "#e06a18",
  "Жёлтый": "#e2c01c",
  "Фиолетовый": "#6b4fa0",
  "Золотистый": "#cfa44a",
};

export const COLORS = Object.keys(COLOR_SWATCHES);

export const swatch = (color: string): string =>
  COLOR_SWATCHES[color] ?? "#a6adb5";

export const fmtMoney = (n: number): string =>
  `${n.toLocaleString("ru-RU")} ₽`;

export const fmtMoneyShort = (n: number): string => {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${(Math.round(m * 100) / 100).toLocaleString("ru-RU")} млн ₽`;
  }
  if (n >= 1_000) return `${Math.round(n / 1000)} тыс ₽`;
  return `${n.toLocaleString("ru-RU")} ₽`;
};

export const fmtKm = (n: number): string =>
  `${n.toLocaleString("ru-RU")} км`;

export const fmtDate = (ts: number): string =>
  new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export const cap = (s: string): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
