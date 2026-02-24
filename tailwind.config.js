/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // ── Safe-area spacing aliases ──────────────────
            spacing: {
                'safe-t': 'env(safe-area-inset-top)',
                'safe-b': 'env(safe-area-inset-bottom)',
                'safe-l': 'env(safe-area-inset-left)',
                'safe-r': 'env(safe-area-inset-right)',
            },
            // ── Unified border radius tokens ──────────────
            borderRadius: {
                'app-sm': '8px',
                'app-md': '12px',
                'app-lg': '16px',
                'app-xl': '20px',
                'app-2xl': '24px',
                'app-card': '1.5rem',
            },
            // ── Unified shadow tokens ─────────────────────
            boxShadow: {
                'app-sm': '0 1px 2px rgba(0,0,0,0.05)',
                'app-md': '0 4px 12px rgba(0,0,0,0.08)',
                'app-lg': '0 8px 30px rgba(0,0,0,0.04)',
                'app-xl': '0 20px 40px rgba(0,0,0,0.06)',
            },
            // ── Unified timing / easing ───────────────────
            transitionTimingFunction: {
                'app-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
                'app-in-out': 'cubic-bezier(0.45, 0, 0.55, 1)',
            },
            transitionDuration: {
                'app-fast': '150ms',
                'app-normal': '250ms',
                'app-slow': '400ms',
            },
            colors: {
                // Minimal modern palette (Slate/Indigo base)
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554',
                },
                // Redirect indigo to primary blue to harmonize existing hardcoded classes
                indigo: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554',
                },
                slate: {
                    850: '#1f2937' // Custom dark bg
                }
            },
            fontFamily: {
                sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
