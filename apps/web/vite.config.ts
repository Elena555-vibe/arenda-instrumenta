import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({ base:process.env.GITHUB_ACTIONS?'/arenda-instrumenta/':'/', plugins:[react(),VitePWA({ registerType:'autoUpdate', manifest:{ name:'Аренда инструмента', short_name:'Аренда', lang:'ru', start_url:'./', display:'standalone', background_color:'#F6F7F1', theme_color:'#315525', icons:[{src:'app-icon.png',sizes:'1254x1254',type:'image/png',purpose:'any'}] }, workbox:{ navigateFallback:'index.html' }})] });
