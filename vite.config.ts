import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@hookform/resolvers/ajv',
      'ajv',
      'ajv-formats',
      'ajv-errors',
      '@mui/material',
      '@mui/icons-material/Close',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
});
