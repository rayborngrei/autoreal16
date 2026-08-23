import type { Car, Session, User } from "./types";

/* =========================================================================
   ХРАНИЛИЩЕ СКЛАДА + АУТЕНТИФИКАЦИЯ
   -------------------------------------------------------------------------
   1) ОСНОВНОЙ РЕЖИМ — SQL-база на вашем хостинге через PHP-API.
      Заполните SQL_API_URL (см. server/README.md) — и все терминалы будут
      работать с общей базой MySQL: пользователи, сессии, склад.

   2) РЕЗЕРВНЫЙ РЕЖИМ — бесплатное облако Pantry (getpantry.cloud).
      Работает сразу, без настройки; пользователи в этом режиме ведутся
      локально в браузере (демо).
   ========================================================================= */

/** Полный адрес PHP-API, например "https://sklad.autoreal16.ru/api/api.php".
 *  Пустая строка = резервное облако Pantry. */
export const SQL_API_URL = "";

/** Ключ доступа, если задан API_KEY в server/config.php. */
export const SQL_API_KEY = "";

/** Интервал фонового опроса склада, мс. */
export const POLL_MS = 20_000;

const PANTRY_ID = "e3f6c9a2-4d17-4b8e-9f05-autosklad24demo";
const BASKET = "stock";
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

export type AuthResult = { ok: true; session: Session } | { ok: false; error: string };

/* ------------------------------------------------------------------ */
/*  Сессия (общая для обоих режимов)                                   */
/* ------------------------------------------------------------------ */
const SESSION_KEY = "autosklad24-session";

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s && typeof s.token === "string" && s.user && typeof s.user.login === "string") {
      return s as Session;
    }
  } catch { /* noop */ }
  return null;
}

function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* noop */ }
}

export function logoutUser() {
  const s = getSession();
  saveSession(null);
  if (BACKEND === "sql" && s) {
    // сообщаем серверу, чтобы закрыть сессию (не критично при ошибке)
    const headers: Record<string, string> = { "X-Auth-Token": s.token };
    if (SQL_API_KEY) headers["X-Api-Key"] = SQL_API_KEY;
    fetch(`${SQL_API_URL}?do=logout`, { method: "POST", headers }).catch(() => undefined);
  }
}

/* ------------------------------------------------------------------ */
/*  Валидация полей (общая для клиента и локального режима)            */
/* ------------------------------------------------------------------ */
export function validateAuth(
  mode: "login" | "register",
  login: string,
  name: string,
  password: string,
): string | null {
  const l = login.trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(l))
    return "Логин: 3–20 символов — латиница, цифры и «_»";
  if (mode === "register") {
    const n = name.trim();
    if (n.length < 2 || n.length > 40) return "Укажите имя и фамилию (2–40 символов)";
  }
  if (password.length < 6) return "Пароль: минимум 6 символов";
  return null;
}

/* ------------------------------------------------------------------ */
/*  Локальный (демо) режим: пользователи в localStorage                */
/* ------------------------------------------------------------------ */
const LOCAL_USERS_KEY = "autosklad24-local-users";

interface LocalUser extends User { hash: string }

function readLocalUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr;
  } catch { /* noop */ }
  return [];
}

function writeLocalUsers(users: LocalUser[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch { /* noop */ }
}

async function hashPassword(p: string): Promise<string> {
  const src = "as24::" + p;
  try {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(src));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch { /* недоступно вне https — используем запасной вариант */ }
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) | 0;
  return "djb2:" + (h >>> 0).toString(16);
}

function makeToken(): string {
  try {
    const a = new Uint8Array(24);
    crypto.getRandomValues(a);
    return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 14);
  }
}

/* ------------------------------------------------------------------ */
/*  Регистрация и вход                                                 */
/* ------------------------------------------------------------------ */
export async function registerUser(
  login: string,
  name: string,
  password: string,
): Promise<AuthResult> {
  const err = validateAuth("register", login, name, password);
  if (err) return { ok: false, error: err };

  if (BACKEND === "sql") {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (SQL_API_KEY) headers["X-Api-Key"] = SQL_API_KEY;
      const res = await fetch(`${SQL_API_URL}?do=register`, {
        method: "POST",
        headers,
        body: JSON.stringify({ login: login.trim(), name: name.trim(), password }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok && j.token && j.user) {
        const session: Session = { token: j.token, user: j.user };
        saveSession(session);
        return { ok: true, session };
      }
      return { ok: false, error: j?.error || "Сервер отклонил регистрацию" };
    } catch {
      return { ok: false, error: "Нет связи с сервером — попробуйте позже" };
    }
  }

  // локальный демо-режим
  const users = readLocalUsers();
  const l = login.trim().toLowerCase();
  if (users.some((u) => u.login === l))
    return { ok: false, error: "Такой логин уже занят" };
  const user: LocalUser = {
    id: "u-" + makeToken().slice(0, 10),
    login: l,
    name: name.trim(),
    role: users.length === 0 ? "admin" : "operator",
    hash: await hashPassword(password),
  };
  writeLocalUsers([...users, user]);
  const { hash: _h, ...pub } = user;
  const session: Session = { token: makeToken(), user: pub };
  saveSession(session);
  return { ok: true, session };
}

export async function loginUser(login: string, password: string): Promise<AuthResult> {
  const err = validateAuth("login", login, "", password);
  if (err && !err.startsWith("Пароль")) return { ok: false, error: err };

  if (BACKEND === "sql") {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (SQL_API_KEY) headers["X-Api-Key"] = SQL_API_KEY;
      const res = await fetch(`${SQL_API_URL}?do=login`, {
        method: "POST",
        headers,
        body: JSON.stringify({ login: login.trim(), password }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok && j.token && j.user) {
        const session: Session = { token: j.token, user: j.user };
        saveSession(session);
        return { ok: true, session };
      }
      return { ok: false, error: j?.error || "Неверный логин или пароль" };
    } catch {
      return { ok: false, error: "Нет связи с сервером — попробуйте позже" };
    }
  }

  // локальный демо-режим
  const users = readLocalUsers();
  const l = login.trim().toLowerCase();
  const found = users.find((u) => u.login === l);
  if (!found) return { ok: false, error: "Пользователь не найден — зарегистрируйтесь" };
  if (found.hash !== (await hashPassword(password)))
    return { ok: false, error: "Неверный пароль" };
  const { hash: _h, ...pub } = found;
  const session: Session = { token: makeToken(), user: pub };
  saveSession(session);
  return { ok: true, session };
}

/** Проверка сессии при загрузке страницы (только для SQL-режима). */
export async function checkSession(): Promise<boolean> {
  if (BACKEND !== "sql") return true;
  const s = getSession();
  if (!s) return false;
  try {
    const headers: Record<string, string> = { "X-Auth-Token": s.token };
    if (SQL_API_KEY) headers["X-Api-Key"] = SQL_API_KEY;
    const res = await fetch(`${SQL_API_URL}?do=me`, { headers });
    if (!res.ok) return false;
    const j = await res.json().catch(() => null);
    if (j?.ok && j.user) {
      saveSession({ token: s.token, user: j.user });
      return true;
    }
    return false;
  } catch {
    return true; // сервер временно недоступен — не выкидываем пользователя
  }
}

/* ------------------------------------------------------------------ */
/*  HTTP-помощники                                                     */
/* ------------------------------------------------------------------ */
const timeout = (ms: number) =>
  new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));

async function fetchRace(url: string, init?: RequestInit): Promise<Response> {
  return Promise.race([fetch(url, init), timeout(12000)]);
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  const s = getSession();
  if (s) h["X-Auth-Token"] = s.token;
  if (SQL_API_KEY) h["X-Api-Key"] = SQL_API_KEY;
  return h;
}

export class ApiAuthError extends Error {}

/** Реакция на истёкшую сессию (выставляется из App). */
let onAuthExpiredCb: (() => void) | null = null;
export function onAuthExpired(cb: () => void) {
  onAuthExpiredCb = cb;
}

/* ------------------------------------------------------------------ */
/*  Нормализация ответа склада                                         */
/* ------------------------------------------------------------------ */
function normalizePayload(raw: any): Payload | null {
  if (!raw || typeof raw !== "object") return null;
  let cars = raw.cars;
  if (!Array.isArray(cars)) cars = Object.values(raw.cars ?? {});
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
/*  Чтение / запись склада                                             */
/* ------------------------------------------------------------------ */
export async function pullStock(): Promise<Payload | null> {
  if (BACKEND === "sql") {
    const res = await fetchRace(`${SQL_API_URL}?do=pull`, { headers: authHeaders() });
    if (res.status === 401) {
      onAuthExpiredCb?.();
      throw new ApiAuthError("session expired");
    }
    if (!res.ok) throw new Error(`SQL API: HTTP ${res.status}`);
    return normalizePayload(await res.json());
  }
  const res = await fetchRace(PANTRY_BASE);
  if (!res.ok) return null;
  return normalizePayload(await res.json());
}

export async function pushStock(payload: Payload): Promise<boolean> {
  if (BACKEND === "sql") {
    try {
      const res = await fetchRace(`${SQL_API_URL}?do=push`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        onAuthExpiredCb?.();
        return false;
      }
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

export function stockSignature(cars: Car[]): string {
  return cars
    .map((c) => `${c.id}:${Math.max(c.updatedAt ?? 0, c.addedAt)}`)
    .join("|");
}
