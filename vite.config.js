import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const menuRoute = (server) => {
  server.middlewares.use((request, response, next) => {
    if (request.url?.split('?')[0] === '/menu') request.url = request.url.replace('/menu', '/menu/');
    next();
  });
};

export default defineConfig({
  plugins: [{ name: 'menu-route', configureServer: menuRoute, configurePreviewServer: menuRoute }],
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('./index.html', import.meta.url)),
        menu: fileURLToPath(new URL('./menu/index.html', import.meta.url)),
      },
    },
  },
});
