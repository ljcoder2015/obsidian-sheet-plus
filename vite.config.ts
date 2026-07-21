import { copyFile, rename, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vite'
import dotenv from 'dotenv'
import { univerPlugin } from '@univerjs/vite-plugin'

import pkg from './package.json'

dotenv.config()
let buildDir = process.env.DIST_DIR ?? 'dist'

// 清理产物中的动态 script 创建（来自 setimmediate/immediate 的 IE6-8 polyfill）
function securePlugin() {
  return {
    name: 'secure-plugin',
    renderChunk(code: string) {
      // 将 "onreadystatechange"in e.createElement("script") 条件改为 false，走安全的 setTimeout 回退
      code = code.replace(
        /"onreadystatechange"in \w+\.createElement\("script"\)/g,
        '!1',
      )
      // 兜底：将剩余的 .createElement("script") 替换为无害的 .createElement("div")
      code = code.replace(
        /\.createElement\("script"\)/g,
        '.createElement("div")',
      )
      return code
    },
  }
}

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
      }, null, 2)}
`)
      await copyFile(resolve(buildDir, 'manifest.json'), join(parentDir, 'manifest.json'))
      await copyFile(resolve(buildDir, 'manifest.json'), join(process.cwd(), 'manifest.json'))
      // 检查style.css文件是否存在
      const styleCssPath = resolve(buildDir, 'style.css')
      const stylesCssPath = resolve(buildDir, 'styles.css')
      try {
        await rename(styleCssPath, stylesCssPath)
        // eslint-disable-next-line no-console
        console.log('Renamed style.css to styles.css')
      }
      catch (error) {
        console.error('Error renaming style.css:', error)
      }
      // eslint-disable-next-line no-console
      console.log('build!')
    },
    async closeBundle() {
      // eslint-disable-next-line no-console
      console.log('[-------------]: closeBundle', parentDir, process.cwd())
      const stylesCssPath = resolve(buildDir, 'styles.css')
      const mainJsPath = resolve(buildDir, 'main.js')
      try {
        await copyFile(stylesCssPath, join(parentDir, 'styles.css'))
        // eslint-disable-next-line no-console
        console.log('Copied styles.css to parent directory')
      }
      catch (error) {
        console.error('Error copying styles.css:', error)
      }
      try {
        await copyFile(mainJsPath, join(parentDir, 'main.js'))
        // eslint-disable-next-line no-console
        console.log('Copied main.js to parent directory')
      }
      catch (error) {
        console.error('Error copying main.js:', error)
      }
      // exceljs CJS 模块的 require 需要相对路径解析，通过符号链接映射到实际文件
      const exceljsLibDir = resolve(cwd, '../../packages/exceljs/lib')
      const subDirs = ['doc', 'xlsx', 'csv', 'utils', 'stream']
      for (const dir of subDirs) {
        const linkPath = join(parentDir, dir)
        const targetPath = join(exceljsLibDir, dir)
        try {
          await symlink(targetPath, linkPath, 'dir')
          // eslint-disable-next-line no-console
          console.log(`Linked: ${dir} -> ${targetPath}`)
        }
        catch (error: any) {
          if (error.code !== 'EEXIST') {
            console.error(`Error symlinking ${dir}:`, error.message)
          }
        }
      }
    },
  }
}

export default defineConfig((_) => {
  const dev = process.argv.includes('--watch')

  return {
    plugins: [
      generate(dev),
      univerPlugin(),
      securePlugin(),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        tsconfigRaw: '{"compilerOptions": {"experimentalDecorators": true}}',
      },
      dedupe: [
        '@univerjs/core',
        '@univerjs/sheets',
        '@univerjs/sheets-data-validation',
        'react',
        'react-dom',
      ],
    },
    build: {
      esbuild: {
        tsconfigRaw: '{"compilerOptions": {"experimentalDecorators": true}}',
      },
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
          'http',
          'buffer',
          'crypto',
          'events',
          'fs',
          'stream',
          'string_decoder',
          'timers',
          'util',
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
        ],
      },
      minify: true,
    },
  }
})
