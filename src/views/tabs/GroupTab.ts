import { TabType } from '../../common/constants'

/**
 * 渲染组内容
 * @param content 内容容器元素
 * @param activeTab 当前激活的标签页类型
 */
export function renderGroup(content: HTMLElement, activeTab: TabType): void {
  // 清空内容容器
  content.innerHTML = ''

  // 根据激活的标签页渲染不同内容
  switch (activeTab) {
    case TabType.SHEET:
      renderSheetContent(content)
      break
    case TabType.PIVOT:
      renderPivotContent(content)
      break
    case TabType.KANBAN:
      renderKanbanContent(content)
      break
    case TabType.BI:
      renderBIContent(content)
      break
    default:
      renderDefaultContent(content)
  }
}

/**
 * 渲染表格内容
 * @param content 内容容器元素
 */
function renderSheetContent(content: HTMLElement): void {
  const sheetDiv = document.createElement('div')
  sheetDiv.className = 'sheet-content'
  sheetDiv.textContent = 'Sheet Tab Content'
  content.appendChild(sheetDiv)
}

/**
 * 渲染数据透视表内容
 * @param content 内容容器元素
 */
function renderPivotContent(content: HTMLElement): void {
  const pivotDiv = document.createElement('div')
  pivotDiv.className = 'pivot-content'
  pivotDiv.textContent = 'Pivot Tab Content'
  content.appendChild(pivotDiv)
}

/**
 * 渲染看板内容
 * @param content 内容容器元素
 */
function renderKanbanContent(content: HTMLElement): void {
  const kanbanDiv = document.createElement('div')
  kanbanDiv.className = 'kanban-content'
  kanbanDiv.textContent = 'Kanban Tab Content'
  content.appendChild(kanbanDiv)
}

/**
 * 渲染BI内容
 * @param content 内容容器元素
 */
function renderBIContent(content: HTMLElement): void {
  const biDiv = document.createElement('div')
  biDiv.className = 'bi-content'
  biDiv.textContent = 'BI Tab Content'
  content.appendChild(biDiv)
}

/**
 * 渲染默认内容
 * @param content 内容容器元素
 */
function renderDefaultContent(content: HTMLElement): void {
  const defaultDiv = document.createElement('div')
  defaultDiv.className = 'default-content'
  defaultDiv.textContent = 'Select a tab to view content'
  content.appendChild(defaultDiv)
}
