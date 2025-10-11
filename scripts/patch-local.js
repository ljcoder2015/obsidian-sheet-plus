#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// 检查 .git
const gitFile = path.join(projectRoot, '.git')
if (!fs.existsSync(gitFile)) {
  console.error('❌ 没有找到 .git 文件，请在子模块根目录执行。')
  process.exit(1)
}

// 修正正则，兼容子模块
const content = fs.readFileSync(gitFile, 'utf8')
const match = content.match(/gitdir:\s*(.+)/)
if (!match) {
  console.error('❌ .git 文件格式不对，请确认这是一个子模块或者普通 Git 仓库。')
  process.exit(1)
}

const gitDir = path.resolve(projectRoot, match[1].trim())
console.log('🔹 子模块真实 Git 目录：', gitDir)

// 获取包名参数
const pkg = process.argv[2]
if (!pkg) {
  console.error('❌ 用法：pnpm patch-local <包名>')
  process.exit(1)
}

// Step 1: 创建 patch
console.log(`📦 正在创建 patch：${pkg} ...`)
execSync(`pnpm patch ${pkg}`, { stdio: 'inherit' })

// Step 2: 获取 pnpm 输出的临时 patch 目录
const patchOutput = execSync(`pnpm patch ${pkg}`, { encoding: 'utf-8' })
const tmpDirPattern = /You can now edit the package at:\s+(.+)/
const patchDirMatch = patchOutput.match(tmpDirPattern)

if (!patchDirMatch) {
  console.error('❌ 未能找到 pnpm 临时 patch 目录，请确认 pnpm 输出。')
  process.exit(1)
}

const patchDir = patchDirMatch[1].trim()
console.log(`🧩 临时 patch 目录：${patchDir}`)
console.log('✏️ 请修改临时目录中的文件，修改完成后按回车继续...')

process.stdin.resume()
process.stdin.on('data', () => {
  // Step 3: 使用子模块的 gitDir 提交 patch
  console.log('🔧 正在提交 patch ...')
  execSync(`GIT_DIR="${gitDir}" pnpm patch-commit "${patchDir}"`, { stdio: 'inherit' })
  console.log('✅ 补丁提交成功！')
  process.exit(0)
})
