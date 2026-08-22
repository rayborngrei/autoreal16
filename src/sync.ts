import type { Car } from "./types";

/* =========================================================================
   ХРАНИЛИЩЕ СКЛАДА
   -------------------------------------------------------------------------
   1) ОСНОВНОЙ РЕЖИМ — SQL-база на вашем хостинге через PHP-API.
      Заполните SQL_API_URL (см. server/README.md) — и все терминалы будут
      работать с общей базой MySQL.

   2) РЕЗЕРВНЫЙ РЕЖИМ — бесплатное облако Pantry (getpantry.cloud),
      работает сразу, без настройки. Замените PANTRY_ID на свой
      (создаётся за минуту на https://getpantry.cloud).
   ========================================================================= */

/** Полный адрес PHP-API, например "https://avtosklad.example.ru/api/api.php".
 *  Если сайт и API лежат на одном домене, подойдёт относительный путь "api/api.php".
 *  Пустая строка = использовать резервное облако Pantry. */
export const SQL_API_URL = "";

/** Ключ доступа, если вы задали API_KEY в server/config.php. */
export const SQL_API_KEY = "";

/** Резервное облако (используется, пока SQL_API_URL пуст). */
const PANTRY_ID = "e3f6c9a2-4d17-4b8e-9f05-autosklad24demo";
const BASKET = "stock";

/** Как часто терминалы опрашивают сервер (мс). */
export const POLL_MS = 20_000;

const PANTRY_BASE = `https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${BASKET}`;

export type Backend = "sql" | "pantry";
export const BACKEND: Backend = SQL_API_URL ? "sql" : "pantry";

export interface Tombstone { id: string; at: number }
export interface Payload {
  cars: Car[];
  deleted: Tombstone[];
  rev: number;
  savedAt: number;
}
export type SyncStatus = "connecting" | "online" | "saving" | "offline";

const timeout = (ms: number) =>
  new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));

async function fetchRace(url: string, init?: RequestInit): Promise<Response> {
  return Promise.race([fetch(url, init), timeout(12000)]);
}

/* ------------------------------------------------------------------ */
/*  Нормализация ответа сервера                                        */
/* ------------------------------------------------------------------ */
function normalizePayload(raw: any): Payload | null {
  if (!raw || typeof raw !== "object") return null;
  let cars = raw.cars;
  if (!Array.isArray(cars)) {
    cars = Object.values(raw.cars ?? {});
  }
  if (!Array.isArray(cars)) return null;
  let deleted: Tombstone[] = [];
  if (Array.isArray(raw.deleted)) {
    deleted = raw.deleted.filter((d: any) => d && typeof d.id === "string");
  } else if (raw.deleted && typeof raw.deleted === "object") {
    deleted = Object.entries(raw.deleted).map(([id, at]) => ({
      id,
      at: Number(at) || Date.now(),
    }));
  }
  return {
    cars,
    deleted,
    rev: Number(raw.rev) || 0,
    savedAt: Number(raw.savedAt) || 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Чтение / запись                                                    */
/* ------------------------------------------------------------------ */
export async function pullStock(): Promise<Payload | null> {
  if (BACKEND === "sql") {
    const res = await fetchRace(`${SQL_API_URL}?do=pull`);
    if (!res.ok) throw new Error(`SQL API: HTTP ${res.status}`);
    return normalizePayload(await res.json());
  }
  // Pantry: отсутствующая корзина возвращает 400 — это "пустой склад"
  const res = await fetchRace(PANTRY_BASE);
  if (!res.ok) return null;
  return normalizePayload(await res.json());
}

export async function pushStock(payload: Payload): Promise<boolean> {
  if (BACKEND === "sql") {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (SQL_API_KEY) headers["X-Api-Key"] = SQL_API_KEY;
      const res = await fetchRace(`${SQL_API_URL}?do=push`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) return false;
      const j = await res.json().catch(() => ({}));
      return j?.ok === true;
    } catch {
      return false;
    }
  }
  try {
    const res = await fetchRace(PANTRY_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Слияние локальных и серверных данных                               */
/* ------------------------------------------------------------------ */
export function mergeStock(
  local: Car[],
  localDeleted: Tombstone[],
  remote: Payload,
): { cars: Car[]; deleted: Tombstone[] } {
  const deletedIds = new Set([
    ...localDeleted.map((d) => d.id),
    ...remote.deleted.map((d) => d.id),
  ]);
  const tsOf = (c: Car) => Math.max(c.updatedAt ?? 0, c.addedAt);

  const map = new Map<string, Car>();
  for (const c of remote.cars) {
    if (c && typeof c.id === "string") map.set(c.id, c);
  }
  for (const c of local) {
    const r = map.get(c.id);
    if (!r || tsOf(c) > tsOf(r)) map.set(c.id, c);
  }

  const cars = [...map.values()]
    .filter((c) => !deletedIds.has(c.id))
    .sort((a, b) => b.addedAt - a.addedAt);

  const deletedMap = new Map<string, number>();
  for (const d of [...remote.deleted, ...localDeleted]) {
    deletedMap.set(d.id, Math.max(deletedMap.get(d.id) ?? 0, d.at));
  }

  return { cars, deleted: [...deletedMap.entries()].map(([id, at]) => ({ id, at })) };
}

/** Быстрая сигнатура набора машин — чтобы не перерисовывать без изменений. */
export function stockSignature(cars: Car[]): string {
  return cars
    .map((c) => `${c.id}:${Math.max(c.updatedAt ?? 0, c.addedAt)}`)
    .join("|");
}
