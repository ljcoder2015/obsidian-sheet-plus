import type { IWorkbookData } from '@univerjs/core'
import { log } from '@ljcoder/smart-sheet/src/utils/log'
import { createUniver } from '../views/univer/setup-univer'
import { randomString } from '../utils/uuid'
/**
 * 获取指定 sheet 中指定 cells 的数据转换成 HTML
 * @param data markdown 文件原始data
 * @param sheet sheet 名称
 * @param cells 选中的cells 格式为: sri-sci:eri-eci 例如 6-6:7-8
 * @returns
 */
export async function renderToHtml(data: IWorkbookData, sheet: string, range: string): Promise<HTMLElement> {
  const id = `univer-embed-${randomString(6)}`
  const containerEl = createDiv({
    cls: 'lj-html-iframe',
  })
  const univerEl = createDiv({
    attr: {
      id,
      style: `display: none;`,
    },
  })
  containerEl.appendChild(univerEl)

  // 使用 Promise 和异步函数来延迟执行 HTML 生成
  const generateHtmlAsync = async () => {
    try {
      // 等待 DOM 更新和 Univer 实例初始化
      await new Promise(resolve => setTimeout(resolve, 100))

      const options = {
        header: false,
        contextMenu: false,
        footer: false,
      }
      const { univerAPI } = createUniver([], options, id, 'desktop', false, true)

      // 等待工作簿创建完成
      await new Promise(resolve => setTimeout(resolve, 100))

      const fWorkbook = univerAPI.createWorkbook(data || {})
      const fSheet = fWorkbook.getSheetByName(sheet)

      // 检查工作表是否存在
      if (!fSheet) {
        log('[renderToHtml]', 'Sheet not found:', sheet)
        const emptyContainer = createEl('div', { text: `Sheet "${sheet}" not found` })
        containerEl.appendChild(emptyContainer)
        return
      }

      const fRange = fSheet.getRange(range)

      // 检查范围是否有效
      if (!fRange) {
        log('[renderToHtml]', 'Invalid range:', range)
        const emptyContainer = createEl('div', { text: `Invalid range: ${range}` })
        containerEl.appendChild(emptyContainer)
        return
      }

      // 等待渲染引擎准备好
      await new Promise(resolve => setTimeout(resolve, 1000))

      const htmlString = fRange.generateHTML()
      log('[renderToHtml]', 'htmlString', htmlString)

      // 将 HTML 字符串转换为 HTMLElement
      if (htmlString && typeof htmlString === 'string') {
        // 处理生成的 HTML 字符串
        let processedHtml = htmlString

        // 移除 <google-sheets-html-origin> 标签
        processedHtml = processedHtml.replace(/<google-sheets-html-origin>|<\/google-sheets-html-origin>/g, '')

        // 修复表格宽度，移除 width:0px 样式
        processedHtml = processedHtml.replace(/width:\s*0px/g, 'width:100%')

        const htmlContainer = createEl('div')
        htmlContainer.innerHTML = processedHtml
        containerEl.appendChild(htmlContainer)
      }
      else {
        const emptyContainer = createEl('div', { text: 'No data available' })
        containerEl.appendChild(emptyContainer)
      }
    }
    catch (error) {
      log('[renderToHtml]', 'Error generating HTML:', error)
      const errorContainer = createEl('div', { text: `Error: ${error}` })
      containerEl.appendChild(errorContainer)
    }
  }

  // 启动异步生成过程
  generateHtmlAsync()

  return containerEl
}
