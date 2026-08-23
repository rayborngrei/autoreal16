import { useState } from "react";
import type { Car } from "../types";
import { fmtDate, fmtDateTime, fmtKm, fmtMoney, swatch } from "../types";
import {
  IconBadge, IconBolt, IconCalendar, IconCarSide, IconDrive, IconDrop, IconFuel,
  IconGauge, IconGearbox, IconGlobe, IconPencil, IconTrash,
} from "./icons";

interface Props {
  car: Car;
  index: number;
  onEdit: (car: Car) => void;
  onDelete: (id: string) => void;
}

const Spec = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-2 border-t border-line/80 py-2">
    <span className="mt-0.5 shrink-0 text-ink-3">{icon}</span>
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3/80">{label}</div>
      <div className="truncate text-[13.5px] font-semibold leading-tight">{children}</div>
    </div>
  </div>
);

export default function CarCard({ car, index, onEdit, onDelete }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const hasPhoto = Boolean(car.photo) && !imgErr;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[5px] border-2 border-ink bg-panel shadow-hard-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-hard">
      {/* номерной ярлык */}
      <div className="plate pointer-events-none absolute right-0 top-0 z-20 px-2.5 py-1 font-display text-[10px] tracking-[0.18em] text-paper">
        ЕД. {String(index + 1).padStart(3, "0")}
      </div>

      {/* фото */}
      <div className="relative aspect-[16/10] overflow-hidden border-b-2 border-ink bg-[#dfe3e7]">
        {hasPhoto ? (
          <img
            src={car.photo ?? undefined}
            alt={`${car.make} ${car.model}`}
            loading="lazy"
            onError={() => setImgErr(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="hatch flex h-full w-full items-center justify-center text-ink-3">
            <IconCarSide size={72} strokeWidth={1.1} />
          </div>
        )}
        <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 border border-ink bg-paper px-2 py-0.5 font-display text-[11px] tracking-wider">
          <IconCalendar size={12} /> {car.year}
        </div>
        <div className="absolute bottom-0 left-0 z-10 flex gap-0 border-r-2 border-t-2 border-ink">
          <span className="bg-steel px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white">
            {car.drive} привод
          </span>
          <span className="border-l border-ink/40 bg-petrol px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white">
            {car.gearbox}
          </span>
        </div>
      </div>

      {/* заголовок */}
      <header className="border-b-2 border-ink bg-ink px-4 py-3 text-paper">
        <h3 className="font-display text-lg leading-tight tracking-wide">
          {car.make} <span className="text-accent">{car.model}</span>
        </h3>
        <p className="mt-0.5 flex items-center gap-2 text-[12px] text-paper/70">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full border border-white/50"
            style={{ background: swatch(car.color) }}
          />
          {car.color} · {car.trim || "базовая комплектация"}
        </p>
      </header>

      {/* характеристики */}
      <div className="grid flex-1 grid-cols-2 gap-x-4 px-4 py-3 [&>*:nth-child(-n+2)]:border-t-0">
        <Spec icon={<IconGlobe size={14} />} label="Страна выпуска">{car.country || "—"}</Spec>
        <Spec icon={<IconCalendar size={14} />} label="Год выпуска">{car.year}</Spec>
        <Spec icon={<IconGauge size={14} />} label="Пробег">{fmtKm(car.mileage)}</Spec>
        <Spec icon={<IconBolt size={14} />} label="Мощность">
          {car.power ? `${car.power} л.с.` : "—"}
        </Spec>
        <Spec icon={<IconDrop size={14} />} label="Двигатель">{car.engine || "—"}</Spec>
        <Spec icon={<IconDrive size={14} />} label="Привод">{car.drive}</Spec>
        <Spec icon={<IconFuel size={14} />} label="Тип двигателя">{car.fuel || "—"}</Spec>
        <Spec icon={<IconBadge size={14} />} label="Комплектация">{car.trim || "—"}</Spec>
        <Spec icon={<IconGearbox size={14} />} label="Коробка">{car.gearbox}</Spec>
      </div>

      {/* низ: цена и действия */}
      <footer className="mt-auto flex items-end justify-between gap-3 border-t-2 border-ink bg-paper px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3/80">
            На складе с {fmtDate(car.addedAt)}
            {car.by && <span className="text-steel"> · принял: {car.by}</span>}
          </div>
          {car.lastEditor && (
            <div
              className="mt-0.5 text-[10.5px] font-semibold leading-tight text-petrol"
              title={`Последнее изменение: ${car.lastEditor}${car.lastEditedAt ? ", " + fmtDateTime(car.lastEditedAt) : ""}`}
            >
              Ред.: {car.lastEditor}
              {car.lastEditedAt ? ` · ${fmtDateTime(car.lastEditedAt)}` : ""}
            </div>
          )}
          <div className="font-display text-[22px] leading-tight text-accent-deep">
            {fmtMoney(car.price)}
          </div>
        </div>
        {confirm ? (
          <div className="anim-pop flex shrink-0 items-center gap-1.5 rounded-[4px] border-2 border-ink bg-paper px-2 py-1.5">
            <span className="text-[11px] font-bold">Списать?</span>
            <button
              onClick={() => onDelete(car.id)}
              className="rounded-[3px] bg-accent px-2 py-0.5 text-[11px] font-bold text-white transition-colors hover:bg-accent-deep"
            >
              Да
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="rounded-[3px] border border-ink px-2 py-0.5 text-[11px] font-bold transition-colors hover:bg-ink hover:text-paper"
            >
              Нет
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => onEdit(car)}
              title="Редактировать данные"
              className="rounded-[4px] border-2 border-ink/15 p-2 text-ink-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-steel hover:bg-steel hover:text-white active:translate-y-0"
            >
              <IconPencil size={16} />
            </button>
            <button
              onClick={() => setConfirm(true)}
              title="Списать со склада"
              className="rounded-[4px] border-2 border-ink/15 p-2 text-ink-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white active:translate-y-0"
            >
              <IconTrash size={16} />
            </button>
          </div>
        )}
      </footer>
    </article>
  );
}
