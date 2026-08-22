import { useCallback, useEffect, useRef, useState } from "react";
import type { Drive, FuelType, Gearbox } from "./types";
import { cap } from "./types";

export interface ParsedCar {
  make?: string;
  model?: string;
  year?: number;
  country?: string;
  trim?: string;
  mileage?: number;
  drive?: Drive;
  engine?: string;
  power?: number;
  fuel?: FuelType;
  gearbox?: Gearbox;
  color?: string;
  price?: number;
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

/* ------------------------------------------------------------------ */
/*  Числительные: "два миллиона триста тысяч" -> 2 300 000             */
/* ------------------------------------------------------------------ */
const UNITS: Record<string, number> = {
  один: 1, одна: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6,
  семь: 7, восемь: 8, девять: 9, десять: 10, одиннадцать: 11, двенадцать: 12,
  тринадцать: 13, четырнадцать: 14, пятнадцать: 15, шестнадцать: 16,
  семнадцать: 17, восемнадцать: 18, девятнадцать: 19,
};
const TENS: Record<string, number> = {
  двадцать: 20, тридцать: 30, сорок: 40, пятьдесят: 50, шестьдесят: 60,
  семьдесят: 70, восемьдесят: 80, девяносто: 90,
};
const HUNDREDS: Record<string, number> = {
  сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500,
  шестьсот: 600, семьсот: 700, восемьсот: 800, девятьсот: 900,
};

export function wordsToNumber(text: string): number | null {
  const tokens = norm(text)
    .replace(/[^а-яa-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  let total = 0;
  let group = 0;
  let half = false;
  let saw = false;
  for (const t of tokens) {
    if (t in UNITS) { group += UNITS[t]; saw = true; }
    else if (t in TENS) { group += TENS[t]; saw = true; }
    else if (t in HUNDREDS) { group += HUNDREDS[t]; saw = true; }
    else if (t === "полтора" || t === "полторы") { half = true; saw = true; }
    else if (/^тысяч/.test(t)) {
      group = (half ? 1.5 : group || 1) * 1_000;
      total += group; group = 0; half = false; saw = true;
    } else if (/^миллион/.test(t)) {
      group = (half ? 1.5 : group || 1) * 1_000_000;
      total += group; group = 0; half = false; saw = true;
    }
  }
  total += half ? 1.5 : group;
  return saw && total > 0 ? Math.round(total) : null;
}

/* ------------------------------------------------------------------ */
/*  Словари                                                            */
/* ------------------------------------------------------------------ */
const MAKE_WORDS: Record<string, string> = {
  тойота: "Toyota", тойоты: "Toyota", тойоту: "Toyota",
  киа: "Kia", хендэ: "Hyundai", хюндай: "Hyundai", хундай: "Hyundai",
  хундэ: "Hyundai", хундая: "Hyundai",
  бмв: "BMW", мерседес: "Mercedes-Benz", мерседеса: "Mercedes-Benz",
  фольксваген: "Volkswagen", фольцваген: "Volkswagen",
  лада: "LADA", лады: "LADA", ниссан: "Nissan", нисана: "Nissan",
  мазда: "Mazda", мазды: "Mazda", шкода: "Škoda", шкоды: "Škoda",
  рено: "Renault", форд: "Ford", форда: "Ford", ауди: "Audi",
  хавал: "Haval", хавейл: "Haval", хавала: "Haval",
  чери: "Chery", джили: "Geely", джиили: "Geely",
  митсубиси: "Mitsubishi", субару: "Subaru", лексус: "Lexus", лексуса: "Lexus",
  хонда: "Honda", хонды: "Honda", вольво: "Volvo", вольва: "Volvo",
  пежо: "Peugeot", ситроен: "Citroën", опель: "Opel", опеля: "Opel",
  шевроле: "Chevrolet", кадилак: "Cadillac", уаз: "УАЗ", газ: "ГАЗ",
};

const MODEL_TWO: Record<string, string> = {
  "рав 4": "RAV4", "икс пять": "X5", "икс три": "X3", "икс один": "X1",
  "икс шесть": "X6", "е класс": "E-Class", "с класс": "S-Class",
  "а класс": "A-Class", "мазда шесть": "Mazda 6", "мазда три": "Mazda 3",
};
const MODEL_WORDS: Record<string, string> = {
  камри: "Camry", королла: "Corolla", короллы: "Corolla",
  раф4: "RAV4", рав4: "RAV4", солярис: "Solaris", соляриса: "Solaris",
  рио: "Rio", туссан: "Tucson", тусона: "Tucson", крета: "Creta", креты: "Creta",
  спортейдж: "Sportage", октавия: "Octavia", октавии: "Octavia", поло: "Polo",
  тигуан: "Tiguan", тигуана: "Tiguan", кашкай: "Qashqai", кашкая: "Qashqai",
  джолион: "Jolion", туарег: "Touareg", пассат: "Passat", джетта: "Jetta",
  мондео: "Mondeo", куга: "Kuga", фокус: "Focus", фокуса: "Focus",
  гранта: "Granta", гранты: "Granta", веста: "Vesta", весты: "Vesta",
  нива: "Niva", нивы: "Niva", логан: "Logan", дастер: "Duster", дастера: "Duster",
  сандеро: "Sandero", аркана: "Arkana", раптор: "Raptor", мустанг: "Mustang",
};

const COUNTRY_WORDS: Record<string, string> = {
  германия: "Германия", германии: "Германия", германию: "Германия",
  япония: "Япония", японии: "Япония", корея: "Южная Корея", корее: "Южная Корея",
  кореи: "Южная Корея", россия: "Россия", россии: "Россия",
  франция: "Франция", франции: "Франция", чехия: "Чехия", чехии: "Чехия",
  китай: "Китай", китае: "Китай", китая: "Китай", сша: "США", америка: "США",
  америке: "США", англия: "Великобритания", британия: "Великобритания",
  швеция: "Швеция", швеции: "Швеция", италия: "Италия", италии: "Италия",
  испания: "Испания", словакия: "Словакия", словакии: "Словакия",
  мексика: "Мексика", турция: "Турция", индия: "Индия",
  беларусь: "Беларусь", казахстан: "Казахстан", узбекистан: "Узбекистан",
};

const COLOR_RULES: [RegExp, string][] = [
  [/черн/, "Чёрный"], [/бел(ый|ого|ому|ая)/, "Белый"], [/серебрист/, "Серебристый"],
  [/сер(ый|ого|ому|ая)/, "Серый"], [/син(ий|его|ему|яя)/, "Синий"], [/голуб/, "Голубой"],
  [/красн/, "Красный"], [/зелен/, "Зелёный"], [/коричнев/, "Коричневый"],
  [/бежев/, "Бежевый"], [/оранжев/, "Оранжевый"], [/желт/, "Жёлтый"],
  [/фиолетов/, "Фиолетовый"], [/бордов/, "Бордовый"], [/золотист/, "Золотистый"],
  [/графит/, "Графитовый"],
];

const YEAR_ORD_10 = ["десятый", "одиннадцатый", "двенадцатый", "тринадцатый",
  "четырнадцатый", "пятнадцатый", "шестнадцатый", "семнадцатый",
  "восемнадцатый", "девятнадцатый"];
const YEAR_ORD_20 = ["двадцатый", "двадцать первый", "двадцать второй",
  "двадцать третий", "двадцать четвертый", "двадцать пятый", "двадцать шестой"];

const STOP = "(?:год|года|году|страна|страны|комплектаци|пробег|привод|объем|объём|коробк|коробка|цвет|цветом|цена|ценой|передни|полный|автомат|механик|вариатор|робот|тысяч|миллион|литр|рубл|за|на)";

/* ------------------------------------------------------------------ */
/*  Разбор транскрипта                                                 */
/* ------------------------------------------------------------------ */
export function parseTranscript(raw: string): ParsedCar {
  const t = norm(raw);
  const out: ParsedCar = {};
  if (t.length < 3) return out;

  /* --- марка --- */
  const mk = t.match(/марк[аиу]\s+([а-яa-z0-9-]+)/);
  if (mk) {
    const w = mk[1].replace(/[^а-яa-z0-9]/g, "");
    out.make = MAKE_WORDS[w] ?? cap(w);
  }

  /* --- модель --- */
  let modelDone = false;
  const md = t.match(/модел[ьиь]\s+([а-яa-z0-9]+(?:\s[а-яa-z0-9]+){0,2})/);
  if (md) {
    let words = md[1].trim().split(/\s+/);
    while (words.length && new RegExp(`^${STOP}`).test(words[words.length - 1])) words.pop();
    const two = words.slice(0, 2).join(" ");
    const one = words[0] ?? "";
    if (MODEL_TWO[two]) { out.model = MODEL_TWO[two]; modelDone = true; }
    else if (MODEL_WORDS[one]) { out.model = MODEL_WORDS[one]; modelDone = true; }
    else if (one) { out.model = cap(one); modelDone = true; }
  }
  if (!modelDone) {
    for (const [k, v] of Object.entries(MODEL_TWO)) {
      if (t.includes(k)) {
        out.model = v;
        if (k.startsWith("икс")) out.make = out.make ?? "BMW";
        if (k.endsWith("класс")) out.make = out.make ?? "Mercedes-Benz";
        break;
      }
    }
  }

  /* --- год --- */
  const yearDigit =
    t.match(/(\d{4})\s*(?:год|году|года|г\b)/)?.[1] ??
    t.match(/год[ау]?\s+(?:выпуска\s+)?(\d{4})/)?.[1];
  if (yearDigit) {
    const y = Number(yearDigit);
    if (y >= 1950 && y <= 2027) out.year = y;
  }
  if (out.year === undefined) {
    for (let i = 0; i < YEAR_ORD_10.length; i++) {
      if (t.includes(`две тысячи ${YEAR_ORD_10[i]}`)) { out.year = 2010 + i; break; }
    }
    if (out.year === undefined) {
      for (let i = 0; i < YEAR_ORD_20.length; i++) {
        if (t.includes(`две тысячи ${YEAR_ORD_20[i]}`)) { out.year = 2020 + i; break; }
      }
    }
    if (out.year === undefined) {
      const m = t.match(/(?:^|[^а-я])(девятнадцатый|восемнадцатый|семнадцатый|двадцатый|двадцать первый|двадцать второй)\s+год/);
      if (m) {
        const idx10 = YEAR_ORD_10.indexOf(m[1]);
        if (idx10 >= 0) out.year = 2010 + idx10;
        else out.year = 2020 + Math.max(0, YEAR_ORD_20.indexOf(m[1]));
      }
    }
  }

  /* --- страна --- */
  const ct = t.match(/стран[аыу]\s+(?:производств[ао]\s+|выпуска\s+)?([а-я]+)/)?.[1]
    ?? t.match(/собран[аоы]\s+в\s+([а-я]+)/)?.[1]
    ?? t.match(/сборк[аи]\s+([а-я]+)/)?.[1];
  if (ct && COUNTRY_WORDS[ct]) out.country = COUNTRY_WORDS[ct];

  /* --- комплектация --- */
  const tr = t.match(/комплектаци[ия]\s+([а-яa-z0-9-]+(?:\s[а-яa-z0-9-]+){0,1})/);
  if (tr) {
    const parts = tr[1].trim().split(/\s+/);
    out.trim = cap(parts[0]) + (parts[1] ? " " + parts[1] : "");
  }

  /* --- пробег --- */
  const milWin = t.match(/пробег\w*\s+([0-9][0-9\s]{0,11})/);
  if (milWin) {
    let v = Number(milWin[1].replace(/\s/g, ""));
    const tail = t.slice((t.indexOf(milWin[0]) ?? 0) + milWin[0].length, t.indexOf(milWin[0]) + milWin[0].length + 14);
    if (v > 0 && v < 1000 && /тысяч/.test(tail)) v *= 1000;
    if (v >= 0 && v <= 1_500_000) out.mileage = v;
  }
  if (out.mileage === undefined) {
    const idx = t.indexOf("пробег");
    if (idx >= 0) {
      const w = wordsToNumber(t.slice(idx, idx + 46));
      if (w !== null && w <= 1_500_000) out.mileage = w;
    }
  }
  if (out.mileage === undefined) {
    const km = t.match(/([0-9][0-9\s]{2,10})\s*(?:км|километров)/);
    if (km) {
      const v = Number(km[1].replace(/\s/g, ""));
      if (v > 0 && v <= 1_500_000) out.mileage = v;
    }
  }

  /* --- привод --- */
  if (/(^|[^а-я])полн/.test(t)) out.drive = "Полный";
  else if (/(^|[^а-я])передн/.test(t)) out.drive = "Передний";
  else if (/(^|[^а-я])задн/.test(t)) out.drive = "Задний";

  /* --- объём двигателя --- */
  const eIdx = t.search(/объем|двигател/);
  const eWin = eIdx >= 0 ? t.slice(eIdx, eIdx + 34) : t;
  const eDec = eWin.match(/(\d+)[.,](\d+)/);
  const eInt = eWin.match(/(\d+)\s*(?:л\b|литра|литров)/);
  if (eDec) out.engine = `${Number(eDec[1])}.${eDec[2].charAt(0)} л`;
  else if (eInt) out.engine = `${Number(eInt[1])}.0 л`;
  else if (/полтора/.test(eWin)) out.engine = "1.5 л";
  else {
    const DIGW: Record<string, number> = {
      один: 1, два: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8, девять: 9,
    };
    const ew = eWin.match(/(^|[^а-я])(один|два|три)(?:\s+и\s+([а-я]+|\d))?/);
    if (ew && (ew[3] || /литр|\sл\b/.test(eWin))) {
      const base = DIGW[ew[2]] ?? 2;
      let frac: string | null = null;
      if (ew[3]) {
        frac = /^\d$/.test(ew[3]) ? ew[3] : DIGW[ew[3]] != null ? String(DIGW[ew[3]]) : null;
      }
      out.engine = frac ? `${base}.${frac} л` : `${base}.0 л`;
    }
  }
  if (out.engine === undefined) {
    const g = t.match(/(\d+[.,]\d+)\s*(?:литра|литров|л\b)/);
    if (g) out.engine = `${g[1].replace(",", ".")} л`;
  }

  /* --- мощность (л.с.) --- */
  const pIdx = t.search(/мощност/);
  if (pIdx >= 0) {
    const win = t.slice(pIdx, pIdx + 46);
    const d = win.match(/(?<![\d])(\d{2,3})(?![\d])/);
    if (d) {
      const v = Number(d[1]);
      if (v >= 20 && v <= 800) out.power = v;
    } else {
      const w = wordsToNumber(win);
      if (w !== null && w >= 20 && w <= 800) out.power = w;
    }
  }
  if (out.power === undefined) {
    const idx = t.search(/лошадин|л\. ?с\.|(?:^|[^а-я])лс(?:[^а-я]|$)/);
    if (idx >= 0) {
      const before = t.slice(Math.max(0, idx - 42), idx);
      const d = before.match(/(\d{2,3})\s*$/);
      if (d) {
        const v = Number(d[1]);
        if (v >= 20 && v <= 800) out.power = v;
      } else {
        const w = wordsToNumber(before);
        if (w !== null && w >= 20 && w <= 800) out.power = w;
      }
    }
  }

  /* --- тип двигателя (топливо) --- */
  if (/электромобил|электро|электрическ/.test(t)) out.fuel = "Электрический";
  else if (/гибрид/.test(t)) out.fuel = "Гибридный";
  else if (/дизел/.test(t)) out.fuel = "Дизельный";
  else if (/бензин/.test(t)) out.fuel = "Бензиновый";

  /* --- коробка --- */
  if (/робот|роботизир|дсг|dsg/.test(t)) out.gearbox = "Робот";
  else if (/вариатор|cvt/.test(t)) out.gearbox = "Вариатор";
  else if (/автомат/.test(t)) out.gearbox = "Автомат";
  else if (/механик/.test(t)) out.gearbox = "Механика";

  /* --- цвет --- */
  const near = t.match(/цвет[аеу]?\s+([а-я]+)/)?.[1];
  if (near) {
    for (const [re, c] of COLOR_RULES) if (re.test(near)) { out.color = c; break; }
  }
  if (out.color === undefined) {
    for (const [re, c] of COLOR_RULES) if (re.test(t)) { out.color = c; break; }
  }

  /* --- цена --- */
  const digitGroups = [...t.matchAll(/(\d{1,3}(?:\s\d{3})+|\d{6,8})/g)];
  let price: number | undefined;
  const priced = digitGroups
    .map((m) => ({ v: Number(m[0].replace(/\s/g, "")), idx: m.index ?? 0 }))
    .filter((x) => x.v >= 100_000 && x.v <= 50_000_000);
  const anchor = t.search(/цена|стоит|за\s|оцен/);
  const nearAnchor = priced.filter((x) => anchor >= 0 && Math.abs(x.idx - anchor) < 42);
  const pick = (nearAnchor.length ? nearAnchor : priced)
    .sort((a, b) => (anchor >= 0 ? Math.abs(a.idx - anchor) - Math.abs(b.idx - anchor) : b.v - a.v))[0];
  if (pick) {
    let v = pick.v;
    const tail = t.slice(pick.idx, pick.idx + 20);
    if (v < 100_000 && /тысяч/.test(tail)) v *= 1000;
    if (/миллион/.test(tail) && v < 100) v *= 1_000_000;
    price = v;
  }
  if (price === undefined) {
    const w = wordsToNumber(t);
    if (w !== null && w >= 100_000) price = w;
  }
  if (price !== undefined && price >= 50_000 && price <= 50_000_000) out.price = price;

  return out;
}

/* ------------------------------------------------------------------ */
/*  Хук распознавания речи (Web Speech API, ru-RU)                     */
/* ------------------------------------------------------------------ */
export function useSpeechRecognition(
  onText: (text: string) => void,
  onError?: (code: string) => void,
) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const finalRef = useRef("");
  const onTextRef = useRef(onText);
  const onErrorRef = useRef(onError);
  onTextRef.current = onText;
  onErrorRef.current = onError;

  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = "ru-RU";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      onTextRef.current((finalRef.current + interim).trim());
    };
    rec.onerror = (e: any) => {
      if (e?.error && e.error !== "no-speech" && e.error !== "aborted") {
        onErrorRef.current?.(e.error);
      }
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => {
      try { rec.abort(); } catch { /* noop */ }
    };
  }, []);

  const start = useCallback(() => {
    try {
      recRef.current?.start();
      setListening(true);
    } catch { /* уже запущено */ }
  }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    onTextRef.current("");
  }, []);

  return { supported, listening, start, stop, reset };
}
