import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // This allows local network access
    port: 3000,      // 👈 Change 5173 to your desired port here
    strictPort: true // Ensures it fails if port 3000 is already in use
  }
})