import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (p: P) => {
  const { size = 18, ...rest } = p;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
};

export const IconLogo = (p: P) => (
  <svg {...base(p)} strokeWidth={1.6}>
    <path d="M12 2.2 20.5 7v10L12 21.8 3.5 17V7L12 2.2Z" />
    <circle cx="12" cy="12" r="5.2" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <path d="M12 6.8v3.8M7.4 14.6l3.3-1.9M16.6 14.6l-3.3-1.9" />
  </svg>
);

export const IconMic = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2M8.8 21.2h6.4" />
  </svg>
);

export const IconStop = (p: P) => (
  <svg {...base(p)}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const IconUpload = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 16.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-2.5" />
    <path d="M12 15V4.5M7.8 8.7 12 4.5l4.2 4.2" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 6.5h15M9.5 6V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V6" />
    <path d="M6.5 6.5 7.3 19a1.8 1.8 0 0 0 1.8 1.7h5.8A1.8 1.8 0 0 0 16.7 19l.8-12.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.2" />
    <path d="m20 20-4.6-4.6" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.8 4.6 4.6L19.5 6.8" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4.5v15M4.5 12h15" />
  </svg>
);

export const IconGauge = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.6 18.5a8.5 8.5 0 1 1 14.8 0" />
    <path d="m12 14 3.6-4.6" />
    <circle cx="12" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const IconGearbox = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="5" r="1.7" />
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="18" cy="5" r="1.7" />
    <circle cx="6" cy="19" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
    <path d="M6 6.7v10.6M12 6.7v10.6M18 6.7V12H6" />
  </svg>
);

export const IconEngine = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 7V4.5h5V7M9.5 7v2" />
    <path d="M5.5 9h10l2 2.5h3v6h-2.5l-2 2.5h-9L4 17.5v-6l1.5-2.5Z" />
    <path d="M2 12h2M20 12h2" />
  </svg>
);

export const IconDrive = (p: P) => (
  <svg {...base(p)}>
    <circle cx="7" cy="7" r="2.4" />
    <circle cx="17" cy="17" r="2.4" />
    <path d="m8.8 8.8 6.4 6.4" />
    <path d="M17 7.2v3.3L7 20.2" opacity="0.55" />
    <path d="M7 7.2v3.3l10 9.7" opacity="0.55" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="1.8" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </svg>
);

export const IconGlobe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.7 2.3 4 5.2 4 8.5s-1.3 6.2-4 8.5c-2.7-2.3-4-5.2-4-8.5s1.3-6.2 4-8.5Z" />
  </svg>
);

export const IconDrop = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z" />
    <path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.7" />
  </svg>
);

export const IconBadge = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.2 14 5.5l3-.4.9 2.9 2.9.9-.4 3 2.3 2-2.3 2 .4 3-2.9.9-.9 2.9-3-.4-2 2.3-2-2.3-3 .4-.9-2.9-2.9-.9.4-3-2.3-2 2.3-2-.4-3 2.9-.9.9-2.9 3 .4 2-2.3Z" strokeWidth={1.4} />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.2l3.4 2" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 22 20H2L12 3.5Z" />
    <path d="M12 10v4.5" />
    <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconSpeaker = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z" />
    <path d="M15.5 9a4.3 4.3 0 0 1 0 6M18 6.8a7.6 7.6 0 0 1 0 10.4" />
  </svg>
);

export const IconCarSide = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 16.5v-3l2-1 2.5-4a1.6 1.6 0 0 1 1.4-.8h6.2a1.6 1.6 0 0 1 1.4.8l2.5 4 2 1v3h-2.6" />
    <path d="M9.4 16.5h5.2" />
    <circle cx="7" cy="16.5" r="2.2" />
    <circle cx="17" cy="16.5" r="2.2" />
    <path d="M6.8 11.7h4.7V8.2H9.2L6.8 11.7ZM16.3 11.7h-4.8V8.2h2.4l2.4 3.5Z" strokeWidth={1.4} />
  </svg>
);

export const IconRuble = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 20V4.5h4.5a3.8 3.8 0 0 1 0 7.6H9" />
    <path d="M6.8 15.5H13" />
  </svg>
);

export const IconPencil = (p: P) => (
  <svg {...base(p)}>
    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
  </svg>
);

export const IconBolt = (p: P) => (
  <svg {...base(p)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const IconEraser = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 19.5-4.6-4.6a1.6 1.6 0 0 1 0-2.2L12.8 4.3a1.6 1.6 0 0 1 2.2 0l4.7 4.7a1.6 1.6 0 0 1 0 2.2l-7.5 7.5a1.6 1.6 0 0 1-1.1.5H9Z" />
    <path d="m8.2 9.4 6.4 6.4M9 19.5h11" />
  </svg>
);

export const IconFuel = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 21V5.5A1.5 1.5 0 0 1 6.5 4h6A1.5 1.5 0 0 1 14 5.5V21" />
    <path d="M3.5 21h12" />
    <path d="M6.8 7.5h4.4V11H6.8z" />
    <path d="M14 10.5h2a1.5 1.5 0 0 1 1.5 1.5v5.5a1.25 1.25 0 0 0 2.5 0V9.6a2 2 0 0 0-.6-1.4L17.6 6.4" />
  </svg>
);


