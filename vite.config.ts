import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Copies the three avatar JPGs from the project root into the build output
 * so they're served at /Miral.jpg, /shalini.jpg, /Chathura.jpg in production
 * (matching how they're served in dev by Vite's filesystem).
 */
function copyRootAvatars(): Plugin {
  const avatars = ['Miral.jpg', 'shalini.jpg', 'Chathura.jpg']
  return {
    name: 'copy-root-avatars',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      for (const file of avatars) {
        const src = resolve(__dirname, file)
        if (!existsSync(src)) continue
        const dest = resolve(outDir, file)
        mkdirSync(dirname(dest), { recursive: true })
        copyFileSync(src, dest)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyRootAvatars()]
})
