import type { Car } from "./types";

/* ================================================================== */
/*  Серверное хранилище склада.                                        */
/*  Используется бесплатный JSON-API Pantry (getpantry.cloud):         */
/*  без регистрации и ключей, с поддержкой CORS. Все терминалы         */
/*  компании читают и пишут одну общую «корзину», поэтому машины,      */
/*  добавленные любым сотрудником, видны всем при каждом посещении.    */
/*                                                                     */
/*  При недоступности сервера терминал продолжает работать на          */
/*  локальных данных (офлайн-режим) и синхронизируется при появлении   */
/*  сети. Конфликты правок решаются по принципу «последний записавший» */
/*  (сравнивается updatedAt), списания разносятся через «надгробия».   */
/* ================================================================== */

const PANTRY_ID = "autosklad24-terminal";
const BASKET = "stock";
const API = `https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${BASKET}`;

/** Интервал подтягивания свежих данных с сервера, мс */
export const POLL_MS = 20_000;

export interface Tombstone {
  id: string;
  at: number;
}

export interface Payload {
  cars: Car[];
  deleted: Tombstone[];
  rev: number;
  savedAt: number;
}

export type SyncStatus = "connecting" | "online" | "saving" | "offline";

/* Код оператора терминала — генерируется один раз на браузер */
export const OPERATOR: string = (() => {
  const KEY = "autosklad24.operator";
  let op = "";
  try {
    op = localStorage.getItem(KEY) ?? "";
  } catch { /* приватный режим */ }
  if (!op) {
    op = "ОП-" + String(Math.floor(1000 + Math.random() * 9000));
    try {
      localStorage.setItem(KEY, op);
    } catch { /* приватный режим */ }
  }
  return op;
})();

/** Забрать актуальное состояние склада. null = корзины ещё нет или сервер недоступен. */
export async function pullStock(): Promise<Payload | null> {
  const res = await fetch(API, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Partial<Payload> | null;
  if (!data || !Array.isArray(data.cars)) return null;
  return {
    cars: data.cars,
    deleted: Array.isArray(data.deleted) ? data.deleted : [],
    rev: Number(data.rev) || 0,
    savedAt: Number(data.savedAt) || 0,
  };
}

/** Полностью заменить корзину на сервере своим состоянием. */
export async function pushStock(p: Payload): Promise<boolean> {
  try {
    const res = await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Слить локальное и серверное состояние:
 *  - единицы объединяются по id, побеждает запись с бóльшим updatedAt;
 *  - списанные id («надгробия») скрывают запись, если списание новее правки;
 *  - надгробия старше 30 дней удаляются, список ограничен 300 шт.
 */
export function mergeStock(
  local: Car[],
  localDel: Tombstone[],
  remote: Payload | null,
): { cars: Car[]; deleted: Tombstone[] } {
  const del = new Map<string, number>();
  for (const d of [...localDel, ...(remote?.deleted ?? [])]) {
    del.set(d.id, Math.max(del.get(d.id) ?? 0, d.at));
  }
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000;

  const byId = new Map<string, Car>();
  for (const c of [...(remote?.cars ?? []), ...local]) {
    const ex = byId.get(c.id);
    if (!ex || (c.updatedAt ?? c.addedAt) >= (ex.updatedAt ?? ex.addedAt)) {
      byId.set(c.id, c);
    }
  }

  const cars: Car[] = [];
  for (const c of byId.values()) {
    const at = del.get(c.id);
    if (at != null && at >= (c.updatedAt ?? c.addedAt)) continue; // списана позже, чем правлена
    cars.push(c);
  }

  const deleted: Tombstone[] = [...del.entries()]
    .filter(([, at]) => at > cutoff)
    .map(([id, at]) => ({ id, at }))
    .slice(-300);

  return { cars, deleted };
}

/** Подпись набора — для быстрого сравнения «изменилось или нет». */
export const stockSignature = (cars: Car[]): string =>
  cars.map((c) => `${c.id}:${c.updatedAt ?? c.addedAt}`).sort().join("|");
