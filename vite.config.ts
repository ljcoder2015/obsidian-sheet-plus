import { copyFile, rename, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vite'
import builtins from 'builtin-modules'
import dotenv from 'dotenv'
import pkg from './package.json'

dotenv.config()
let buildDir = process.env.DIST_DIR ?? 'dist'

function generate(isDev?: boolean) {
  if (!isDev)
    buildDir = 'dist'

  if (isDev)
    buildDir = process.cwd()

  return {
    name: 'obsidian',
    async writeBundle() {
      await writeFile(resolve(buildDir, 'manifest.json'), `${JSON.stringify({
        id: pkg.name,
        name: 'Excel Plus',
        version: pkg.version,
        minAppVersion: '1.5.11',
        description: pkg.description,
        author: pkg.author,
        authorUrl: 'https://github.com/ljcoder2015',
        fundingUrl: 'https://ko-fi.com/ljcoder',
        isDesktopOnly: false,
      }, null, 2)}\n`)
      await copyFile(resolve(buildDir, 'manifest.json'), join(process.cwd(), 'manifest.json'))
      rename(resolve(buildDir, 'style.css'), resolve(buildDir, 'styles.css'))
      // eslint-disable-next-line no-console
      console.log('build!')
    },
  }
}

export default defineConfig((_) => {
  const dev = process.argv.includes('--watch')

  return {
    plugins: [
      generate(dev),
      // univerPlugin()
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: buildDir,
      lib: {
        entry: './src/main.ts',
        name: 'main',
        fileName: () => 'main.js',
        formats: [
          'cjs',
        ],
      },
      emptyOutDir: !dev,
      sourcemap: dev ? 'inline' : false,
      target: 'es2018',
      rollupOptions: {
        output: {
          globals: {
            obsidian: 'obsidian',
          },
        },
        external: [
          'obsidian',
          'electron',
          '@codemirror/autocomplete',
          '@codemirror/collab',
          '@codemirror/commands',
          '@codemirror/language',
          '@codemirror/lint',
          '@codemirror/search',
          '@codemirror/state',
          '@codemirror/view',
          '@lezer/common',
          '@lezer/highlight',
          '@lezer/lr',
          ...builtins,
        ],
      },
    },
  }
})
