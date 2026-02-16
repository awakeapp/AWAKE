import { defineConfig } from 'vite'
// Force Restart;
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    base: '/', 
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.dev.html'),
            },
        },
    },
    server: {
        port: 3000,
    },
});
