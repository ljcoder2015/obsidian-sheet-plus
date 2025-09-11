import { copyFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vite'
import builtins from 'builtin-modules'
import dotenv from 'dotenv'
import { univerPlugin } from '@univerjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

dotenv.config()
let buildDir = process.env.DIST_DIR ?? 'dist'

function generate(isDev?: boolean) {
  if (!isDev)
    buildDir = 'dist'

  const cwd = process.cwd()

  // 去掉末尾两级目录
  const parentDir = dirname(dirname(cwd))
  return {
    name: 'obsidian',
    async writeBundle() {
      await writeFile(resolve(buildDir, 'manifest.json'), `${JSON.stringify({
        id: pkg.name,
        name: 'Sheet Plus',
        version: pkg.version,
        minAppVersion: '1.5.11',
        description: pkg.description,
        author: pkg.author,
        authorUrl: 'https://github.com/ljcoder2015',
        fundingUrl: 'https://ko-fi.com/ljcoder',
        isDesktopOnly: false,
      }, null, 2)}\n`)
      await copyFile(resolve(buildDir, 'manifest.json'), join(parentDir, 'manifest.json'))
      await copyFile(resolve(buildDir, 'manifest.json'), join(process.cwd(), 'manifest.json'))
      rename(resolve(buildDir, 'style.css'), resolve(buildDir, 'styles.css'))
      // eslint-disable-next-line no-console
      console.log('build!')
    },
    async closeBundle() {
      // eslint-disable-next-line no-console
      console.log('[-------------]: closeBundle', parentDir, process.cwd())
      await copyFile(resolve(buildDir, 'styles.css'), join(parentDir, 'styles.css'))
      await copyFile(resolve(buildDir, 'main.js'), join(parentDir, 'main.js'))
    },
  }
}

export default defineConfig((_) => {
  const dev = process.argv.includes('--watch')

  return {
    plugins: [
      generate(dev),
      univerPlugin(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      dedupe: [
        '@univerjs/core',
        '@univerjs/sheets',
        '@univerjs/sheets-data-validation',
        'react',
        'react-dom',
      ],
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
      target: 'ESNext',
      rollupOptions: {
        output: {
          globals: {
            obsidian: 'obsidian',
          },
          manualChunks: () => 'main.js',
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
      minify: true,
      // optimizeDeps: {
      //   include: [
      //     `monaco-editor/esm/vs/language/json/json.worker`,
      //     `monaco-editor/esm/vs/language/css/css.worker`,
      //     `monaco-editor/esm/vs/language/html/html.worker`,
      //     `monaco-editor/esm/vs/language/typescript/ts.worker`,
      //     `monaco-editor/esm/vs/editor/editor.worker`,
      //   ],
      // },
    },
  }
})
