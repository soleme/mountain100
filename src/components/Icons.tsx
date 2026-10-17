const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...p}>
    <path d="M3 19L9.5 8L13 13.5L15.5 10L21 19Z" />
    <path d="M9.5 8V4L13 5.2L9.5 6.4" />
  </svg>
)
export const IconList = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...p}>
    <path d="M9 6H20M9 12H20M9 18H20" />
    <circle cx="4.5" cy="6" r="1.2" fill="currentColor" />
    <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="4.5" cy="18" r="1.2" fill="currentColor" />
  </svg>
)
export const IconMap = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...p}>
    <path d="M12 21C12 21 19 14.5 19 9.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)
export const IconStamp = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...p}>
    <circle cx="12" cy="10" r="6.5" />
    <path d="M9 10.2L11.2 12.3L15 8.3" />
    <path d="M8.5 15.5L7 21L12 19L17 21L15.5 15.5" />
  </svg>
)
export const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...p}>
    <path d="M15 5L8 12L15 19" />
  </svg>
)
export const IconGear = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15A1.7 1.7 0 0 0 19.7 16.8L19.8 16.9A2 2 0 1 1 17 19.7L16.9 19.6A1.7 1.7 0 0 0 15.1 19.3A1.7 1.7 0 0 0 14 20.9V21A2 2 0 1 1 10 21V20.9A1.7 1.7 0 0 0 8.9 19.3A1.7 1.7 0 0 0 7.1 19.6L7 19.7A2 2 0 1 1 4.2 16.9L4.3 16.8A1.7 1.7 0 0 0 4.6 15A1.7 1.7 0 0 0 3.1 14H3A2 2 0 1 1 3 10H3.1A1.7 1.7 0 0 0 4.6 9A1.7 1.7 0 0 0 4.3 7.2L4.2 7.1A2 2 0 1 1 7 4.3L7.1 4.4A1.7 1.7 0 0 0 8.9 4.7H9A1.7 1.7 0 0 0 10 3.1V3A2 2 0 1 1 14 3V3.1A1.7 1.7 0 0 0 15 4.6A1.7 1.7 0 0 0 16.9 4.3L17 4.2A2 2 0 1 1 19.8 7L19.7 7.1A1.7 1.7 0 0 0 19.4 8.9V9A1.7 1.7 0 0 0 20.9 10H21A2 2 0 1 1 21 14H20.9A1.7 1.7 0 0 0 19.4 15Z" />
  </svg>
)
export const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20L16 16" />
  </svg>
)
export const IconLocate = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2V5M12 19V22M2 12H5M19 12H22" />
  </svg>
)
