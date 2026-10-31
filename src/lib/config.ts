/** Single source for the product name. Renaming is a one-line change (VITE_APP_NAME or the fallback). */
export const APP_NAME: string = import.meta.env.VITE_APP_NAME ?? 'Hirenex';

export const API_URL: string = import.meta.env.VITE_API_URL ?? '';
export const USE_MOCKS: boolean = import.meta.env.VITE_USE_MOCKS !== 'false';
export const DEMO_MODE: boolean = import.meta.env.VITE_DEMO_MODE === 'true';
export const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;
