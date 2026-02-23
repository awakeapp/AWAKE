// Feature flags - driven by Vite environment variables
// To disable the Ramadan module entirely, set VITE_RAMADAN_MODE=false in .env

export const RAMADAN_MODE = import.meta.env.VITE_RAMADAN_MODE === 'true';
