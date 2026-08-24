export type Drive = "Передний" | "Задний" | "Полный";
export type Gearbox = "Механика" | "Автомат" | "Вариатор" | "Робот";
export type FuelType = "Бензиновый" | "Дизельный" | "Гибридный" | "Электрический";
export type Condition = "Новый" | "С пробегом";

export interface Car {
  id: string;
  photo: string | null; // URL или dataURL
  make: string; // марка
  model: string; // модель
  year: number; // год выпуска
  country: string; // страна выпуска
  trim: string; // комплектация
  mileage: number; // пробег, км
  drive: Drive; // привод
  engine: string; // объём двигателя, например "2.5 л"
  power?: number; // мощность, л.с.
  fuel?: FuelType; // тип двигателя
  gearbox: Gearbox; // тип КПП
  color: string; // цвет
  price: number; // цена, ₽
  addedAt: number; // дата постановки на склад
  updatedAt?: number; // дата последней правки
  lastEditor?: string; // кто последний редактировал
  lastEditedAt?: number; // когда последний редактировал
  condition?: Condition; // состояние: новый или с пробегом
}

export type Role = "admin" | "operator";

export interface User {
  id: string;
  login: string;
  name: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
}

export const DRIVES: Drive[] = ["Передний", "Задний", "Полный"];
export const GEARBOXES: Gearbox[] = ["Механика", "Автомат", "Вариатор", "Робот"];
export const FUELS: FuelType[] = ["Бензиновый", "Дизельный", "Гибридный", "Электрический"];
export const CONDITIONS: Condition[] = ["Новый", "С пробегом"];

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

export const COLORS = [
  "Чёрный", "Белый", "Серебристый", "Серый", "Графитовый", "Синий", "Голубой",
  "Красный", "Бордовый", "Зелёный", "Коричневый", "Бежевый", "Оранжевый",
  "Жёлтый", "Фиолетовый", "Золотистый",
];

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const fmtMoney = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

export const fmtKm = (n: number) => `${n.toLocaleString("ru-RU")} км`;

export const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });

export const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const fmtDateTime = (t: number) =>
  new Date(t).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });

const SWATCH: Record<string, string> = {
  "Чёрный": "#1a1c1f", "Белый": "#f4f5f6", "Серебристый": "#c3c8cd",
  "Серый": "#8b9299", "Графитовый": "#4a4f55", "Синий": "#1d4e8f",
  "Голубой": "#7fb7d9", "Красный": "#c8201f", "Бордовый": "#6d1a24",
  "Зелёный": "#2f6b3a", "Коричневый": "#6b4a2f", "Бежевый": "#d9c9a8",
  "Оранжевый": "#e07020", "Жёлтый": "#e8c820", "Фиолетовый": "#5a3d8f",
  "Золотистый": "#c8a544",
};

export const swatch = (color: string) => SWATCH[color] ?? "#aeb6bd";
