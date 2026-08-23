import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Car } from "./types";
import { DRIVES, GEARBOXES, fmtMoney, fmtKm, fmtTime } from "./types";
import { SEED_CARS } from "./seed";
import {
  BACKEND, POLL_MS, type Payload, type SyncStatus, type Tombstone,
  mergeStock, pullStock, pushStock, stockSignature,
} from "./sync";
import IntakeModal from "./components/IntakeModal";
import BrandLogo from "./components/BrandLogo";
import CarCard from "./components/CarCard";
import {
  IconCarSide, IconCheck, IconChevron, IconClock, IconMic,
  IconPlus, IconSearch, IconSpeaker, IconX,
} from "./components/icons";

const STORAGE_KEY = "autosklad24-cars";
const OP_KEY = "autosklad24-operator";

type Toast = { id: number; msg: string; kind: "ok" | "err" };
type SortKey = "new" | "cheap" | "expensive" | "mileage" | "year";

function loadCars(): Car[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
      if (Array.isArray(arr)) return [];
    }
  } catch { /* повреждённые данные — начнём заново */ }
  return SEED_CARS;
}

function getOperator(): string {
  let op = localStorage.getItem(OP_KEY);
  if (!op) {
    op = `ОП-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(OP_KEY, op);
  }
  return op;
}

/* ---- живые часы ---- */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="flex items-center gap-2 font-display text-[13px] tracking-[0.14em]">
      <IconClock size={14} className="text-accent" />
      {now.toLocaleTimeString("ru-RU")}
    </span>
  );
}

/* ---- появление при скролле ---- */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---- селект ---- */
function Sel({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-[4px] border-2 border-ink/20 bg-white px-3 py-2 pr-8 text-[13px] font-semibold outline-none transition-colors hover:border-ink/40 focus:border-accent"
      >
        {children}
      </select>
      <IconChevron size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-ink-3" />
    </label>
  );
}

export default function App() {
  const [cars, setCars] = useState<Car[]>(loadCars);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [query, setQuery] = useState("");
  const [fDrive, setFDrive] = useState("");
  const [fBox, setFBox] = useState("");
  const [sort, setSort] = useState<SortKey>("new");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sync, setSync] = useState<SyncStatus>("connecting");
  const [lastSync, setLastSync] = useState<number | null>(null);
  const operator = useMemo(getOperator, []);

  const notify = (msg: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };

  /* ================= серверная синхронизация ================= */
  const carsRef = useRef(cars);
  const skipPushRef = useRef(true); // не отправлять первичную отрисовку
  const bootedRef = useRef(false);
  const tombRef = useRef<Tombstone[]>([]); // списанные id
  const revRef = useRef(0);
  const pushTimer = useRef<number | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);

  const doPush = useCallback(async (carsOverride?: Car[], delOverride?: Tombstone[]) => {
    const payload: Payload = {
      cars: carsOverride ?? carsRef.current,
      deleted: delOverride ?? tombRef.current,
      rev: revRef.current + 1,
      savedAt: Date.now(),
    };
    setSync("saving");
    const ok = await pushStock(payload);
    if (ok) {
      revRef.current = payload.rev;
      setSync("online");
      setLastSync(Date.now());
    } else {
      setSync((s) => (s === "saving" ? "offline" : s));
    }
  }, []);

  const schedulePush = useCallback(() => {
    if (pushTimer.current) window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => void doPush(), 700);
  }, [doPush]);

  /** Применить слитые данные, не провоцируя обратную отправку. */
  const applyMerged = useCallback((merged: Car[], deleted: Tombstone[]) => {
    tombRef.current = deleted;
    if (stockSignature(merged) !== stockSignature(carsRef.current)) {
      skipPushRef.current = true;
      setCars(merged);
    }
  }, []);

  /* первичная загрузка с сервера */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let remote: Payload | null = null;
      try {
        remote = await pullStock();
      } catch {
        remote = null;
      }
      if (cancelled) return;
      if (remote) {
        revRef.current = remote.rev;
        const { cars: merged, deleted } = mergeStock(carsRef.current, tombRef.current, remote);
        applyMerged(merged, deleted);
        knownIdsRef.current = new Set(merged.map((c) => c.id));
        setSync("online");
        setLastSync(Date.now());
        void doPush(merged, deleted); // фиксируем результат слияния на сервере
      } else {
        knownIdsRef.current = new Set(carsRef.current.map((c) => c.id));
        // пустое хранилище → инициализируем; недоступен сервер → doPush переведёт в offline
        void doPush();
      }
      bootedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [applyMerged, doPush]);

  /* фоновое обновление: периодически, при возврате на вкладку и при появлении сети */
  useEffect(() => {
    const pull = async () => {
      let remote: Payload | null = null;
      try {
        remote = await pullStock();
      } catch {
        remote = null;
      }
      if (remote === null) {
        setSync((s) => (s === "saving" ? s : "offline"));
        return;
      }
      revRef.current = Math.max(revRef.current, remote.rev);
      const { cars: merged, deleted } = mergeStock(carsRef.current, tombRef.current, remote);
      const fresh = merged.filter((c) => !knownIdsRef.current?.has(c.id));
      applyMerged(merged, deleted);
      knownIdsRef.current = new Set(merged.map((c) => c.id));
      setSync((s) => (s === "saving" ? s : "online"));
      setLastSync(Date.now());
      if (bootedRef.current && fresh.length > 0) {
        const names = fresh.map((c) => `${c.make} ${c.model}`).slice(0, 2).join(", ");
        notify(`С сервера: +${fresh.length} ед. от коллег — ${names}${fresh.length > 2 ? "…" : ""}`);
      }
    };
    const timer = window.setInterval(() => void pull(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void pull();
    };
    const onOnline = () => void pull().then(() => schedulePush());
    const onOffline = () => setSync("offline");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* локальное сохранение + отправка на сервер */
  useEffect(() => {
    carsRef.current = cars;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
    } catch {
      notify("Локальное хранилище переполнено: удалите старые фото", "err");
    }
    if (skipPushRef.current) {
      skipPushRef.current = false;
      return;
    }
    schedulePush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars]);

  /* ================= операции со складом ================= */
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
    tombRef.current = [...tombRef.current.filter((t) => t.id !== id), { id, at: Date.now() }];
    setCars((prev) => prev.filter((c) => c.id !== id));
    if (car) notify(`${car.make} ${car.model} списан со склада`);
  };

  /* ================= выборки ================= */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = cars.filter((c) => {
      if (fDrive && c.drive !== fDrive) return false;
      if (fBox && c.gearbox !== fBox) return false;
      if (!q) return true;
      return [c.make, c.model, c.trim, c.country, c.color, String(c.year)]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const by: Record<SortKey, (a: Car, b: Car) => number> = {
      new: (a, b) => b.addedAt - a.addedAt,
      cheap: (a, b) => a.price - b.price,
      expensive: (a, b) => b.price - a.price,
      mileage: (a, b) => a.mileage - b.mileage,
      year: (a, b) => b.year - a.year,
    };
    arr = [...arr].sort(by[sort]);
    return arr;
  }, [cars, query, fDrive, fBox, sort]);

  const hasFilters = Boolean(query || fDrive || fBox);

  const stats = useMemo(() => {
    const total = cars.reduce((s, c) => s + c.price, 0);
    const avgPrice = cars.length ? total / cars.length : 0;
    const avgMileage = cars.length ? cars.reduce((s, c) => s + c.mileage, 0) / cars.length : 0;
    return { count: cars.length, total, avgPrice, avgMileage };
  }, [cars]);

  const tickerCars = useMemo(
    () => [...cars].sort((a, b) => b.addedAt - a.addedAt).slice(0, 8),
    [cars],
  );
  const tickerItems = tickerCars.map(
    (c) => `${c.make.toUpperCase()} ${c.model.toUpperCase()} · ${c.year} · ${fmtMoney(c.price)}`,
  );

  /* индикатор синхронизации */
  const syncUi: Record<SyncStatus, { label: string; dot: string; cls: string }> = {
    connecting: { label: "Подключение…", dot: "bg-warn", cls: "border-paper/30 text-paper/70" },
    online: {
      label: `Сервер · синхрон${lastSync ? " · " + fmtTime(lastSync) : ""}`,
      dot: "bg-ok",
      cls: "border-ok/60 text-paper",
    },
    saving: { label: "Сохранение…", dot: "bg-accent pulse-dot", cls: "border-accent/70 text-paper" },
    offline: { label: "Офлайн · локально", dot: "bg-accent", cls: "border-accent/70 text-paper" },
  };

  return (
    <div className="bg-blueprint min-h-screen">
      {/* ======== служебная полоса ======== */}
      <div className="hazard h-1.5" />
      <div className="plate">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[11.5px] text-paper/75">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-ok" />
            Внутренняя система · отдел закупок · оператор <b className="text-paper">{operator}</b>
          </span>
          <div className="flex items-center gap-4">
            <span
              className={`hidden items-center gap-1.5 border px-2 py-0.5 font-semibold sm:flex ${syncUi[sync].cls}`}
              title={BACKEND === "sql" ? "Хранилище: база MySQL через PHP-API" : "Хранилище: резервное облако Pantry"}
            >
              <span className={`inline-block h-2 w-2 rounded-full ${syncUi[sync].dot}`} />
              {syncUi[sync].label}
            </span>
            <LiveClock />
          </div>
        </div>
      </div>

      {/* ======== шапка терминала ======== */}
      <header className="plate border-b-4 border-accent">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-6 text-paper">
          <div className="flex items-center gap-4">
            <BrandLogo size={54} />
            <div>
              <h1 className="font-display text-3xl leading-none tracking-wide md:text-4xl">
                АВТО<span className="text-accent">СКЛАД</span>-24
              </h1>
              <p className="mt-1.5 text-[13px] font-medium text-paper/60">
                Терминал приёмки и учёта автомобилей · голосовой ввод характеристик
              </p>
            </div>
          </div>

          {/* сводка */}
          <div className="ml-auto grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
            {[
              { k: "Единиц на складе", v: String(stats.count) },
              { k: "Общая стоимость", v: fmtMoney(stats.total) },
              { k: "Средний чек", v: fmtMoney(Math.round(stats.avgPrice)) },
              { k: "Средний пробег", v: fmtKm(Math.round(stats.avgMileage)) },
            ].map((s) => (
              <div key={s.k} className="border-l-2 border-accent pl-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-paper/50">{s.k}</div>
                <div className="font-display text-lg leading-tight text-paper">{s.v}</div>
              </div>
            ))}
          </div>

          {/* главная кнопка */}
          <button
            onClick={() => setModal(true)}
            className="group flex w-full items-center justify-center gap-3 rounded-[5px] border-2 border-paper bg-accent px-7 py-4 font-display text-[15px] tracking-wider text-white shadow-hard-sm transition-all duration-200 hover:-translate-y-1 hover:bg-accent-deep hover:shadow-hard active:translate-y-0 sm:w-auto"
          >
            <IconMic size={20} className="transition-transform duration-200 group-hover:scale-110" />
            Голосовая приёмка
            <IconPlus size={16} className="-ml-1 opacity-70" />
          </button>
        </div>
      </header>

      {/* ======== бегущая строка поступлений ======== */}
      {tickerItems.length > 0 && (
        <div className="overflow-hidden border-b-2 border-ink bg-ink py-2 text-paper">
          <div className="anim-ticker flex w-max items-center gap-8">
            {[0, 1].map((rep) => (
              <div key={rep} className="flex items-center gap-8" aria-hidden={rep === 1}>
                <span className="flex items-center gap-2 whitespace-nowrap font-display text-[12px] tracking-[0.1em] text-accent">
                  <IconSpeaker size={14} /> ПОСЛЕДНИЕ ПОСТУПЛЕНИЯ
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
                className="ml-auto flex items-center gap-2 rounded-[4px] border-2 border-ink bg-accent px-4 py-2 font-display text-[12.5px] tracking-wider text-white shadow-hard-sm transition-all hover:-translate-y-0.5 hover:bg-accent-deep active:translate-y-0"
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
            <BrandLogo size={20} /> АВТОСКЛАД-24
          </span>
          <span className="text-paper/55">
            Общий склад в базе данных · изменения видны всем терминалам компании
          </span>
          <span className="border border-paper/25 px-2 py-0.5 font-display text-[10px] tracking-[0.2em] text-paper/60">
            v2.0 · SQL
          </span>
        </div>
      </footer>

      {/* ======== модалки ======== */}
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
