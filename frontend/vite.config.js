import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { execFile } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pickerScript = path.join(__dirname, 'picker.ps1')

function folderPickerPlugin() {
  return {
    name: 'vite-plugin-folder-picker',
    configureServer(server) {
      server.middlewares.use('/api/select-folder', (req, res) => {
        const url = new URL(req.url, 'http://localhost:5173')
        const current = url.searchParams.get('current') || ''

        const args = ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', pickerScript]
        if (current) {
          args.push(current)
        }

        execFile('powershell.exe', args, { timeout: 120000, windowsHide: true }, (err, stdout) => {
          res.setHeader('Content-Type', 'application/json')
          if (err) {
            return res.end(JSON.stringify({ path: null, error: err.message }))
          }
          const chosen = stdout ? stdout.trim() : null
          res.end(JSON.stringify({ path: chosen }))
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), folderPickerPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
