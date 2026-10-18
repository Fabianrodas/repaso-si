type P = { size?: number; className?: string };
const base = (size = 18) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const Sun = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></svg>
);
export const Moon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></svg>
);
export const ChevronLeft = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="m15 18-6-6 6-6" /></svg>);
export const ChevronRight = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="m9 18 6-6-6-6" /></svg>);
export const ArrowUp = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M12 19V5M6 11l6-6 6 6" /></svg>);
export const ArrowDown = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M12 5v14M6 13l6 6 6-6" /></svg>);
export const ArrowRight = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const Flag = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>);
export const Download = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>);
export const External = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>);
export const Check = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="m5 12 5 5 9-10" /></svg>);
export const X = ({ size, className }: P) => (<svg {...base(size)} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const Play = ({ size, className }: P) => (<svg {...base(size)} className={className} fill="currentColor" stroke="none"><path d="M8 5.5v13l10.5-6.5L8 5.5Z" /></svg>);
export const Slides = ({ size, className }: P) => (<svg {...base(size)} className={className}><rect x="3" y="4.5" width="18" height="12" rx="1.5" /><path d="M12 16.5V20M8.5 20h7" /></svg>);
export const Grid = ({ size, className }: P) => (<svg {...base(size)} className={className}><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></svg>);
export const GitHub = ({ size = 18, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  </svg>
);
