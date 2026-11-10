const paths = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  skills: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
  repos: <><path d="M4 19.5V5a2 2 0 0 1 2-2h14v19H6a2.5 2.5 0 0 1 0-5h14M8 7h8M8 10h5"/></>,
  projects: <><path d="m14 4 6-1-1 6-9 9-4-4 8-10ZM6 14l-3 1v5l5-1M15 7l2 2"/><path d="m5 20-2 1 1-3"/></>,
  notes: <><path d="M5 3h11l4 4v14H5V3ZM15 3v5h5M8 12h9M8 16h7"/></>,
  settings: <><path d="m10 3-1 3-3 1-3 3 2 2-1 4 3 1 2 4h4l1-3 4-1 3-3-2-2 1-4-3-1-2-4h-5Z"/><circle cx="12" cy="12" r="3"/></>,
  github: <><path d="M9 19c-4 1-4-2-6-2m12 5v-4c0-1 .1-1.4-.5-2 3-.3 6-1.5 6-6a5 5 0 0 0-1.5-3.5c.2-1 .2-2-.5-3.5 0 0-1.2-.4-4 1a13 13 0 0 0-6 0C5.7 2.6 4.5 3 4.5 3c-.7 1.5-.7 2.5-.5 3.5A5 5 0 0 0 2.5 10c0 4.5 3 5.7 6 6-.6.6-.6 1.2-.5 2v4"/></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
  external: <><path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-6"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-2l2 7M4 12l2 7a7 7 0 0 0 12-2"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
  commit: <><circle cx="12" cy="12" r="4"/><path d="M2 12h6m8 0h6"/></>,
  branch: <><circle cx="6" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10m12-10c0 8-12 2-12 10"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-12 4h1m4 0h1"/></>,
  check: <path d="m5 12 4 4L20 5"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  sparkle: <><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"/><path d="m20 2 1 2 2 1"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
  search: <><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
  shield: <><path d="m12 3 9 4v6c0 5-9 9-9 9s-9-4-9-9V7l9-4Z"/><path d="m8 12 3 3 5-6"/></>,
}
export default function Icon({ name, size = 18, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.skills}</svg>
}
