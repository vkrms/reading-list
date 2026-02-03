import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Workaround: Vite sometimes doesn't exit after build due to lingering watchers/handles.
// This plugin forces process exit once the bundle is fully written.
function closeBuildPlugin() {
  return {
    name: 'close-build',
    closeBundle() {
      process.exit(0);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), closeBuildPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
