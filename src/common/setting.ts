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
  numberFormatLocal: string
  darkModal: string
  isBigSheet: string
  fontFolder: string
  selectedFontName: string
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
  numberFormatLocal: 'en',
  mobileRenderMode: 'mobile',
  darkModal: 'light',
  isBigSheet: 'false',
  fontFolder: 'fonts',
  selectedFontName: '',
}
