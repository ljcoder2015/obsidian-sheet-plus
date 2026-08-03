export interface ExcelProSettings {
  showSheetButton: string
  folder: string
  fileLocationMode: string
  fileSubFolder: string
  excelFilenamePrefix: string
  excelFilenameDateTime: string
  sheetHeight: string
  sheetHeightMode: string // 'auto' 自适应 | 'custom' 自定义
  rowHeight: string
  colWidth: string
  authorizationCode: string
  embedLinkShowFooter: string
  embedLinkOpenMode: string
  mobileRenderMode: string
  numberFormatLocal: string
  darkModal: string
  isBigSheet: string
  fontFolder: string
  selectedFontName: string
}

export const DEFAULT_SETTINGS: ExcelProSettings = {
  showSheetButton: 'true',
  folder: '/',
  fileLocationMode: 'specified',
  fileSubFolder: '',
  excelFilenamePrefix: 'Excel ',
  excelFilenameDateTime: 'YYYY-MM-DD HH.mm.ss',
  sheetHeight: '300',
  sheetHeightMode: 'auto', // 默认自适应，与现状嵌入行为一致
  rowHeight: '25',
  colWidth: '100',
  authorizationCode: '',
  embedLinkShowFooter: 'false',
  embedLinkOpenMode: 'split-right',
  numberFormatLocal: 'en',
  mobileRenderMode: 'desktop',
  darkModal: 'light',
  isBigSheet: 'false',
  fontFolder: '',
  selectedFontName: '',
}
