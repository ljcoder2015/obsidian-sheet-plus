export interface ExcelProSettings {
  showSheetButton: string
  folder: string
  excelFilenamePrefix: string
  excelFilenameDateTime: string
  sheetHeight: string
  rowHeight: string
  colWidth: string
  authorizationCode: string
  embedLinkShowFooter: string
  mobileRenderMode: string
  darkModal: string
}

export const DEFAULT_SETTINGS: ExcelProSettings = {
  showSheetButton: 'true',
  folder: '/',
  excelFilenamePrefix: 'Excel ',
  excelFilenameDateTime: 'YYYY-MM-DD HH.mm.ss',
  sheetHeight: '300',
  rowHeight: '25',
  colWidth: '100',
  authorizationCode: '',
  embedLinkShowFooter: 'false',
  mobileRenderMode: 'mobile',
  darkModal: 'light',
}
