// import { DataValidationType } from '@univerjs/core'
// import type { FUniver } from '@univerjs/core/facade'

// export interface IKanbanColumn {
//   id: string // 从 sheet 中获取的列 id，比如 A:A
//   hidden: boolean
// }

// export interface IKanbanConfig {
//   sheetId: string
//   groupColumn: string
//   columns: IKanbanColumn[]
//   order: string[]
// }

// /**
//  * 渲染看板的方法
//  * @param content - 用于渲染看板的内容
//  * @param workbook - 表格数据
//  * @param config - 看板配置
//  */

// export function renderKanban(content: HTMLElement, univerAPI: FUniver, config: IKanbanConfig) {
//   // 1. 从 config 中的groupColumn设置的值，从workbook获取列的数据校验，用来当做分组的依据
//   const { groupColumn, sheetId } = config
//   const fWorkbook = univerAPI.getActiveWorkbook()
//   const FWorksheet = fWorkbook.getSheetBySheetId(sheetId)
//   const fRange = FWorksheet.getRange(groupColumn)
//   const dataValidation = fRange.getDataValidation()
//   if (!dataValidation) {
//     return
//   }
//   const rule = dataValidation.rule
//   if (rule.type !== DataValidationType.LIST) {
//     return
//   }
//   const groupData = rule.formula1.split(',')
//   // 2. 从 config 中的columns设置的值，从workbook获取列的数据校验，用来当做看板的列
//   const { columns } = config
//   // 通过配置解析看板参数，通过 data 进行转换，并渲染看板
//   const configObj = JSON.parse(config)

//   console.log('开始渲染看板，内容为:', content)
//   console.log('看板数据为:', data)

//   // 这里可添加实际的看板渲染逻辑
//   // 示例：假设 content 是一个数组，我们简单遍历它
//   if (Array.isArray(content)) {
//     content.forEach((item, index) => {
//       console.log(`渲染第 ${index + 1} 个项目:`, item)
//     })
//   }

//   // 可根据 activeTab 进行不同的渲染逻辑
//   console.log(`基于激活标签页 ${activeTab} 完成看板渲染`)
// }
