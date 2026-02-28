import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default ({ mode }: { mode: string }) => {
  // load .env files so VITE_API_URL can be used here if set
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:8081'

  return defineConfig({
    plugins: [tailwindcss()],
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      proxy: {
        // Proxy /api/* to the backend (rewriting /api prefix)
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  })
}



