import { defineConfig } from 'vite'
// Force Restart;
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    base: '/AWAKE/', // Correct base for GitHub Pages
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
    },
});
