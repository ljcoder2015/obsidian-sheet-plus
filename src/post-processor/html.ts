import { type IWorkbookData, LifecycleStages } from '@univerjs/core'
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
  log('[renderToHtml]', data, sheet, range)
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
  document.body.append(univerEl)

  try {
    const options = {
      header: false,
      contextMenu: false,
      footer: false,
    }
    const { univerAPI } = createUniver([], options, id, 'desktop', false, true)

    const lifeCycleDisposable = univerAPI.addEvent(univerAPI.Event.LifeCycleChanged, (event) => {
      if (event.stage === LifecycleStages.Steady) {
        lifeCycleDisposable.dispose()
        univerEl.remove()
      }
    })
    const fWorkbook = univerAPI.createWorkbook(data || {})
    const fSheet = fWorkbook.getSheetByName(sheet)

    if (!fSheet) {
      log('[renderToHtml]', 'Sheet not found:', sheet)
      const emptyContainer = createEl('div', {
        cls: 'lj-html-error',
        text: `Sheet "${sheet}" not found`,
      })
      containerEl.appendChild(emptyContainer)
      return containerEl
    }

    const fRange = fSheet.getRange(range)

    if (!fRange) {
      log('[renderToHtml]', 'Invalid range:', range)
      const emptyContainer = createEl('div', {
        cls: 'lj-html-error',
        text: `Invalid range: ${range}`,
      })
      containerEl.appendChild(emptyContainer)
      return containerEl
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    const htmlString = fRange.generateHTML()
    log('[renderToHtml]', 'htmlString', htmlString)

    if (htmlString && typeof htmlString === 'string') {
      let processedHtml = htmlString

      processedHtml = processedHtml.replace(/<google-sheets-html-origin>|<\/google-sheets-html-origin>/g, '')
      processedHtml = processedHtml.replace(/width:\s*0px/g, 'width:100%')

      const htmlContainer = createEl('div', { cls: 'lj-html-table-container' })
      htmlContainer.innerHTML = processedHtml

      const table = htmlContainer.querySelector('table')
      if (table) {
        table.classList.add('lj-html-table')
        const cells = table.querySelectorAll('td, th')
        cells.forEach((cell) => {
          cell.classList.add('lj-html-cell')
        })
      }

      containerEl.appendChild(htmlContainer)
    }
    else {
      const emptyContainer = createEl('div', {
        cls: 'lj-html-empty',
        text: 'No data available',
      })
      containerEl.appendChild(emptyContainer)
    }
  }
  catch (error) {
    log('[renderToHtml]', 'Error generating HTML:', error)
    const errorContainer = createEl('div', {
      cls: 'lj-html-error',
      text: `Error: ${error}`,
    })
    containerEl.appendChild(errorContainer)
  }

  return containerEl
}
