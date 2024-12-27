import type { IWorkbookData } from '@univerjs/core'
import { rangeToNumber } from '../utils/data'
/**
 * 获取指定 sheet 中指定 cells 的数据转换成 HTML
 * @param data markdown 文件原始data
 * @param sheet sheet 名称
 * @param cells 选中的cells 格式为: sri-sci:eri-eci 例如 6-6:7-8
 * @returns
 */
export function renderToHtml(data: IWorkbookData,	sheet: string,	range: string): HTMLElement {
  const table = createEl('table')
  let tableWidth = 0

  const sheetData = Object.values(data.sheets).find((item) => {
    return item.name === sheet
  })

  if (sheetData) {
    const rangeNumber = rangeToNumber(range)

    // 记录合并单元格数量
    const mergeMap: Map<string, boolean> = new Map()

    for (let row = rangeNumber.startRow; row <= rangeNumber.endRow; row++) {
      let height = sheetData.defaultRowHeight || 19
      if (sheetData.rowData) {
        if (sheetData.rowData[row]) {
          if (sheetData.rowData[row].ia == 1) {
            // 自动适应高度
            height = sheetData.rowData[row].ah || height
          }
          else {
            // 固定高度
            height = sheetData.rowData[row].h || height
          }
        }
      }

      const tr = createEl('tr', {
        attr: {
          style: `height: ${height}px`,
        },
      })
      table.appendChild(tr)

      for (
        let col = rangeNumber.startCol;
        col <= rangeNumber.endCol;
        col++
      ) {
        // 获取当前行的数据
        if (sheetData.cellData) {
          const cells = sheetData.cellData[row]
          let width = sheetData.defaultColumnWidth || 73

          if (cells) {
            // 如果当前行有数据
            // 获取单元格数据
            const cell = cells[col]

            if (sheetData.columnData) {
              if (sheetData.columnData[col]) {
                // 有更改过列宽
                width = sheetData.columnData[col].w || width
              }
            }

            if (row == rangeNumber.startRow) {
              // 只需要计算第一行的总宽度就行
              tableWidth += width
            }

            if (cell) {
              // 如果单元格有数据展示数据
              const mergeData = sheetData.mergeData?.find(
                (item) => {
                  return (
                    item.startRow === row
                    && item.startColumn === col
                  )
                },
              )
              if (mergeData) {
                // 是否有合并单元格的操作
                const mergeRow
									= mergeData.endRow - mergeData.startRow + 1
                const mergeCol
									= mergeData.endColumn
									- mergeData.startColumn
									+ 1

                // 记录合并的行跟列
                for (let r = 0; r < mergeRow; r++) {
                  const index = `${row + r}-${col}`
                  mergeMap.set(index, true)

                  for (let c = 0; c < mergeCol; c++) {
                    const index = `${row + r}-${col + c}`
                    mergeMap.set(index, true)
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
                // 无合并单元格直接添加
                const td = createEl('td', {
                  text: `${cell.v || ''}`,
                  attr: {
                    style: `width: ${width}px`,
                  },
                })
                tr.appendChild(td)
              }
            }
            else {
              // 添加空白单元格需要判断是否被合并了
              const index = `${row}-${col}`
              if (!mergeMap.get(index)) {
                // 单元格没数据添加空白单元格 & 没有被合并单元格
                const td = createEl('td', {
                  attr: {
                    style: `width: ${width}px`,
                  },
                })
                tr.appendChild(td)
              }
            }
          }
          else {
            if (row == rangeNumber.startRow) {
              // 只需要计算第一行的总宽度就行
              tableWidth += width
            }

            const index = `${row}-${col}`
            // 添加空白单元格需要判断是否被合并了
            if (!mergeMap.get(index)) {
              // 单元格没数据添加空白单元格 & 没有被合并单元格
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
    }
  }

  if (tableWidth > 0)
    table.setAttr('style', `width: ${tableWidth}px`)

  return table
}
