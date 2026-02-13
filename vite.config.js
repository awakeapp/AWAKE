import { defineConfig } from 'vite'
// Force Restart;
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    base: './', // For GitHub Pages / relative paths
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
