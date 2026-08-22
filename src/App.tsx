import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Car } from "./types";
import { DRIVES, GEARBOXES, fmtKm, fmtMoney, fmtMoneyShort } from "./types";
import { SEED_CARS } from "./seed";
import CarCard from "./components/CarCard";
import IntakeModal from "./components/IntakeModal";
import {
  IconCarSide, IconCheck, IconChevron, IconClock, IconLogo, IconMic,
  IconPlus, IconSearch, IconSpeaker, IconX,
} from "./components/icons";

const STORAGE_KEY = "autosklad24.cars.v1";

const loadCars = (): Car[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data as Car[];
    }
  } catch { /* повреждённое хранилище */ }
  return SEED_CARS;
};

/* ---------- живые мелочи ---------- */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 font-display text-[12px] tracking-[0.14em]">
      <IconClock size={13} className="text-accent" />
      <span>{now.toLocaleTimeString("ru-RU")}</span>
      <span className="hidden text-paper/50 sm:inline">
        {now.toLocaleDateString("ru-RU", { weekday: "short", day: "2-digit", month: "long" })}
      </span>
    </div>
  );
}

function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(v)}</>;
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const Sel = ({
  value, onChange, label, children,
}: { value: string; onChange: (v: string) => void; label: string; children: ReactNode }) => (
  <label className="relative block">
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full cursor-pointer appearance-none rounded-[4px] border-2 border-ink bg-panel py-2 pl-3 pr-8 text-[13px] font-bold outline-none transition-colors hover:bg-white focus:border-accent"
    >
      {children}
    </select>
    <IconChevron size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
  </label>
);

type SortKey = "new" | "cheap" | "expensive" | "mileage" | "year";

interface Toast { id: number; msg: string; kind: "ok" | "err" }

export default function App() {
  const [cars, setCars] = useState<Car[]>(loadCars);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [query, setQuery] = useState("");
  const [fDrive, setFDrive] = useState("");
  const [fBox, setFBox] = useState("");
  const [sort, setSort] = useState<SortKey>("new");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = (msg: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
    } catch {
      notify("Локальное хранилище переполнено: удалите старые фото", "err");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars]);

  const saveCar = (car: Car) => {
    const exists = cars.some((c) => c.id === car.id);
    if (exists) {
      setCars((prev) => prev.map((c) => (c.id === car.id ? car : c)));
      setEditing(null);
      notify(`Данные ${car.make} ${car.model} обновлены`);
    } else {
      setCars((prev) => [car, ...prev]);
      setModal(false);
      notify(`${car.make} ${car.model} принят на склад · ${fmtMoney(car.price)}`);
    }
  };

  const deleteCar = (id: string) => {
    const car = cars.find((c) => c.id === id);
    setCars((prev) => prev.filter((c) => c.id !== id));
    if (car) notify(`${car.make} ${car.model} списан со склада`, "err");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = cars.filter((c) => {
      if (fDrive && c.drive !== fDrive) return false;
      if (fBox && c.gearbox !== fBox) return false;
      if (!q) return true;
      return [c.make, c.model, c.trim, c.country, c.color, String(c.year)]
        .join(" ").toLowerCase().includes(q);
    });
    const by: Record<SortKey, (a: Car, b: Car) => number> = {
      new: (a, b) => b.addedAt - a.addedAt,
      cheap: (a, b) => a.price - b.price,
      expensive: (a, b) => b.price - a.price,
      mileage: (a, b) => a.mileage - b.mileage,
      year: (a, b) => b.year - a.year,
    };
    list = [...list].sort(by[sort]);
    return list;
  }, [cars, query, fDrive, fBox, sort]);

  const total = useMemo(() => cars.reduce((s, c) => s + c.price, 0), [cars]);
  const avgPrice = cars.length ? Math.round(total / cars.length) : 0;
  const avgMileage = cars.length
    ? Math.round(cars.reduce((s, c) => s + c.mileage, 0) / cars.length)
    : 0;
  const awdCount = cars.filter((c) => c.drive === "Полный").length;

  const tickerCars = useMemo(
    () => [...cars].sort((a, b) => b.addedAt - a.addedAt).slice(0, 8),
    [cars],
  );
  const tickerItems = tickerCars.map(
    (c) => `${c.make.toUpperCase()} ${c.model.toUpperCase()} · ${c.year} · ${fmtKm(c.mileage)} · ${fmtMoneyShort(c.price)}`,
  );

  const hasFilters = !!(query || fDrive || fBox);

  return (
    <div className="min-h-screen">
      {/* ======== верхняя служебная полоса ======== */}
      <div className="plate border-b border-paper/15 px-4 py-1.5 text-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper/70">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-ok" />
            Внутренняя система · отдел закупок
          </span>
          <LiveClock />
        </div>
      </div>

      {/* ======== шапка терминала ======== */}
      <header className="plate relative overflow-hidden text-paper">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(233,235,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(233,235,238,0.4) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-5 px-4 py-7 md:py-9">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center border-2 border-accent bg-ink-2 text-accent shadow-hard-sm">
              <IconLogo size={40} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent">
                Терминал приёмки
              </p>
              <h1 className="font-display text-[34px] leading-none tracking-wide md:text-[44px]">
                АВТО<span className="text-accent">СКЛАД</span>-24
              </h1>
              <p className="mt-1.5 max-w-md text-[13px] text-paper/60">
                Учёт автомобилей в наличии. Продиктуйте характеристики — система соберёт
                карточку единицы и поставит её на склад.
              </p>
            </div>
          </div>

          <div className="ml-auto flex flex-col items-stretch gap-2 sm:items-end">
            <button
              onClick={() => setModal(true)}
              className="group relative flex items-center gap-3 border-2 border-accent bg-accent px-7 py-4 font-display text-[16px] tracking-wider text-white shadow-hard transition-all hover:-translate-y-1 hover:bg-accent-deep active:translate-y-0 active:shadow-none"
            >
              <span className="relative">
                <span className="mic-ring absolute inset-0 rounded-full border border-white/70" />
                <IconMic size={22} />
              </span>
              Голосовая приёмка
              <IconPlus size={16} className="opacity-70 transition-transform group-hover:rotate-90" />
            </button>
            <span className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/50">
              или добавьте вручную из каталога
            </span>
          </div>
        </div>
      </header>
      <div className="hazard h-3" />

      {/* ======== сводка ======== */}
      <section className="border-b-2 border-ink bg-panel">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x-2 divide-ink/10 md:grid-cols-4">
          {[
            { label: "Единиц на складе", value: cars.length, fmt: (n: number) => String(n), accent: false },
            { label: "Общая стоимость", value: total, fmt: fmtMoneyShort, accent: true },
            { label: "Средний чек", value: avgPrice, fmt: fmtMoneyShort, accent: false },
            { label: "Средний пробег", value: avgMileage, fmt: (n: number) => fmtKm(n), accent: false },
          ].map((s, i) => (
            <div key={s.label} className={`px-4 py-4 md:px-6 ${i >= 2 ? "border-t-2 border-ink/10 md:border-t-0" : ""}`}>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-3/80">{s.label}</div>
              <div className={`font-display text-[24px] leading-tight md:text-[28px] ${s.accent ? "text-accent-deep" : "text-ink"}`}>
                <CountUp value={s.value} format={s.fmt} />
              </div>
              <div className="text-[11px] font-semibold text-ink-3/70">
                {s.label === "Единиц на складе" ? `полный привод: ${awdCount} ед.` : "по данным склада"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======== лента последних поступлений ======== */}
      {tickerItems.length > 0 && (
        <div className="marquee overflow-hidden border-b-2 border-ink bg-ink py-2 text-paper">
          <div className="marquee-track flex w-max items-center gap-8 pr-8">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-8">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  <IconSpeaker size={14} /> Последние поступления
                </span>
                {tickerItems.map((t, i) => (
                  <span key={i} className="flex items-center gap-8 whitespace-nowrap font-display text-[12px] tracking-[0.1em] text-paper/85">
                    {t}
                    <span className="inline-block h-1.5 w-1.5 rotate-45 bg-accent" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======== панель управления каталогом ======== */}
      <main className="mx-auto max-w-7xl px-4 pb-16">
        <div className="sticky top-3 z-30 mt-5">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2.5 rounded-[5px] border-2 border-ink bg-panel p-3 shadow-hard-sm">
              <div className="flex items-center gap-2 pl-1">
                <h2 className="font-display text-[15px] tracking-wider">КАТАЛОГ</h2>
                <span className="border border-ink bg-paper px-2 py-0.5 font-display text-[12px]">
                  {filtered.length}/{cars.length}
                </span>
              </div>
              <div className="relative min-w-[180px] flex-1">
                <IconSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск: марка, модель, комплектация, страна…"
                  className="w-full rounded-[4px] border-2 border-ink/20 bg-white py-2 pl-9 pr-8 text-[13px] font-medium outline-none transition-colors placeholder:text-ink-3/40 hover:border-ink/40 focus:border-accent"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-accent-deep" title="Очистить">
                    <IconX size={14} />
                  </button>
                )}
              </div>
              <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
                <Sel label="Привод" value={fDrive} onChange={setFDrive}>
                  <option value="">Привод: любой</option>
                  {DRIVES.map((d) => <option key={d} value={d}>{d}</option>)}
                </Sel>
                <Sel label="Коробка" value={fBox} onChange={setFBox}>
                  <option value="">КПП: любая</option>
                  {GEARBOXES.map((g) => <option key={g} value={g}>{g}</option>)}
                </Sel>
                <Sel label="Сортировка" value={sort} onChange={(v) => setSort(v as SortKey)}>
                  <option value="new">Сначала новые</option>
                  <option value="cheap">Цена: дешевле</option>
                  <option value="expensive">Цена: дороже</option>
                  <option value="mileage">Пробег: меньше</option>
                  <option value="year">Год: новее</option>
                </Sel>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setQuery(""); setFDrive(""); setFBox(""); }}
                  className="flex items-center gap-1.5 rounded-[4px] border-2 border-ink px-3 py-2 text-[12px] font-bold transition-colors hover:bg-ink hover:text-paper"
                >
                  <IconX size={13} /> Сброс
                </button>
              )}
              <button
                onClick={() => setModal(true)}
                className="ml-auto flex items-center gap-2 rounded-[4px] border-2 border-ink bg-accent px-4 py-2 text-[12.5px] font-display tracking-wider text-white shadow-hard-sm transition-all hover:-translate-y-0.5 hover:bg-accent-deep active:translate-y-0"
              >
                <IconPlus size={14} /> Принять авто
              </button>
            </div>
          </Reveal>
        </div>

        {/* ======== сетка карточек ======== */}
        {filtered.length > 0 ? (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((car, i) => (
              <Reveal key={car.id} delay={(i % 3) * 90}>
                <CarCard car={car} index={i} onEdit={setEditing} onDelete={deleteCar} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4 border-2 border-dashed border-ink/25 bg-panel/60 px-6 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink/15 text-ink-3">
              <IconCarSide size={44} strokeWidth={1.2} />
            </div>
            <div>
              <p className="font-display text-xl">
                {cars.length === 0 ? "Склад пуст" : "Ничего не найдено"}
              </p>
              <p className="mt-1 max-w-sm text-[13.5px] text-ink-3">
                {cars.length === 0
                  ? "Продиктуйте характеристики первого автомобиля — карточка появится здесь за секунды."
                  : "По заданным фильтрам единиц нет. Сбросьте условия или измените запрос."}
              </p>
            </div>
            {cars.length === 0 ? (
              <button
                onClick={() => setModal(true)}
                className="flex items-center gap-2 border-2 border-ink bg-accent px-6 py-3 font-display text-[14px] tracking-wider text-white shadow-hard-sm transition-all hover:-translate-y-0.5 hover:bg-accent-deep"
              >
                <IconMic size={18} /> Голосовая приёмка
              </button>
            ) : (
              <button
                onClick={() => { setQuery(""); setFDrive(""); setFBox(""); }}
                className="border-2 border-ink px-5 py-2.5 font-display text-[13px] tracking-wider transition-colors hover:bg-ink hover:text-paper"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        )}
      </main>

      {/* ======== подвал ======== */}
      <footer className="plate border-t-4 border-accent text-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-[12px]">
          <span className="flex items-center gap-2 font-display text-[13px] tracking-[0.16em]">
            <IconLogo size={18} className="text-accent" /> АВТОСКЛАД-24
          </span>
          <span className="text-paper/55">
            Данные хранятся локально в браузере терминала · внутренний инструмент, не для публикации
          </span>
          <span className="border border-paper/25 px-2 py-0.5 font-display text-[10px] tracking-[0.2em] text-paper/60">
            v1.0 · ПРИЁМКА
          </span>
        </div>
      </footer>

      {/* ======== модалка приёмки / правки ======== */}
      {modal && <IntakeModal onClose={() => setModal(false)} onSave={saveCar} notify={notify} />}
      {editing && (
        <IntakeModal
          key={editing.id}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={saveCar}
          notify={notify}
        />
      )}

      {/* ======== тосты ======== */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,90vw)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`anim-toast pointer-events-auto flex items-start gap-2.5 rounded-[4px] border-2 border-ink px-3.5 py-3 text-[13px] font-semibold shadow-hard-sm ${
              t.kind === "ok" ? "bg-panel text-ink" : "bg-accent text-white"
            }`}
          >
            <span className={`mt-0.5 shrink-0 ${t.kind === "ok" ? "text-ok" : "text-white"}`}>
              {t.kind === "ok" ? <IconCheck size={15} /> : <IconX size={15} />}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
