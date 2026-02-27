import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: '/AWAKE/', // Correct base for GitHub Pages
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                cleanupOutdatedCaches: true,
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
            },
            manifest: {
                short_name: "AWAKE",
                name: "AWAKE | Personal Engine",
                description: "Premium personal management for routines, finance, and vehicles.",
                theme_color: "#020617",
                background_color: "#020617",
                display: "standalone",
                orientation: "portrait-primary",
                start_url: "/AWAKE/",
                scope: "/AWAKE/",
                icons: [
                    {
                        "src": "app-icon.png",
                        "sizes": "192x192",
                        "type": "image/png",
                        "purpose": "any maskable"
                    },
                    {
                        "src": "app-icon.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "any"
                    }
                ],
                categories: ["productivity", "finance", "lifestyle"],
                shortcuts: [
                    {
                        "name": "Finance",
                        "short_name": "Finance",
                        "description": "Quick access to your finances",
                        "url": "/AWAKE/finance",
                        "icons": [{ "src": "app-icon.png", "sizes": "192x192" }]
                    },
                    {
                        "name": "Routine",
                        "short_name": "Routine",
                        "description": "Daily routine tracker",
                        "url": "/AWAKE/routine",
                        "icons": [{ "src": "app-icon.png", "sizes": "192x192" }]
                    }
                ]
            },
            devOptions: {
                enabled: true
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
    },
});
