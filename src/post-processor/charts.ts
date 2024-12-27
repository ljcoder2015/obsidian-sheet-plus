import type { IWorkbookData } from '@univerjs/core'
import { randomString } from '../utils/uuid'

/**
 * 创建 Echarts
 * @param data 数据JSON对象
 * @param height 渲染高度
 * @returns HTMLDivElement
 */
export function createEchartsEl(data: IWorkbookData | null, height = 300): HTMLDivElement {
  const id = `echarts-embed-${randomString(6)}`
  const chartsEl = createDiv({
    cls: 'charts-iframe',
    attr: {
      id,
      style: `height: ${height}px`,
    },
  })

  return chartsEl
}
