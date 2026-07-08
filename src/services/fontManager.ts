import { error } from '@ljcoder/smart-sheet/src/utils/log'
import type { App } from 'obsidian'

export interface FontInfo {
  name: string
  file: string
}

export class FontManager {
  app: App
  // 使用 CSSStyleSheet API 代替 document.createElement('style')，避免创建 DOM 元素
  loadedFonts = new Map<string, CSSStyleSheet>()

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
   * 动态加载字体（使用 adoptedStyleSheets，不创建 DOM style 元素）
   */
  loadFont(fontName: string, vaultPath: string) {
    const url = this.app.vault.adapter.getResourcePath(vaultPath)

    if (this.loadedFonts.has(fontName))
      return

    const format = this.getFontFormat(vaultPath)

    const sheet = new CSSStyleSheet()
    sheet.replaceSync(`
@font-face {
  font-family: "${fontName}";
  src: url("${url}") format("${format}");
  font-weight: normal;
  font-style: normal;
}`)
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]

    this.loadedFonts.set(fontName, sheet)
  }

  unloadFont(fontName: string) {
    const sheet = this.loadedFonts.get(fontName)
    if (sheet) {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(s => s !== sheet)
      this.loadedFonts.delete(fontName)
    }
  }

  /**
   * 扫描字体目录（支持 woff/woff2/ttf）
   */
  async scanFontFolder(folder: string): Promise<string[]> {
    // 文件夹路径为空或不存在则静默返回
    if (!folder || !(await this.app.vault.adapter.exists(folder))) {
      return []
    }
    try {
      const list = await this.app.vault.adapter.list(folder)
      return list.files.filter(f =>
        f.endsWith('.woff')
        || f.endsWith('.woff2')
        || f.endsWith('.ttf'),
      )
    }
    catch (err) {
      error('Failed to scan font folder', folder, err)
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
