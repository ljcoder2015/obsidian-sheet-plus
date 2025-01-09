import type { IWorkbookData } from '@univerjs/core'
import { rangeToNumber } from '../utils/data'
/**
 * 获取指定 sheet 中指定 cells 的数据转换成 HTML
 * @param data markdown 文件原始data
 * @param sheet sheet 名称
 * @param cells 选中的cells 格式为: sri-sci:eri-eci 例如 6-6:7-8
 * @returns
 */
export function renderToHtml(data: IWorkbookData, sheet: string, range: string): HTMLElement {
  const table = createEl('table', { cls: 'lj-table' })
  let tableWidth = 0

  const sheetData = Object.values(data.sheets).find((item) => {
    return item.name === sheet
  })

  if (sheetData) {
    const rangeNumber = rangeToNumber(range)

    // 记录合并单元格数量
    const mergeMap: Map<string, boolean> = new Map()

    for (let row = rangeNumber.startRow; row <= rangeNumber.endRow; row++) {
      let height = sheetData.defaultRowHeight || 24
      if (sheetData.rowData && sheetData.rowData[row]) {
        height = sheetData.rowData[row].h || height
      }

      const tr = createEl('tr', {
        attr: {
          style: `height: ${height}px`,
        },
      })
      table.appendChild(tr)

      for (let col = rangeNumber.startCol; col <= rangeNumber.endCol; col++) {
        let width = sheetData.defaultColumnWidth || 88
        if (sheetData.columnData && sheetData.columnData[col]) {
          width = sheetData.columnData[col].w || width
        }

        if (row === rangeNumber.startRow) {
          tableWidth += width
        }

        const cell = sheetData.cellData?.[row]?.[col]
        const isMerged = mergeMap.get(`${row}-${col}`)

        if (cell && !isMerged) {
          const mergeData = sheetData.mergeData?.find(
            item => item.startRow === row && item.startColumn === col,
          )

          if (mergeData) {
            const mergeRow = mergeData.endRow - mergeData.startRow + 1
            const mergeCol = mergeData.endColumn - mergeData.startColumn + 1

            for (let r = 0; r < mergeRow; r++) {
              for (let c = 0; c < mergeCol; c++) {
                mergeMap.set(`${row + r}-${col + c}`, true)
              }
            }

            const td = createEl('td', {
              text: `${cell.v || ''}`,
              attr: {
                style: `width: ${width}px`,
                rowspan: mergeRow,
                colspan: mergeCol,
              },
            })
            tr.appendChild(td)
          }
          else {
            const td = createEl('td', {
              text: `${cell.v || ''}`,
              attr: {
                style: `width: ${width}px`,
              },
            })
            tr.appendChild(td)
          }
        }
        else if (!isMerged) {
          const td = createEl('td', {
            attr: {
              style: `width: ${width}px`,
            },
          })
          tr.appendChild(td)
        }
      }
    }
  }

  if (tableWidth > 0)
    table.setAttr('style', `width: ${tableWidth}px`)

  return table
}
