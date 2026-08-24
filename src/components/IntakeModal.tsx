import { useCallback, useEffect, useRef, useState } from "react";
import type { Car, Condition, Drive, FuelType, Gearbox } from "../types";
import { COUNTRIES, COLORS, CONDITIONS, DRIVES, FUELS, GEARBOXES, MAKES, cap, swatch, uid } from "../types";
import { parseTranscript, useSpeechRecognition, type ParsedCar } from "../speech";
import {
  IconAlert, IconCheck, IconEraser, IconMic, IconStop, IconUpload, IconX,
} from "./icons";

interface Draft {
  make: string; model: string; year: string; country: string; trim: string;
  mileage: string; drive: Drive; engine: string; power: string; fuel: FuelType;
  gearbox: Gearbox; color: string; price: string; condition: Condition;
}

const EMPTY: Draft = {
  make: "", model: "", year: "", country: "", trim: "", mileage: "",
  drive: "Передний", engine: "", power: "", fuel: "Бензиновый",
  gearbox: "Механика", color: "", price: "", condition: "С пробегом",
};

const EXAMPLE =
  "«Марка Тойота, модель Камри, две тысячи двадцать первый год, страна Япония, " +
  "комплектация Элеганс, пробег сорок пять тысяч, привод передний, объём два и пять, " +
  "мощность сто восемьдесят, двигатель бензиновый, коробка автомат, цвет серебристый, " +
  "цена два миллиона восемьсот девяносто тысяч»";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 720; // держим фото компактными: общая корзина/БД ограничена по объёму
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("canvas")); return; }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

const Field = ({
  label, required, error, children, hint,
}: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1 flex items-baseline gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
      {label}
      {required && <span className="text-accent">*</span>}
      {hint && <span className="ml-auto font-medium normal-case tracking-normal text-ink-3/60">{hint}</span>}
    </span>
    {children}
    {error && (
      <span className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-accent-deep">
        <IconAlert size={12} /> {error}
      </span>
    )}
  </label>
);

const inputCls = (err?: string) =>
  `w-full rounded-[4px] border-2 bg-white px-3 py-2 text-[14px] font-medium outline-none transition-colors placeholder:text-ink-3/40 focus:border-accent ${
    err ? "border-accent-deep" : "border-ink/20 hover:border-ink/40"
  }`;

const toDraft = (c: Car | null | undefined): Draft =>
  c
    ? {
        make: c.make, model: c.model, year: String(c.year), country: c.country,
        trim: c.trim, mileage: String(c.mileage), drive: c.drive, engine: c.engine,
        power: c.power ? String(c.power) : "",
        fuel: c.fuel ?? "Бензиновый",
        gearbox: c.gearbox, color: c.color, price: String(c.price),
        condition: c.condition ?? "С пробегом",
      }
    : EMPTY;

interface Props {
  initial?: Car | null; // если передана машина — режим правки
  onClose: () => void;
  onSave: (car: Car) => void;
  notify: (msg: string, kind?: "ok" | "err") => void;
}

export default function IntakeModal({ initial, onClose, onSave, notify }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<ParsedCar>({});
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Draft) => (v: string) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleText = useCallback((text: string) => {
    setTranscript(text);
    const p = parseTranscript(text);
    setParsed(p);
    if (Object.keys(p).length === 0) return;
    setDraft((d) => ({
      ...d,
      make: p.make ?? d.make,
      model: p.model ?? d.model,
      year: p.year != null ? String(p.year) : d.year,
      country: p.country ?? d.country,
      trim: p.trim ?? d.trim,
      mileage: p.mileage != null ? String(p.mileage) : d.mileage,
      drive: p.drive ?? d.drive,
      engine: p.engine ?? d.engine,
      power: p.power != null ? String(p.power) : d.power,
      fuel: p.fuel ?? d.fuel,
      gearbox: p.gearbox ?? d.gearbox,
      color: p.color ?? d.color,
      price: p.price != null ? String(p.price) : d.price,
      condition: p.condition ?? d.condition,
    }));
  }, []);

  const { supported, listening, start, stop, reset } = useSpeechRecognition(
    handleText,
    (code) => {
      notify(
        code === "not-allowed"
          ? "Доступ к микрофону запрещён — разрешите его в настройках браузера"
          : "Ошибка микрофона. Заполните форму вручную",
        "err",
      );
    },
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const pickPhoto = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Файл не похож на изображение", "err");
      return;
    }
    try {
      setPhoto(await compressImage(file));
    } catch {
      notify("Не удалось прочитать изображение", "err");
    }
  };

  const submit = () => {
    const e: Partial<Record<keyof Draft, string>> = {};
    if (!draft.make.trim()) e.make = "Укажите марку";
    if (!draft.model.trim()) e.model = "Укажите модель";
    const year = Number(draft.year);
    if (!draft.year || Number.isNaN(year) || year < 1950 || year > 2027)
      e.year = "Год: 1950–2027";
    const price = Number(draft.price);
    if (!draft.price || Number.isNaN(price) || price <= 0) e.price = "Укажите цену, ₽";
    setErrors(e);
    if (Object.keys(e).length) {
      notify("Проверьте выделенные поля", "err");
      return;
    }
    stop();
    onSave({
      ...(initial
        ? { id: initial.id, addedAt: initial.addedAt }
        : { id: uid(), addedAt: Date.now() }),
      photo,
      make: cap(draft.make.trim()),
      model: cap(draft.model.trim()),
      year,
      country: draft.country.trim(),
      trim: cap(draft.trim.trim()),
      mileage: Math.max(0, Number(draft.mileage) || 0),
      drive: draft.drive,
      engine: draft.engine.trim(),
      power: Number(draft.power) > 0 ? Math.round(Number(draft.power)) : undefined,
      fuel: draft.fuel,
      gearbox: draft.gearbox,
      color: draft.color.trim(),
      price: Math.round(price),
      condition: draft.condition,
      updatedAt: Date.now(),
    });
  };

  const parsedCount = Object.keys(parsed).length;

  const seg = <T extends string>(value: T, options: readonly T[], onChange: (v: T) => void) => (
    <div className="grid grid-cols-2 gap-1 rounded-[4px] border-2 border-ink/20 bg-white p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-[3px] px-2 py-1.5 text-[12.5px] font-bold transition-all ${
            value === o
              ? "bg-ink text-paper shadow-hard-sm"
              : "text-ink-3 hover:bg-paper"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 p-4 backdrop-blur-[3px] md:py-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="anim-pop w-full max-w-5xl overflow-hidden rounded-[6px] border-2 border-ink bg-panel shadow-hard">
        <div className="hazard h-2.5" />

        {/* шапка */}
        <header className="flex items-center gap-4 border-b-2 border-ink bg-ink px-5 py-4 text-paper">
          <div className="plate -mx-1 border border-paper/20 px-3 py-1.5">
            <span className="font-display text-[13px] tracking-[0.22em]">
              {initial ? "ПРАВКА ДАННЫХ" : "ПРИЁМКА · 01"}
            </span>
          </div>
          <div>
            <h2 className="font-display text-xl leading-tight">
              {initial ? (
                <>
                  Правка: <span className="text-accent">{initial.make} {initial.model}</span>
                </>
              ) : (
                <>
                  Новая единица <span className="text-accent">на склад</span>
                </>
              )}
            </h2>
            <p className="text-[12px] text-paper/60">
              {initial
                ? "Измените поля вручную или продиктуйте новые значения — они перезапишут текущие"
                : "Продиктуйте характеристики голосом — система распознает и подставит их в поля"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-[4px] border border-paper/25 p-2 transition-colors hover:border-accent hover:bg-accent"
            title="Закрыть"
          >
            <IconX size={18} />
          </button>
        </header>

        <div className="grid md:grid-cols-[360px_1fr]">
          {/* ---------------- левая колонка: голос + фото ---------------- */}
          <div className="border-b-2 border-ink bg-[#f2f4f6] md:border-b-0 md:border-r-2">
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-[13px] tracking-[0.18em] text-ink-3">
                  01 · ГОЛОСОВОЙ НАБОР
                </h3>
                {parsedCount > 0 && (
                  <span className="flex items-center gap-1 border border-ok/40 bg-ok/10 px-2 py-0.5 text-[11px] font-bold text-ok">
                    <IconCheck size={12} /> распознано: {parsedCount}
                  </span>
                )}
              </div>

              {/* микрофон */}
              <div className="flex flex-col items-center py-2">
                <div className="relative">
                  {listening && (
                    <>
                      <span className="mic-ring absolute inset-0 rounded-full border-2 border-accent" />
                      <span className="mic-ring absolute inset-0 rounded-full border-2 border-accent" style={{ animationDelay: "0.55s" }} />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={listening ? stop : start}
                    disabled={!supported}
                    className={`relative flex h-[86px] w-[86px] items-center justify-center rounded-full border-[3px] transition-all duration-200 active:scale-95 ${
                      listening
                        ? "border-ink bg-accent text-white shadow-hard-sm"
                        : "border-ink bg-ink text-paper shadow-hard-sm hover:bg-accent hover:text-white"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                    title={listening ? "Остановить запись" : "Начать диктовку"}
                  >
                    {listening ? <IconStop size={30} /> : <IconMic size={30} />}
                  </button>
                </div>

                {/* волна */}
                <div className="mt-3 flex h-7 items-end gap-[5px]">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <span
                      key={i}
                      className={`w-[5px] rounded-sm ${listening ? "wave-bar bg-accent" : "bg-ink/15"}`}
                      style={{ height: 10 + ((i * 7) % 16), animationDelay: `${i * 0.09}s` }}
                    />
                  ))}
                </div>

                <p className="mt-1.5 text-[12px] font-semibold text-ink-3">
                  {!supported ? (
                    <span className="text-accent-deep">Браузер не поддерживает распознавание речи — используйте форму справа</span>
                  ) : listening ? (
                    <span className="text-ok">Слушаю… говорите характеристики</span>
                  ) : (
                    "Нажмите и диктуйте — поля заполнятся сами"
                  )}
                </p>
              </div>

              {/* транскрипт */}
              <div className="mt-3 rounded-[4px] border-2 border-ink/15 bg-white p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3/70">Распознанный текст</span>
                  {transcript && (
                    <button
                      type="button"
                      onClick={() => { reset(); setParsed({}); }}
                      className="flex items-center gap-1 text-[11px] font-bold text-ink-3 hover:text-accent-deep"
                    >
                      <IconEraser size={12} /> очистить
                    </button>
                  )}
                </div>
                <p className={`max-h-[110px] min-h-[54px] overflow-y-auto text-[13px] leading-snug ${transcript ? "text-ink" : "italic text-ink-3/50"}`}>
                  {transcript || EXAMPLE}
                  {listening && <span className="blink text-accent">▍</span>}
                </p>
              </div>
            </div>

            {/* фото */}
            <div className="border-t-2 border-ink/10 p-5">
              <h3 className="mb-3 font-display text-[13px] tracking-[0.18em] text-ink-3">
                02 · ФОТО ЕДИНИЦЫ
              </h3>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickPhoto(e.target.files?.[0])}
              />
              {photo ? (
                <div className="relative overflow-hidden rounded-[4px] border-2 border-ink">
                  <img src={photo} alt="Фото автомобиля" className="aspect-[16/10] w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-ink/85 p-1.5">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-[3px] py-1 text-[11.5px] font-bold text-paper transition-colors hover:bg-steel"
                    >
                      <IconUpload size={13} /> Заменить
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="flex items-center justify-center gap-1.5 rounded-[3px] px-3 py-1 text-[11.5px] font-bold text-paper transition-colors hover:bg-accent"
                    >
                      <IconX size={13} /> Убрать
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); pickPhoto(e.dataTransfer.files?.[0]); }}
                  className={`hatch flex w-full flex-col items-center justify-center gap-2 rounded-[4px] border-2 border-dashed px-4 py-8 transition-all ${
                    dragging ? "border-accent bg-accent/10" : "border-ink/30 bg-white hover:border-ink hover:bg-paper"
                  }`}
                >
                  <IconUpload size={26} className={dragging ? "text-accent" : "text-ink-3"} />
                  <span className="text-[13px] font-bold">Перетащите фото или кликните</span>
                  <span className="text-[11.5px] text-ink-3/70">JPG / PNG · одна фотография на единицу</span>
                </button>
              )}
            </div>
          </div>

          {/* ---------------- правая колонка: поля ---------------- */}
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-[13px] tracking-[0.18em] text-ink-3">
                03 · ХАРАКТЕРИСТИКИ
              </h3>
              <button
                type="button"
                onClick={() => {
                  setDraft(toDraft(initial));
                  setPhoto(initial?.photo ?? null);
                  setErrors({});
                  setParsed({});
                  notify(initial ? "Восстановлены исходные данные единицы" : "Форма очищена");
                }}
                className="text-[11.5px] font-bold text-ink-3 underline-offset-2 hover:text-accent-deep hover:underline"
              >
                {initial ? "Вернуть исходные" : "Сбросить форму"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <Field label="Марка" required error={errors.make}>
                <input list="makes" className={inputCls(errors.make)} placeholder="Toyota"
                  value={draft.make} onChange={(e) => set("make")(e.target.value)} />
              </Field>
              <Field label="Модель" required error={errors.model}>
                <input className={inputCls(errors.model)} placeholder="Camry"
                  value={draft.model} onChange={(e) => set("model")(e.target.value)} />
              </Field>
              <Field label="Год выпуска" required error={errors.year}>
                <input inputMode="numeric" className={inputCls(errors.year)} placeholder="2021"
                  value={draft.year} onChange={(e) => set("year")(e.target.value)} />
              </Field>
              <Field label="Страна выпуска">
                <input list="countries" className={inputCls()} placeholder="Япония"
                  value={draft.country} onChange={(e) => set("country")(e.target.value)} />
              </Field>
              <Field label="Комплектация">
                <input className={inputCls()} placeholder="Элеганс"
                  value={draft.trim} onChange={(e) => set("trim")(e.target.value)} />
              </Field>
              <Field label="Пробег" hint="км">
                <input inputMode="numeric" className={inputCls()} placeholder="45000"
                  value={draft.mileage} onChange={(e) => set("mileage")(e.target.value)} />
              </Field>
              <Field label="Привод">
                {seg<Drive>(draft.drive, DRIVES, (v) => setDraft((d) => ({ ...d, drive: v })))}
              </Field>
              <Field label="Состояние">
                {seg<Condition>(draft.condition, CONDITIONS, (v) => setDraft((d) => ({ ...d, condition: v })))}
              </Field>
              <Field label="Тип коробки">
                {seg<Gearbox>(draft.gearbox, GEARBOXES, (v) => setDraft((d) => ({ ...d, gearbox: v })))}
              </Field>
              <Field label="Объём двигателя">
                <input className={inputCls()} placeholder="2.5 л"
                  value={draft.engine} onChange={(e) => set("engine")(e.target.value)} />
              </Field>
              <Field label="Мощность" hint="л.с.">
                <input inputMode="numeric" className={inputCls()} placeholder="180"
                  value={draft.power} onChange={(e) => set("power")(e.target.value)} />
              </Field>
              <Field label="Тип двигателя">
                {seg<FuelType>(draft.fuel, FUELS, (v) => setDraft((d) => ({ ...d, fuel: v })))}
              </Field>
              <Field label="Цвет">
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-ink/30"
                    style={{ background: draft.color ? swatch(draft.color) : "#fff" }} />
                  <input list="colors" className={`${inputCls()} pl-9`} placeholder="Серебристый"
                    value={draft.color} onChange={(e) => set("color")(e.target.value)} />
                </div>
              </Field>
              <div className="col-span-2">
                <Field label="Цена" required error={errors.price} hint="₽">
                  <input inputMode="numeric" className={inputCls(errors.price)} placeholder="2890000"
                    value={draft.price} onChange={(e) => set("price")(e.target.value)} />
                </Field>
                {!errors.price && Number(draft.price) > 0 && (
                  <p className="mt-1 text-right font-display text-[15px] text-ok">
                    = {Number(draft.price).toLocaleString("ru-RU")} ₽
                  </p>
                )}
              </div>
            </div>

            <datalist id="makes">{MAKES.map((m) => <option key={m} value={m} />)}</datalist>
            <datalist id="countries">{COUNTRIES.map((m) => <option key={m} value={m} />)}</datalist>
            <datalist id="colors">{COLORS.map((m) => <option key={m} value={m} />)}</datalist>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-4">
              <p className="text-[12px] font-medium text-ink-3">
                Поля со звёздочкой <span className="text-accent">*</span> обязательны
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[4px] border-2 border-ink px-5 py-2.5 font-display text-[13px] tracking-wider transition-all hover:bg-ink hover:text-paper"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="group flex items-center gap-2 rounded-[4px] border-2 border-ink bg-accent px-6 py-2.5 font-display text-[13px] tracking-wider text-white shadow-hard-sm transition-all hover:-translate-y-0.5 hover:bg-accent-deep active:translate-y-0"
                >
                  <IconCheck size={16} /> {initial ? "Сохранить изменения" : "Поставить на склад"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
