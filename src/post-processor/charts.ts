import * as echarts from 'echarts'
import type { ICellData, IObjectArrayPrimitiveType, IWorkbookData } from '@univerjs/core'
import { ObjectMatrix, getArrayLength } from '@univerjs/core'
import { randomString } from '../utils/uuid'
import { type RangeIndex, rangeToNumber } from '../utils/data'
/**
 * 创建 Echarts
 * @param data 数据对象
 * @param sheet sheet名称
 * @param range 数据范围
 * @param type 图表类型
 * @param height 渲染高度
 * @returns HTMLDivElement
 */
export function createEchartsEl(
  data: IWorkbookData | null,
  sheet: string,
  range: string,
  type: string,
  height = 300,
): HTMLDivElement {
  const id = `echarts-embed-${randomString(6)}`
  const chartsEl = createDiv({
    cls: 'sheet-iframe',
    attr: {
      id,
      style: `height: ${height}px`,
    },
  })

  setTimeout(() => {
    // 延迟创建 echarts，此时 dom 还没渲染
    const myChart = echarts.init(document.getElementById(id))

    const cellData = getCellData(data, sheet, range, type)
    const option = {
      ...baseOption(type),
      ...cellData,
    }
    myChart.setOption(option)
  }, 1000)

  return chartsEl
}

function baseOption(type: string) {
  if (type === 'chart-pie' || type === 'chart-ring-pie') {
    return {
      title: {
        left: 'center',
      },
      legend: {},
      tooltip: {
        trigger: 'item',
      },
      grid: {
        left: '3%',
        right: '3%',
        bottom: '3%',
        containLabel: true,
      },
    }
  }
  return {
    title: {
      left: 'center',
    },
    legend: {},
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
    },
    yAxis: {
      type: 'value',
    },
  }
}

/**
 * data 转换成只显示 range 部分
 * @param {JSON} data 源数据
 * @param {string} sheet sheet名称
 * @param {string} range 范围，格式为 A1:B6
 * @param {string} type 图表类型
 */
export function getCellData(
  data: IWorkbookData | null,
  sheet: string,
  range: string,
  type: string,
) {
  if (data == null)
    return null

  const currentSheet = Object.values(data.sheets).find((item) => {
    return item.name === sheet
  })
  if (!currentSheet)
    return null

  const rangeNumber = rangeToNumber(range)
  const cellDataMatrix = new ObjectMatrix(currentSheet.cellData)
  const rangeMatrix = cellDataMatrix.getSlice(rangeNumber.startRow, rangeNumber.endRow, rangeNumber.startCol, rangeNumber.endCol)

  const titleMatrix = rangeMatrix.getRow(rangeNumber.startRow) || {}
  const xAxisData = getXAxis(titleMatrix)

  const series = []
  if (isPie(type)) {
    // 饼图只能绘制第一行，多个饼图不能叠加渲染
    const seriesObj = getPieSeries(rangeMatrix, rangeNumber, type)
    series.push(seriesObj)
  }
  else {
    for (let i = rangeNumber.startRow + 1; i <= rangeNumber.endRow; i++) {
      const row = rangeMatrix.getRow(i) || {}
      const seriesObj = getSeries(row, rangeNumber.startCol, type)
      series.push(seriesObj)
    }
  }

  if (isPie(type)) {
    return {
      series,
    }
  }

  return {
    xAxis: {
      type: 'category',
      data: xAxisData,
    },
    series,
  }
}

function isPie(type) {
  return type === 'chart-ring-pie' || type === 'chart-pie'
}

function getXAxis(row: IObjectArrayPrimitiveType<ICellData>) {
  const length = getArrayLength(row)

  const titles = []
  for (let i = 0; i < length; i++) {
    const item = row[i]
    if (item) {
      titles.push(item.v as string || 'undefined')
    }
  }
  return titles
}

function getPieSeries(rangeMatrix: ObjectMatrix<ICellData>, rangeNumber: RangeIndex, type: string) {
  const titleMatrix = rangeMatrix.getRow(rangeNumber.startRow) || {}
  const dataMatrix = rangeMatrix.getRow(rangeNumber.startRow + 1) || {}

  const pieData = []
  for (let i = rangeNumber.startCol + 1; i <= rangeNumber.endCol; i++) {
    pieData.push({
      name: titleMatrix[i].v || 'undefined',
      value: dataMatrix[i].v || 0,
    })
  }
  const series: { [key: string]: any } = {
    type: 'pie',
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
    data: pieData,
  }

  if (type === 'chart-ring-pie') {
    series.radius = ['30%', '60%']
  }

  return series
}

function getSeries(row: IObjectArrayPrimitiveType<ICellData>, start: number, type: string) {
  const length = getArrayLength(row)
  const series: { [key: string]: any } = {
    type: getChartType(type),
  }
  if (type === 'chart-bar-racing') {
    series.stack = 'x'
  }
  if (type === 'chart-area') {
    series.stack = 'x'
    series.areaStyle = {}
  }

  const name = row[start].v || 'undefine'
  series.name = name
  const data = []
  for (let i = start + 1; i < length; i++) {
    const item = row[i]
    if (item) {
      data.push(item.v || 0)
    }
  }
  series.data = data

  return series
}

function getChartType(type: string) {
  switch (type) {
    case 'chart-bar':
      return 'bar'
    case 'chart-bar-racing':
      return 'bar'
    case 'chart-line':
      return 'line'
    case 'chart-area':
      return 'line'
    case 'chart-pie':
      return 'pie'
    case 'chart-ring-pie':
      return 'pie'
    default:
      return 'bar'
  }
}
