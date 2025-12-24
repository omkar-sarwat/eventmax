// EventMax Design System - Design Tokens
// Centralized design constants

export const colors = {
  // Primary Brand
  primary: {
    50: '#FFF1F3',
    100: '#FFE4E8',
    200: '#FECDD5',
    300: '#FDA4B3',
    400: '#FB7189',
    500: '#DC3558', // Main brand color
    600: '#C62D4E',
    700: '#A91D3C',
    800: '#8E1B36',
    900: '#7A1A34',
  },

  // Secondary (Purple)
  secondary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED', // Main secondary
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Semantic Colors
  success: {
    light: '#DCFCE7',
    main: '#22C55E',
    dark: '#16A34A',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#2563EB',
  },

  // Neutral/Gray Scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Seat Colors
  seats: {
    available: '#22C55E',
    selected: '#3B82F6',
    reserved: '#F59E0B',
    sold: '#6B7280',
    vip: '#8B5CF6',
    premium: '#EC4899',
    wheelchair: '#06B6D4',
  },

  // Background
  background: {
    primary: '#F9FAFB',
    secondary: '#FFFFFF',
    dark: '#111827',
    darkSecondary: '#1F2937',
  },

  // Text
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    tertiary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem',  // 8px
  3: '0.75rem', // 12px
  4: '1rem',    // 16px
  5: '1.25rem', // 20px
  6: '1.5rem',  // 24px
  8: '2rem',    // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
  20: '5rem',   // 80px
  24: '6rem',   // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  card: '0 2px 8px rgba(0, 0, 0, 0.1)',
  cardHover: '0 8px 25px rgba(0, 0, 0, 0.15)',
  glow: '0 0 40px rgba(220, 53, 88, 0.3)',
  glowSecondary: '0 0 40px rgba(124, 58, 237, 0.3)',
};

export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    display: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modalBackdrop: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
};

export const transitions = {
  fast: '150ms ease',
  normal: '300ms ease',
  slow: '500ms ease',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// Export all as default
const tokens = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  breakpoints,
  zIndex,
  transitions,
};

export default tokens;
