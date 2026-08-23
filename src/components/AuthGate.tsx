import { useState } from "react";
import type { Session } from "../types";
import {
  BACKEND, loginUser, registerUser, validateAuth,
} from "../sync";
import BrandLogo from "./BrandLogo";
import {
  IconAlert, IconCarSide, IconDatabase, IconKeyhole, IconLock, IconMic,
  IconShield, IconUser, IconUsers,
} from "./icons";

type Mode = "login" | "register";

const FEATURES = [
  { icon: IconMic, title: "Голосовая приёмка", text: "Характеристики диктуются в микрофон — система сама заполняет карточку" },
  { icon: IconDatabase, title: "Общая база данных", text: "Единый склад на сервере: машины видны всем терминалам компании" },
  { icon: IconUsers, title: "Контроль правок", text: "У каждой единицы фиксируется, кто и когда вносил изменения" },
];

const inputCls =
  "w-full rounded-[4px] border-2 border-ink/25 bg-white px-3 py-2.5 text-[14px] font-medium outline-none transition-all placeholder:text-ink-3/40 hover:border-ink/40 focus:border-accent focus:shadow-[3px_3px_0_0_rgba(232,72,12,0.35)]";

export default function AuthGate({ onAuth }: { onAuth: (s: Session) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const v = validateAuth(mode, login, name, password);
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    const res =
      mode === "register"
        ? await registerUser(login, name, password)
        : await loginUser(login, password);
    setBusy(false);
    if (res.ok) {
      onAuth(res.session);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-ink">
      {/* сигнальная полоса */}
      <div className="hazard absolute inset-x-0 top-0 z-10 h-2.5" />

      <div className="grid min-h-full lg:grid-cols-[1.15fr_1fr]">
        {/* ============ левая панель: манифест терминала ============ */}
        <div
          className="relative hidden overflow-hidden border-r-4 border-ink p-10 text-paper lg:flex lg:flex-col"
          style={{
            backgroundImage:
              "linear-gradient(rgba(243,245,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(243,245,246,0.05) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        >
          {/* водяной знак */}
          <div className="anim-drift pointer-events-none absolute -bottom-16 -right-10 text-paper/[0.05]">
            <IconCarSide size={460} strokeWidth={1} />
          </div>
          <div className="anim-spin-slow pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full border-2 border-dashed border-paper/10" />
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full border border-paper/10" />

          <div className="relative flex items-center gap-4">
            <BrandLogo size={58} />
            <div>
              <div className="font-display text-2xl tracking-wide">
                АВТО<span className="text-accent">СКЛАД</span>-24
              </div>
              <div className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.28em] text-paper/45">
                Служебный терминал
              </div>
            </div>
          </div>

          <div className="relative mt-auto mb-auto max-w-lg py-12">
            <div className="mb-5 inline-flex items-center gap-2 border border-paper/25 px-3 py-1.5 font-display text-[11px] tracking-[0.24em] text-paper/80">
              <IconShield size={14} className="text-accent" />
              ДОСТУП ПО УЧЁТНЫМ ЗАПИСЯМ
            </div>
            <h1 className="font-display text-[44px] leading-[1.05] tracking-wide">
              Учёт склада
              <br />
              под <span className="text-accent">контролем</span>
            </h1>
            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-paper/65">
              Каждая машина на складе — с полной карточкой характеристик.
              Каждая правка — с именем сотрудника. Войдите, чтобы продолжить
              работу с терминалом.
            </p>

            <ul className="mt-9 space-y-5">
              {FEATURES.map((f, i) => (
                <li key={f.title} className="group flex items-start gap-4">
                  <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center border-2 border-paper/20 bg-ink-2 text-accent transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-accent group-hover:shadow-[4px_4px_0_0_rgba(232,72,12,0.5)]">
                    <f.icon size={20} />
                  </span>
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-display text-[11px] tracking-[0.2em] text-paper/35">
                        0{i + 1}
                      </span>
                      <span className="font-display text-[15px] tracking-wide">{f.title}</span>
                    </div>
                    <p className="mt-1 max-w-sm text-[13px] leading-snug text-paper/55">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-center justify-between text-[11.5px] text-paper/50">
            <span className="flex items-center gap-2">
              <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-accent" />
              Хранилище: {BACKEND === "sql" ? "MySQL · PHP-API" : "демо-облако Pantry"}
            </span>
            <span className="border border-paper/20 px-2 py-0.5 font-display text-[10px] tracking-[0.22em]">
              ТЕРМИНАЛ 01
            </span>
          </div>
        </div>

        {/* ============ правая панель: форма ============ */}
        <div className="bg-blueprint relative flex items-center justify-center px-4 py-14">
          <div className="anim-pop w-full max-w-md">
            {/* мобильная шапка */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <BrandLogo size={44} />
              <div>
                <div className="font-display text-xl tracking-wide text-ink">
                  АВТО<span className="text-accent">СКЛАД</span>-24
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-ink-3">
                  Служебный терминал
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[6px] border-2 border-ink bg-panel shadow-hard">
              <div className="flex items-center gap-2.5 border-b-2 border-ink bg-ink px-5 py-3.5 text-paper">
                <IconKeyhole size={18} className="text-accent" />
                <span className="font-display text-[13px] tracking-[0.2em]">
                  {mode === "login" ? "ВХОД В СИСТЕМУ" : "НОВЫЙ СОТРУДНИК"}
                </span>
              </div>

              {/* переключатель */}
              <div className="grid grid-cols-2 gap-1 border-b-2 border-ink bg-paper p-1.5">
                {(["login", "register"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`rounded-[3px] py-2 font-display text-[12.5px] tracking-[0.12em] transition-all duration-200 ${
                      mode === m
                        ? "bg-ink text-paper shadow-hard-sm"
                        : "text-ink-3 hover:bg-white hover:text-ink"
                    }`}
                  >
                    {m === "login" ? "Вход" : "Регистрация"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4 p-6">
                {error && (
                  <div className="anim-pop flex items-start gap-2.5 rounded-[4px] border-2 border-accent-deep bg-accent/10 px-3.5 py-2.5 text-[13px] font-semibold leading-snug text-accent-deep">
                    <IconAlert size={16} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
                    <IconUser size={13} /> Логин
                  </span>
                  <input
                    className={inputCls}
                    placeholder="например: i_petrov"
                    autoComplete="username"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    autoFocus
                  />
                </label>

                {mode === "register" && (
                  <label className="anim-rise block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
                      <IconUsers size={13} /> Имя и фамилия
                    </span>
                    <input
                      className={inputCls}
                      placeholder="Иван Петров"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                )}

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
                    <IconLock size={13} /> Пароль
                  </span>
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="минимум 6 символов"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-[4px] border-2 border-ink bg-accent py-3 font-display text-[14px] tracking-[0.14em] text-white shadow-hard-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-deep active:translate-y-0 disabled:cursor-wait disabled:opacity-60"
                >
                  {busy ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <IconShield size={17} className="transition-transform group-hover:scale-110" />
                  )}
                  {busy ? "ПРОВЕРКА…" : mode === "login" ? "ВОЙТИ В ТЕРМИНАЛ" : "СОЗДАТЬ АККАУНТ"}
                </button>

                <div className="space-y-1.5 border-t-2 border-dashed border-ink/15 pt-3.5 text-[12px] leading-snug text-ink-3">
                  {mode === "register" ? (
                    <>
                      <p>
                        <b className="text-ink">Первый пользователь</b> базы автоматически получает
                        роль <span className="font-display text-[10.5px] tracking-wider text-accent-deep">АДМИНИСТРАТОР</span>,
                        остальные — <span className="font-display text-[10.5px] tracking-wider text-steel">ОПЕРАТОР</span>.
                      </p>
                      <p>Логин виден только вам; на карточках машин отображается имя.</p>
                    </>
                  ) : (
                    <p>Нет аккаунта? Переключитесь на «Регистрация» — это займёт полминуты.</p>
                  )}
                  {BACKEND === "pantry" && (
                    <p className="text-warn">
                      Демо-режим: пользователи хранятся локально в браузере. Подключите PHP-API
                      (см. server/README.md) для общей базы.
                    </p>
                  )}
                </div>
              </form>
            </div>

            <p className="mt-4 text-center text-[11.5px] font-medium text-ink-3/80">
              Внутренняя система отдела закупок · доступ только для сотрудников
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
