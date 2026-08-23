import { useState } from "react";
import { IconLogo } from "./icons";

/** Фирменный знак компании: подгружается с сервера sklad.autoreal16.ru.
 *  Если файл недоступен — подстраховывается встроенной эмблемой. */
const LOGO_URL = "https://sklad.autoreal16.ru/logo_autosklad24.svg";

interface Props {
  size?: number;
  className?: string;
}

export default function BrandLogo({ size = 52, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <IconLogo size={size} className={className} />;
  }

  return (
    <img
      src={LOGO_URL}
      alt="Логотип АвтоСклад-24"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      style={{ width: size, height: size, objectFit: "contain" }}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
