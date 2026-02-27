/**
 * ═══════════════════════════════════════════════════════════
 *  AWAKE — Unified Cross-Platform Design Tokens
 * ═══════════════════════════════════════════════════════════
 *
 *  Single source of truth for animation, spacing, radius,
 *  and shadow values. Consumed by both Tailwind (via config)
 *  and Framer Motion (via direct import).
 *
 *  Goal: ONE app, ONE design language, ZERO platform variance.
 */

// ── Animation Curves ──────────────────────────────────────
// Force identical easing on iOS, Android, and desktop.
// These replace browser-default / OS-adaptive curves.

/** iOS-like deceleration curve — modals, popovers, slide-ins */
export const EASE_OUT = [0.22, 1, 0.36, 1];

/** Symmetric curve — toggles, theme switches */
export const EASE_IN_OUT = [0.45, 0, 0.55, 1];

/** Spring config — onboarding, hero animations */
export const EASE_SPRING = { type: 'spring', damping: 25, stiffness: 300 };

// ── Durations ─────────────────────────────────────────────

/** Fast — modals, popovers, tooltips (150ms) */
export const DURATION_FAST = 0.15;

/** Normal — page transitions, drawer slides (250ms) */
export const DURATION_NORMAL = 0.25;

/** Slow — onboarding, hero, emphasis animations (400ms) */
export const DURATION_SLOW = 0.4;

// ── Prebuilt Transition Objects ───────────────────────────
// Drop-in replacements for inline Framer Motion `transition` props.

export const TRANSITION_FAST = { duration: DURATION_FAST, ease: EASE_OUT };
export const TRANSITION_NORMAL = { duration: DURATION_NORMAL, ease: EASE_OUT };
export const TRANSITION_SLOW = { duration: DURATION_SLOW, ease: EASE_OUT };
export const TRANSITION_SPRING = EASE_SPRING;

// ── Radius Tokens ─────────────────────────────────────────

export const RADIUS = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  card: '1.5rem',
  full: '9999px',
};

// ── Shadow Tokens ─────────────────────────────────────────

export const SHADOW = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 30px rgba(0,0,0,0.04)',
  xl: '0 20px 40px rgba(0,0,0,0.06)',
};

// ── Spacing Tokens ────────────────────────────────────────
// Use these tokens for all margins/paddings to maintain vertical rhythm.
export const SPACING = {
  xs: '8px',   // 8px
  sm: '12px',  // 12px
  md: '16px',  // 16px
  lg: '20px',  // 20px
  xl: '24px',  // 24px
};

export const SPACING_BASE = 8; // 8px base grid
