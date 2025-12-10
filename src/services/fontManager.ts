import { error } from '@ljcoder/smart-sheet/src/utils/log'
import type { App } from 'obsidian'
import { Notice } from 'obsidian'
import { t } from '../lang/helpers'

export interface FontInfo {
  name: string
  file: string
}

export class FontManager {
  app: App
  loadedFonts = new Map<string, HTMLStyleElement>()

  constructor(app: App) {
    this.app = app
  }

  /**
   * 根据扩展名推导字体格式
   */
  private getFontFormat(file: string): string {
    if (file.endsWith('.woff2'))
      return 'woff2'
    if (file.endsWith('.woff'))
      return 'woff'
    if (file.endsWith('.ttf'))
      return 'truetype'
    return 'truetype'
  }

  /**
   * 动态加载字体
   */
  loadFont(fontName: string, vaultPath: string) {
    const url = this.app.vault.adapter.getResourcePath(vaultPath)

    if (this.loadedFonts.has(fontName))
      return

    const format = this.getFontFormat(vaultPath)

    const style = document.createElement('style')
    style.textContent = `
@font-face {
  font-family: "${fontName}";
  src: url("${url}") format("${format}");
  font-weight: normal;
  font-style: normal;
}`
    document.head.appendChild(style)

    this.loadedFonts.set(fontName, style)
  }

  unloadFont(fontName: string) {
    const el = this.loadedFonts.get(fontName)
    if (el) {
      el.remove()
      this.loadedFonts.delete(fontName)
    }
  }

  /**
   * 扫描字体目录（支持 woff/woff2/ttf）
   */
  async scanFontFolder(folder: string): Promise<string[]> {
    try {
      const list = await this.app.vault.adapter.list(folder)
      return list.files.filter(f =>
        f.endsWith('.woff')
        || f.endsWith('.woff2')
        || f.endsWith('.ttf'),
      )
    }
    catch (err) {
      error('Font folder not found', folder, err)
      new Notice(t('FONT_FOLDER_NOT_FOUND'))
      return []
    }
  }

  /**
   * 自动扫描并加载所有字体
   */
  async loadAllFontsFromFolder(folder: string): Promise<FontInfo[]> {
    const files = await this.scanFontFolder(folder)

    for (const file of files) {
      const filename = file.split('/').pop()!
      const fontName = filename.replace(/\.(woff2?|ttf)$/i, '')
      this.loadFont(fontName, file)
    }

    return files
      .map(f => ({
        name: f.split('/').pop()!.replace(/\.(woff2?|ttf)$/i, ''),
        file: f,
      }))
  }
}
