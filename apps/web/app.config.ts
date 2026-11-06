import { defineConfig } from '@tanstack/start/config';
import tsConfigPaths from 'vite-tsconfig-paths';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { createTanStackStartPlugin } from '@tanstack/react-start-plugin';

export default defineConfig({
  tsr: {
    appDirectory: 'src',
  },
  routers: {
    ssr: {},
  },
  vite: {
    plugins: [
      TanStackRouterVite({
        autoCodeSplitting: true,
      }),
      createTanStackStartPlugin({ customViteReactPlugin: true }),
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
  },
});
