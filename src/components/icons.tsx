type P = { size?: number; className?: string; strokeWidth?: number };

const base = (p: P) => ({
  width: p.size ?? 16,
  height: p.size ?? 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: p.strokeWidth ?? 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: p.className,
  "aria-hidden": true,
});

export const IconMic = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7" />
  </svg>
);

export const IconStop = (p: P) => (
  <svg {...base(p)}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12.5l5 5L19.5 7" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
    <path d="M12 10v4M12 16.8v.4" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4.5v15M4.5 12h15" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.2 6.5l.9 12.7a1.8 1.8 0 0 0 1.8 1.6h6.2a1.8 1.8 0 0 0 1.8-1.6l.9-12.7" />
    <path d="M10 10.5v6M14 10.5v6" />
  </svg>
);

export const IconPencil = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 5 19 9.5 8.5 20H4v-4.5L14.5 5Z" />
    <path d="m12.5 7 4.5 4.5" />
  </svg>
);

export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m8.5 5 7 7-7 7" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);

export const IconGlobe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.2 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.2-4-8.5s1.4-6.2 4-8.5Z" />
  </svg>
);

export const IconGauge = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.6 19a8.5 8.5 0 1 1 14.8 0" />
    <path d="M12 13.5 16 8" />
    <circle cx="12" cy="14.5" r="1.4" />
  </svg>
);

export const IconGearbox = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="5" r="1.8" />
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="18" cy="5" r="1.8" />
    <circle cx="6" cy="19" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
    <path d="M6 6.8v10.4M12 6.8v10.4M18 6.8V12h-6" />
  </svg>
);

export const IconDrop = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z" />
    <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
  </svg>
);

export const IconBadge = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="9.5" r="6" />
    <path d="m8.8 14.4-1.6 6 4.8-2.6 4.8 2.6-1.6-6" />
    <path d="m12 6.5.9 1.8 2 .3-1.4 1.4.3 2L12 11l-1.8 1 .3-2-1.4-1.4 2-.3.9-1.8Z" />
  </svg>
);

export const IconCarSide = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 16.5v-3.2l1.7-4.1A2 2 0 0 1 6.6 8h7.3a2 2 0 0 1 1.8 1.1L17.5 12l3 .9a1.5 1.5 0 0 1 1 1.4v2.2h-2.6" />
    <circle cx="7.6" cy="16.5" r="1.9" />
    <circle cx="16.2" cy="16.5" r="1.9" />
    <path d="M9.5 16.5h4.8M2.5 16.5h3.2M9 8v4h8.3" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

export const IconSpeaker = (p: P) => (
  <svg {...base(p)}>
    <path d="M11 5 6.5 9H3.5v6h3L11 19V5Z" />
    <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.8 7a7.5 7.5 0 0 1 0 10" />
  </svg>
);

export const IconLogo = (p: P) => (
  <svg {...base({ ...p, strokeWidth: p.strokeWidth ?? 1.7 })}>
    <path d="M6.4 11.5l1.3-3.9c.2-.7.9-1.1 1.6-1.1h5.4c.7 0 1.4.4 1.6 1.1l1.3 3.9" />
    <path d="M5.5 11.5h13c.8 0 1.5.7 1.5 1.5v3.4c0 .5-.4.9-.9.9h-1.4a2.1 2.1 0 0 1-4.2 0h-3a2.1 2.1 0 0 1-4.2 0H5.9c-.5 0-.9-.4-.9-.9V13c0-.8.7-1.5 1.5-1.5Z" />
    <circle cx="7.2" cy="14.3" r="0.4" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="16.8" cy="14.3" r="0.4" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.2 14.3h3.6" />
  </svg>
);

export const IconUpload = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const IconEraser = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 19.5-4.6-4.6a1.6 1.6 0 0 1 0-2.2L12.8 4.3a1.6 1.6 0 0 1 2.2 0l4.7 4.7a1.6 1.6 0 0 1 0 2.2l-7.5 7.5a1.6 1.6 0 0 1-1.1.5H9Z" />
    <path d="m8.2 9.4 6.4 6.4M9 19.5h11" />
  </svg>
);

export const IconBolt = (p: P) => (
  <svg {...base(p)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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

export const IconDrive = (p: P) => (
  <svg {...base(p)}>
    <circle cx="7" cy="7" r="2.4" />
    <circle cx="17" cy="17" r="2.4" />
    <path d="m8.8 8.8 6.4 6.4" />
    <path d="M17 7.2v3.3L7 20.2" opacity="0.55" />
    <path d="M7 7.2v3.3l10 9.7" opacity="0.55" />
  </svg>
);

export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20.2c.7-3.5 3.4-5.4 7-5.4s6.3 1.9 7 5.4" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M2.8 19.6c.6-3 2.9-4.7 6.2-4.7s5.6 1.7 6.2 4.7" />
    <path d="M15.4 5.6a3.2 3.2 0 1 1 0 5.8" />
    <path d="M17.6 15.1c2 .7 3.2 2.2 3.6 4.5" />
  </svg>
);

export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M9.5 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.5" />
    <path d="m15 16.5 4.5-4.5L15 7.5" />
    <path d="M19.5 12H9.5" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="1.5" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    <path d="M12 14.4v2.4" />
  </svg>
);

export const IconDatabase = (p: P) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="5.2" rx="7.5" ry="2.7" />
    <path d="M4.5 5.2v13.6c0 1.5 3.4 2.7 7.5 2.7s7.5-1.2 7.5-2.7V5.2" />
    <path d="M4.5 12c0 1.5 3.4 2.7 7.5 2.7s7.5-1.2 7.5-2.7" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2.8 4.8 5.4v5.2c0 4.6 2.9 8 7.2 10.6 4.3-2.6 7.2-6 7.2-10.6V5.4L12 2.8Z" />
    <path d="m8.9 11.8 2.2 2.2 4-4.4" />
  </svg>
);

export const IconKeyhole = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="9.5" r="5.5" />
    <path d="M12 8.2a1.6 1.6 0 0 1 .6 3.1l-.6 4.2-.6-4.2a1.6 1.6 0 0 1 .6-3.1Z" fill="currentColor" stroke="none" />
    <path d="M9.2 15.6 8 21h8l-1.2-5.4" />
  </svg>
);
