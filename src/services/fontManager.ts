import { error } from '@ljcoder/smart-sheet/src/utils/log'
import type { App } from 'obsidian'

export interface FontInfo {
  name: string
  file: string
}

/**
 * 将 vault 字体目录的字体转为 Univer 字体配置；按名称去重（同名 woff/woff2 并存时会重复）。
 * 设置页与表格字体下拉共用，保证两处字体列表同源。
 */
export function buildFontConfigs(availableFonts: FontInfo[]): Array<{ value: string, label: string }> {
  const seen = new Set<string>()
  const list: Array<{ value: string, label: string }> = []
  for (const font of availableFonts) {
    if (!font.name || seen.has(font.name))
      continue
    seen.add(font.name)
    list.push({ value: font.name, label: font.name })
  }
  return list
}

export class FontManager {
  app: App
  // 使用 CSSStyleSheet API 代替 document.createElement('style')，避免创建 DOM 元素
  // 记录 sheet 与其 adopt 的 document，确保卸载时能从正确的 document 清理
  loadedFonts = new Map<string, { sheet: CSSStyleSheet, doc: Document }>()

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

    // 必须用目标 document 所属窗口的构造器：主窗口构造的 CSSStyleSheet
    // adopt 到 popout 窗口会抛 NotAllowedError（禁止跨文档共享 constructed stylesheet）
    const sheet = new (activeDocument.defaultView ?? window).CSSStyleSheet()
    sheet.replaceSync(`
@font-face {
  font-family: "${fontName}";
  src: url("${url}") format("${format}");
  font-weight: normal;
  font-style: normal;
}`)
    activeDocument.adoptedStyleSheets = [...activeDocument.adoptedStyleSheets, sheet]

    // 记录 adopt 的 document：卸载时焦点可能已切到别的窗口，必须从原 document 清理
    this.loadedFonts.set(fontName, { sheet, doc: activeDocument })
  }

  unloadFont(fontName: string) {
    const rec = this.loadedFonts.get(fontName)
    if (rec) {
      rec.doc.adoptedStyleSheets = rec.doc.adoptedStyleSheets.filter(s => s !== rec.sheet)
      this.loadedFonts.delete(fontName)
    }
  }

  /** 卸载全部字体：换字体文件夹时调用，避免旧 sheet 遗留在 document 上累积 */
  unloadAllFonts() {
    for (const fontName of [...this.loadedFonts.keys()]) {
      this.unloadFont(fontName)
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
