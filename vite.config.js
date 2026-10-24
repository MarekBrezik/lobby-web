import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { seoPlugin } from './scripts/seo.mjs';

const menuRoute = (server) => {
  server.middlewares.use((request, response, next) => {
    if (request.url?.split('?')[0] === '/menu') request.url = request.url.replace('/menu', '/menu/');
    next();
  });
};

export default defineConfig({
  appType: 'mpa',
  plugins: [{ name: 'menu-route', configureServer: menuRoute, configurePreviewServer: menuRoute }, seoPlugin()],
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('./index.html', import.meta.url)),
        menu: fileURLToPath(new URL('./menu/index.html', import.meta.url)),
      },
    },
  },
});
