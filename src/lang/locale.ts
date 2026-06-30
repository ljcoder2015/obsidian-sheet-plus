import { moment } from 'obsidian'
import { LocaleType, Tools } from '@univerjs/core'

import SheetsTableUIenUS from '@univerjs/sheets-table-ui/lib/es/locale/en-US'
import SheetsTableUIfaIR from '@univerjs/sheets-table-ui/lib/es/locale/fa-IR'
import SheetsTableUIfrFR from '@univerjs/sheets-table-ui/lib/es/locale/fr-FR'
import SheetsTableUIruRU from '@univerjs/sheets-table-ui/lib/es/locale/ru-RU'
import SheetsTableUIviVN from '@univerjs/sheets-table-ui/lib/es/locale/vi-VN'
import SheetsTableUIZhCN from '@univerjs/sheets-table-ui/lib/es/locale/zh-CN'
import SheetsTableUIZhTW from '@univerjs/sheets-table-ui/lib/es/locale/zh-TW'

import SheetsNoteUIenUS from '@univerjs/sheets-note-ui/lib/es/locale/en-US'
import SheetsNoteUIfaIR from '@univerjs/sheets-note-ui/lib/es/locale/fa-IR'
import SheetsNoteUIfrFR from '@univerjs/sheets-note-ui/lib/es/locale/fr-FR'
import SheetsNoteUIviVN from '@univerjs/sheets-note-ui/lib/es/locale/vi-VN'
import SheetsNoteUIruRU from '@univerjs/sheets-note-ui/lib/es/locale/ru-RU'
import SheetsNoteUIZhCN from '@univerjs/sheets-note-ui/lib/es/locale/zh-CN'
import SheetsNoteUIZhTW from '@univerjs/sheets-note-ui/lib/es/locale/zh-TW'

import outgoingLinkenUS from '@ljcoder/sheets-outgoing-link-ui/locale/en-US'
import outgoingLinkfaIR from '@ljcoder/sheets-outgoing-link-ui/locale/fa-IR'
import outgoingLinkfrFR from '@ljcoder/sheets-outgoing-link-ui/locale/fr-FR'
import outgoingLinkruRU from '@ljcoder/sheets-outgoing-link-ui/locale/ru-RU'
import outgoingLinkviVN from '@ljcoder/sheets-outgoing-link-ui/locale/vi-VN'
import outgoingLinkzhCN from '@ljcoder/sheets-outgoing-link-ui/locale/zh-CN'
import outgoingLinkzhTW from '@ljcoder/sheets-outgoing-link-ui/locale/zh-TW'

import embedLinkenUS from '@ljcoder/embed-link-ui/locale/en-US'
import embedLinkfaIR from '@ljcoder/embed-link-ui/locale/fa-IR'
import embedLinkfrFR from '@ljcoder/embed-link-ui/locale/fr-FR'
import embedLinkruRU from '@ljcoder/embed-link-ui/locale/ru-RU'
import embedLinkviVN from '@ljcoder/embed-link-ui/locale/vi-VN'
import embedLinkzhCN from '@ljcoder/embed-link-ui/locale/zh-CN'
import embedLinkzhTW from '@ljcoder/embed-link-ui/locale/zh-TW'
import importExportenUS from '@ljcoder/import-export/locale/en-US'
import importExportfaIR from '@ljcoder/import-export/locale/fa-IR'
import importExportfrFR from '@ljcoder/import-export/locale/fr-FR'
import importExportruRU from '@ljcoder/import-export/locale/ru-RU'
import importExportviVN from '@ljcoder/import-export/locale/vi-VN'
import importExportzhCN from '@ljcoder/import-export/locale/zh-CN'
import importExportzhTW from '@ljcoder/import-export/locale/zh-TW'

import saveenUS from '@ljcoder/save/locale/en-US'
import savefaIR from '@ljcoder/save/locale/fa-IR'
import savefrFR from '@ljcoder/save/locale/fr-FR'
import saveruRU from '@ljcoder/save/locale/ru-RU'
import saveviVN from '@ljcoder/save/locale/vi-VN'
import savezhCN from '@ljcoder/save/locale/zh-CN'
import savezhTW from '@ljcoder/save/locale/zh-TW'

import localImageenUS from '@ljcoder/local-image/locale/en-US'
import localImagezhCN from '@ljcoder/local-image/locale/zh-CN'
import localImagezhTW from '@ljcoder/local-image/locale/zh-TW'
import localImagefrFR from '@ljcoder/local-image/locale/fr-FR'
import localImageruRU from '@ljcoder/local-image/locale/ru-RU'
import localImageviVN from '@ljcoder/local-image/locale/vi-VN'
import localImagefaIR from '@ljcoder/local-image/locale/fa-IR'

import designenUS from '@univerjs/design/lib/es/locale/en-US'
import designfaIR from '@univerjs/design/lib/es/locale/fa-IR'
import designfrFR from '@univerjs/design/lib/es/locale/fr-FR'
import designruRU from '@univerjs/design/lib/es/locale/ru-RU'
import designviVN from '@univerjs/design/lib/es/locale/vi-VN'
import designzhCN from '@univerjs/design/lib/es/locale/zh-CN'
import designzhTW from '@univerjs/design/lib/es/locale/zh-TW'
import docsuienUS from '@univerjs/docs-ui/lib/es/locale/en-US'
import docsuifaIR from '@univerjs/docs-ui/lib/es/locale/fa-IR'
import docsuifrFR from '@univerjs/docs-ui/lib/es/locale/fr-FR'
import docsuiruRU from '@univerjs/docs-ui/lib/es/locale/ru-RU'
import docsuiviVN from '@univerjs/docs-ui/lib/es/locale/vi-VN'
import docsuizhCN from '@univerjs/docs-ui/lib/es/locale/zh-CN'
import docsuizhTW from '@univerjs/docs-ui/lib/es/locale/zh-TW'
import drawinguienUS from '@univerjs/drawing-ui/lib/es/locale/en-US'
import drawinguifaIR from '@univerjs/drawing-ui/lib/es/locale/fa-IR'
import drawinguifrFR from '@univerjs/drawing-ui/lib/es/locale/fr-FR'
import drawinguiruRU from '@univerjs/drawing-ui/lib/es/locale/ru-RU'
import drawinguiviVN from '@univerjs/drawing-ui/lib/es/locale/vi-VN'
import drawinguizhCN from '@univerjs/drawing-ui/lib/es/locale/zh-CN'
import drawinguizhTW from '@univerjs/drawing-ui/lib/es/locale/zh-TW'
import findreplaceenUS from '@univerjs/find-replace/lib/es/locale/en-US'
import findreplacefaIR from '@univerjs/find-replace/lib/es/locale/fa-IR'
import findreplacefrFR from '@univerjs/find-replace/lib/es/locale/fr-FR'
import findreplaceruRU from '@univerjs/find-replace/lib/es/locale/ru-RU'
import findreplaceviVN from '@univerjs/find-replace/lib/es/locale/vi-VN'
import findreplacezhCN from '@univerjs/find-replace/lib/es/locale/zh-CN'
import findreplacezhTW from '@univerjs/find-replace/lib/es/locale/zh-TW'
import sheetsconditionalformattinguienUS from '@univerjs/sheets-conditional-formatting-ui/lib/es/locale/en-US'
import sheetsconditionalformattinguifaIR from '@univerjs/sheets-conditional-formatting-ui/lib/es/locale/fa-IR'
import sheetsconditionalformattinguifrFR from '@univerjs/sheets-conditional-formatting-ui/lib/es/locale/fr-FR'
import sheetsconditionalformattinguiruRU from '@univerjs/sheets-conditional-formatting-ui/lib/es/locale/ru-RU'
import sheetsconditionalformattinguiviVN from '@univerjs/sheets-conditional-formatting-ui/lib/es/locale/vi-VN'
import sheetsconditionalformattinguizhCN from '@univerjs/sheets-conditional-formatting-ui/lib/es/locale/zh-CN'
import sheetsconditionalformattinguizhTW from '@univerjs/sheets-conditional-formatting-ui/lib/es/locale/zh-TW'
import sheetscrosshairhighlightenUS from '@univerjs/sheets-crosshair-highlight/lib/es/locale/en-US'
import sheetscrosshairhighlightfaIR from '@univerjs/sheets-crosshair-highlight/lib/es/locale/fa-IR'
import sheetscrosshairhighlightfrFR from '@univerjs/sheets-crosshair-highlight/lib/es/locale/fr-FR'
import sheetscrosshairhighlightruRU from '@univerjs/sheets-crosshair-highlight/lib/es/locale/ru-RU'
import sheetscrosshairhighlightviVN from '@univerjs/sheets-crosshair-highlight/lib/es/locale/vi-VN'
import sheetscrosshairhighlightzhCN from '@univerjs/sheets-crosshair-highlight/lib/es/locale/zh-CN'
import sheetscrosshairhighlightzhTW from '@univerjs/sheets-crosshair-highlight/lib/es/locale/zh-TW'
import sheetsdatavalidationuienUS from '@univerjs/sheets-data-validation-ui/lib/es/locale/en-US'
import sheetsdatavalidationuifaIR from '@univerjs/sheets-data-validation-ui/lib/es/locale/fa-IR'
import sheetsdatavalidationuifrFR from '@univerjs/sheets-data-validation-ui/lib/es/locale/fr-FR'
import sheetsdatavalidationuiruRU from '@univerjs/sheets-data-validation-ui/lib/es/locale/ru-RU'
import sheetsdatavalidationuiviVN from '@univerjs/sheets-data-validation-ui/lib/es/locale/vi-VN'
import sheetsdatavalidationuizhCN from '@univerjs/sheets-data-validation-ui/lib/es/locale/zh-CN'
import sheetsdatavalidationuizhTW from '@univerjs/sheets-data-validation-ui/lib/es/locale/zh-TW'
import sheetsdrawinguienUS from '@univerjs/sheets-drawing-ui/lib/es/locale/en-US'
import sheetsdrawinguifaIR from '@univerjs/sheets-drawing-ui/lib/es/locale/fa-IR'
import sheetsdrawinguifrFR from '@univerjs/sheets-drawing-ui/lib/es/locale/fr-FR'
import sheetsdrawinguiruRU from '@univerjs/sheets-drawing-ui/lib/es/locale/ru-RU'
import sheetsdrawinguiviVN from '@univerjs/sheets-drawing-ui/lib/es/locale/vi-VN'
import sheetsdrawinguizhCN from '@univerjs/sheets-drawing-ui/lib/es/locale/zh-CN'
import sheetsdrawinguizhTW from '@univerjs/sheets-drawing-ui/lib/es/locale/zh-TW'
import sheetsfilteruienUS from '@univerjs/sheets-filter-ui/lib/es/locale/en-US'
import sheetsfilteruifaIR from '@univerjs/sheets-filter-ui/lib/es/locale/fa-IR'
import sheetsfilteruifrFR from '@univerjs/sheets-filter-ui/lib/es/locale/fr-FR'
import sheetsfilteruiruRU from '@univerjs/sheets-filter-ui/lib/es/locale/ru-RU'
import sheetsfilteruiviVN from '@univerjs/sheets-filter-ui/lib/es/locale/vi-VN'
import sheetsfilteruizhCN from '@univerjs/sheets-filter-ui/lib/es/locale/zh-CN'
import sheetsfilteruizhTW from '@univerjs/sheets-filter-ui/lib/es/locale/zh-TW'

// v0.25.0: 新增 locale 导出包
import datavalidationenUS from '@univerjs/data-validation/lib/es/locale/en-US'
import datavalidationfaIR from '@univerjs/data-validation/lib/es/locale/fa-IR'
import datavalidationfrFR from '@univerjs/data-validation/lib/es/locale/fr-FR'
import datavalidationruRU from '@univerjs/data-validation/lib/es/locale/ru-RU'
import datavalidationviVN from '@univerjs/data-validation/lib/es/locale/vi-VN'
import datavalidationzhCN from '@univerjs/data-validation/lib/es/locale/zh-CN'
import datavalidationzhTW from '@univerjs/data-validation/lib/es/locale/zh-TW'

import shtdatavalidationenUS from '@univerjs/sheets-data-validation/lib/es/locale/en-US'
import shtdatavalidationfaIR from '@univerjs/sheets-data-validation/lib/es/locale/fa-IR'
import shtdatavalidationfrFR from '@univerjs/sheets-data-validation/lib/es/locale/fr-FR'
import shtdatavalidationruRU from '@univerjs/sheets-data-validation/lib/es/locale/ru-RU'
import shtdatavalidationviVN from '@univerjs/sheets-data-validation/lib/es/locale/vi-VN'
import shtdatavalidationzhCN from '@univerjs/sheets-data-validation/lib/es/locale/zh-CN'
import shtdatavalidationzhTW from '@univerjs/sheets-data-validation/lib/es/locale/zh-TW'

import shtfilterenUS from '@univerjs/sheets-filter/lib/es/locale/en-US'
import shtfilterfaIR from '@univerjs/sheets-filter/lib/es/locale/fa-IR'
import shtfilterfrFR from '@univerjs/sheets-filter/lib/es/locale/fr-FR'
import shtfilterruRU from '@univerjs/sheets-filter/lib/es/locale/ru-RU'
import shtfilterviVN from '@univerjs/sheets-filter/lib/es/locale/vi-VN'
import shtfilterzhCN from '@univerjs/sheets-filter/lib/es/locale/zh-CN'
import shtfilterzhTW from '@univerjs/sheets-filter/lib/es/locale/zh-TW'

import shthyperlinkenUS from '@univerjs/sheets-hyper-link/lib/es/locale/en-US'
import shthyperlinkfaIR from '@univerjs/sheets-hyper-link/lib/es/locale/fa-IR'
import shthyperlinkfrFR from '@univerjs/sheets-hyper-link/lib/es/locale/fr-FR'
import shthyperlinkruRU from '@univerjs/sheets-hyper-link/lib/es/locale/ru-RU'
import shthyperlinkviVN from '@univerjs/sheets-hyper-link/lib/es/locale/vi-VN'
import shthyperlinkzhCN from '@univerjs/sheets-hyper-link/lib/es/locale/zh-CN'
import shthyperlinkzhTW from '@univerjs/sheets-hyper-link/lib/es/locale/zh-TW'

import shttableenUS from '@univerjs/sheets-table/lib/es/locale/en-US'
import shttablefaIR from '@univerjs/sheets-table/lib/es/locale/fa-IR'
import shttablefrFR from '@univerjs/sheets-table/lib/es/locale/fr-FR'
import shttableruRU from '@univerjs/sheets-table/lib/es/locale/ru-RU'
import shttableviVN from '@univerjs/sheets-table/lib/es/locale/vi-VN'
import shttablezhCN from '@univerjs/sheets-table/lib/es/locale/zh-CN'
import shttablezhTW from '@univerjs/sheets-table/lib/es/locale/zh-TW'

import sheetsformulauienUS from '@univerjs/sheets-formula-ui/lib/es/locale/en-US'
import sheetsformulauifaIR from '@univerjs/sheets-formula-ui/lib/es/locale/fa-IR'
import sheetsformulauifrFR from '@univerjs/sheets-formula-ui/lib/es/locale/fr-FR'
import sheetsformulauiruRU from '@univerjs/sheets-formula-ui/lib/es/locale/ru-RU'
import sheetsformulauiviVN from '@univerjs/sheets-formula-ui/lib/es/locale/vi-VN'
import sheetsformulauizhCN from '@univerjs/sheets-formula-ui/lib/es/locale/zh-CN'
import sheetsformulauizhTW from '@univerjs/sheets-formula-ui/lib/es/locale/zh-TW'
import sheetsformulaenUS from '@univerjs/sheets-formula/lib/es/locale/en-US'
import sheetsformulafaIR from '@univerjs/sheets-formula/lib/es/locale/fa-IR'
import sheetsformulafrFR from '@univerjs/sheets-formula/lib/es/locale/fr-FR'
import sheetsformularuRU from '@univerjs/sheets-formula/lib/es/locale/ru-RU'
import sheetsformulaviVN from '@univerjs/sheets-formula/lib/es/locale/vi-VN'
import sheetsformulazhCN from '@univerjs/sheets-formula/lib/es/locale/zh-CN'
import sheetsformulazhTW from '@univerjs/sheets-formula/lib/es/locale/zh-TW'
import sheetshyperlinkuienUS from '@univerjs/sheets-hyper-link-ui/lib/es/locale/en-US'
import sheetshyperlinkuifaIR from '@univerjs/sheets-hyper-link-ui/lib/es/locale/fa-IR'
import sheetshyperlinkuifrFR from '@univerjs/sheets-hyper-link-ui/lib/es/locale/fr-FR'
import sheetshyperlinkuiruRU from '@univerjs/sheets-hyper-link-ui/lib/es/locale/ru-RU'
import sheetshyperlinkuiviVN from '@univerjs/sheets-hyper-link-ui/lib/es/locale/vi-VN'
import sheetshyperlinkuizhCN from '@univerjs/sheets-hyper-link-ui/lib/es/locale/zh-CN'
import sheetshyperlinkuizhTW from '@univerjs/sheets-hyper-link-ui/lib/es/locale/zh-TW'
import sheetsnumfmtuienUS from '@univerjs/sheets-numfmt-ui/lib/es/locale/en-US'
import sheetsnumfmtuifaIR from '@univerjs/sheets-numfmt-ui/lib/es/locale/fa-IR'
import sheetsnumfmtuifrFR from '@univerjs/sheets-numfmt-ui/lib/es/locale/fr-FR'
import sheetsnumfmtuiruRU from '@univerjs/sheets-numfmt-ui/lib/es/locale/ru-RU'
import sheetsnumfmtuiviVN from '@univerjs/sheets-numfmt-ui/lib/es/locale/vi-VN'
import sheetsnumfmtuizhCN from '@univerjs/sheets-numfmt-ui/lib/es/locale/zh-CN'
import sheetsnumfmtuizhTW from '@univerjs/sheets-numfmt-ui/lib/es/locale/zh-TW'
import sheetssortuienUS from '@univerjs/sheets-sort-ui/lib/es/locale/en-US'
import sheetssortuifaIR from '@univerjs/sheets-sort-ui/lib/es/locale/fa-IR'
import sheetssortuifrFR from '@univerjs/sheets-sort-ui/lib/es/locale/fr-FR'
import sheetssortuiruRU from '@univerjs/sheets-sort-ui/lib/es/locale/ru-RU'
import sheetssortuiviVN from '@univerjs/sheets-sort-ui/lib/es/locale/vi-VN'
import sheetssortuizhCN from '@univerjs/sheets-sort-ui/lib/es/locale/zh-CN'
import sheetssortuizhTW from '@univerjs/sheets-sort-ui/lib/es/locale/zh-TW'
import sheetsthreadcommentuienUS from '@univerjs/sheets-thread-comment-ui/lib/es/locale/en-US'
import sheetsthreadcommentuifaIR from '@univerjs/sheets-thread-comment-ui/lib/es/locale/fa-IR'
import sheetsthreadcommentuifrFR from '@univerjs/sheets-thread-comment-ui/lib/es/locale/fr-FR'
import sheetsthreadcommentuiruRU from '@univerjs/sheets-thread-comment-ui/lib/es/locale/ru-RU'
import sheetsthreadcommentuiviVN from '@univerjs/sheets-thread-comment-ui/lib/es/locale/vi-VN'
import sheetsthreadcommentuizhCN from '@univerjs/sheets-thread-comment-ui/lib/es/locale/zh-CN'
import sheetsthreadcommentuizhTW from '@univerjs/sheets-thread-comment-ui/lib/es/locale/zh-TW'
import sheetsuienUS from '@univerjs/sheets-ui/lib/es/locale/en-US'
import sheetsuifaIR from '@univerjs/sheets-ui/lib/es/locale/fa-IR'
import sheetsuifrFR from '@univerjs/sheets-ui/lib/es/locale/fr-FR'
import sheetsuiruRU from '@univerjs/sheets-ui/lib/es/locale/ru-RU'
import sheetsuiviVN from '@univerjs/sheets-ui/lib/es/locale/vi-VN'
import sheetsuizhCN from '@univerjs/sheets-ui/lib/es/locale/zh-CN'
import sheetsuizhTW from '@univerjs/sheets-ui/lib/es/locale/zh-TW'
import sheetszeneditorenUS from '@univerjs/sheets-zen-editor/lib/es/locale/en-US'
import sheetszeneditorfaIR from '@univerjs/sheets-zen-editor/lib/es/locale/fa-IR'
import sheetszeneditorfrFR from '@univerjs/sheets-zen-editor/lib/es/locale/fr-FR'
import sheetszeneditorruRU from '@univerjs/sheets-zen-editor/lib/es/locale/ru-RU'
import sheetszeneditorviVN from '@univerjs/sheets-zen-editor/lib/es/locale/vi-VN'
import sheetszeneditorzhCN from '@univerjs/sheets-zen-editor/lib/es/locale/zh-CN'
import sheetszeneditorzhTW from '@univerjs/sheets-zen-editor/lib/es/locale/zh-TW'
import sheetsenUS from '@univerjs/sheets/lib/es/locale/en-US'
import sheetsfaIR from '@univerjs/sheets/lib/es/locale/fa-IR'
import sheetsfrFR from '@univerjs/sheets/lib/es/locale/fr-FR'
import sheetsruRU from '@univerjs/sheets/lib/es/locale/ru-RU'
import sheetsviVN from '@univerjs/sheets/lib/es/locale/vi-VN'
import sheetszhCN from '@univerjs/sheets/lib/es/locale/zh-CN'
import sheetszhTW from '@univerjs/sheets/lib/es/locale/zh-TW'
import threadcommentuienUS from '@univerjs/thread-comment-ui/lib/es/locale/en-US'
import threadcommentuifaIR from '@univerjs/thread-comment-ui/lib/es/locale/fa-IR'
import threadcommentuifrFR from '@univerjs/thread-comment-ui/lib/es/locale/fr-FR'
import threadcommentuiruRU from '@univerjs/thread-comment-ui/lib/es/locale/ru-RU'
import threadcommentuiviVN from '@univerjs/thread-comment-ui/lib/es/locale/vi-VN'
import threadcommentuizhCN from '@univerjs/thread-comment-ui/lib/es/locale/zh-CN'
import threadcommentuizhTW from '@univerjs/thread-comment-ui/lib/es/locale/zh-TW'
import uienUS from '@univerjs/ui/lib/es/locale/en-US'
import uifaIR from '@univerjs/ui/lib/es/locale/fa-IR'
import uifrFR from '@univerjs/ui/lib/es/locale/fr-FR'
import uiruRU from '@univerjs/ui/lib/es/locale/ru-RU'
import uiviVN from '@univerjs/ui/lib/es/locale/vi-VN'
import uizhCN from '@univerjs/ui/lib/es/locale/zh-CN'
import uizhTW from '@univerjs/ui/lib/es/locale/zh-TW'

export function getLanguage() {
  switch (moment.locale()) {
    case 'en':
      return LocaleType.EN_US
    case 'zh-cn':
      return LocaleType.ZH_CN
    case 'ru':
      return LocaleType.RU_RU
    case 'fr':
      return LocaleType.FR_FR
    case 'zh-tw':
      return LocaleType.ZH_TW
    case 'vi':
      return LocaleType.VI_VN
    case 'fa':
      return LocaleType.FA_IR
    default:
      return LocaleType.EN_US
  }
}

export const enUS = Tools.deepMerge(
  {},
  designenUS,
  docsuienUS,
  drawinguienUS,
  findreplaceenUS,
  sheetsenUS,
  sheetsconditionalformattinguienUS,
  sheetscrosshairhighlightenUS,
  sheetsdatavalidationuienUS,
  sheetsdrawinguienUS,
  sheetsfilteruienUS,
  sheetsformulaenUS,
  sheetsformulauienUS,
  sheetshyperlinkuienUS,
  sheetsnumfmtuienUS,
  sheetssortuienUS,
  sheetsthreadcommentuienUS,
  sheetsuienUS,
  sheetszeneditorenUS,
  threadcommentuienUS,
  uienUS,
  // v0.25.0: 新增 locale 合并
  datavalidationenUS,
  shtdatavalidationenUS,
  shtfilterenUS,
  shthyperlinkenUS,
  shttableenUS,
  embedLinkenUS,
  importExportenUS,
  outgoingLinkenUS,
  SheetsTableUIenUS,
  SheetsNoteUIenUS,
  saveenUS,
  localImageenUS,
)
export const frFR = Tools.deepMerge(
  {},
  designfrFR,
  docsuifrFR,
  drawinguifrFR,
  findreplacefrFR,
  sheetsfrFR,
  sheetsconditionalformattinguifrFR,
  sheetscrosshairhighlightfrFR,
  sheetsdatavalidationuifrFR,
  sheetsdrawinguifrFR,
  sheetsfilteruifrFR,
  sheetsformulafrFR,
  sheetsformulauifrFR,
  sheetshyperlinkuifrFR,
  sheetsnumfmtuifrFR,
  sheetssortuifrFR,
  sheetsthreadcommentuifrFR,
  sheetsuifrFR,
  sheetszeneditorfrFR,
  threadcommentuifrFR,
  uifrFR,
  // v0.25.0: 新增 locale 合并
  datavalidationfrFR,
  shtdatavalidationfrFR,
  shtfilterfrFR,
  shthyperlinkfrFR,
  shttablefrFR,
  embedLinkfrFR,
  importExportfrFR,
  outgoingLinkfrFR,
  SheetsTableUIfrFR,
  SheetsNoteUIfrFR,
  savefrFR,
  localImagefrFR,
)
export const ruRU = Tools.deepMerge(
  {},
  designruRU,
  docsuiruRU,
  drawinguiruRU,
  findreplaceruRU,
  sheetsruRU,
  sheetsconditionalformattinguiruRU,
  sheetscrosshairhighlightruRU,
  sheetsdatavalidationuiruRU,
  sheetsdrawinguiruRU,
  sheetsfilteruiruRU,
  sheetsformularuRU,
  sheetsformulauiruRU,
  sheetshyperlinkuiruRU,
  sheetsnumfmtuiruRU,
  sheetssortuiruRU,
  sheetsthreadcommentuiruRU,
  sheetsuiruRU,
  sheetszeneditorruRU,
  threadcommentuiruRU,
  uiruRU,
  // v0.25.0: 新增 locale 合并
  datavalidationruRU,
  shtdatavalidationruRU,
  shtfilterruRU,
  shthyperlinkruRU,
  shttableruRU,
  embedLinkruRU,
  importExportruRU,
  outgoingLinkruRU,
  SheetsTableUIruRU,
  SheetsNoteUIruRU,
  saveruRU,
  localImageruRU,
)
export const zhCN = Tools.deepMerge(
  {},
  designzhCN,
  docsuizhCN,
  drawinguizhCN,
  findreplacezhCN,
  sheetszhCN,
  sheetsconditionalformattinguizhCN,
  sheetscrosshairhighlightzhCN,
  sheetsdatavalidationuizhCN,
  sheetsdrawinguizhCN,
  sheetsfilteruizhCN,
  sheetsformulazhCN,
  sheetsformulauizhCN,
  sheetshyperlinkuizhCN,
  sheetsnumfmtuizhCN,
  sheetssortuizhCN,
  sheetsthreadcommentuizhCN,
  sheetsuizhCN,
  sheetszeneditorzhCN,
  threadcommentuizhCN,
  uizhCN,
  // v0.25.0: 新增 locale 合并
  datavalidationzhCN,
  shtdatavalidationzhCN,
  shtfilterzhCN,
  shthyperlinkzhCN,
  shttablezhCN,
  embedLinkzhCN,
  importExportzhCN,
  outgoingLinkzhCN,
  SheetsTableUIZhCN,
  SheetsNoteUIZhCN,
  savezhCN,
  localImagezhCN,
)
export const zhTW = Tools.deepMerge(
  {},
  designzhTW,
  docsuizhTW,
  drawinguizhTW,
  findreplacezhTW,
  sheetszhTW,
  sheetsconditionalformattinguizhTW,
  sheetscrosshairhighlightzhTW,
  sheetsdatavalidationuizhTW,
  sheetsdrawinguizhTW,
  sheetsfilteruizhTW,
  sheetsformulazhTW,
  sheetsformulauizhTW,
  sheetshyperlinkuizhTW,
  sheetsnumfmtuizhTW,
  sheetssortuizhTW,
  sheetsthreadcommentuizhTW,
  sheetsuizhTW,
  sheetszeneditorzhTW,
  threadcommentuizhTW,
  uizhTW,
  // v0.25.0: 新增 locale 合并
  datavalidationzhTW,
  shtdatavalidationzhTW,
  shtfilterzhTW,
  shthyperlinkzhTW,
  shttablezhTW,
  embedLinkzhTW,
  importExportzhTW,
  outgoingLinkzhTW,
  SheetsTableUIZhTW,
  SheetsNoteUIZhTW,
  savezhTW,
  localImagezhTW,
)
export const viVN = Tools.deepMerge(
  {},
  designviVN,
  docsuiviVN,
  drawinguiviVN,
  findreplaceviVN,
  sheetsviVN,
  sheetsconditionalformattinguiviVN,
  sheetscrosshairhighlightviVN,
  sheetsdatavalidationuiviVN,
  sheetsdrawinguiviVN,
  sheetsfilteruiviVN,
  sheetsformulaviVN,
  sheetsformulauiviVN,
  sheetshyperlinkuiviVN,
  sheetsnumfmtuiviVN,
  sheetssortuiviVN,
  sheetsthreadcommentuiviVN,
  sheetsuiviVN,
  sheetszeneditorviVN,
  threadcommentuiviVN,
  uiviVN,
  // v0.25.0: 新增 locale 合并
  datavalidationviVN,
  shtdatavalidationviVN,
  shtfilterviVN,
  shthyperlinkviVN,
  shttableviVN,
  embedLinkviVN,
  importExportviVN,
  outgoingLinkviVN,
  SheetsTableUIviVN,
  SheetsNoteUIviVN,
  saveviVN,
  localImageviVN,
)
export const faIR = Tools.deepMerge(
  {},
  designfaIR,
  docsuifaIR,
  drawinguifaIR,
  findreplacefaIR,
  sheetsfaIR,
  sheetsconditionalformattinguifaIR,
  sheetscrosshairhighlightfaIR,
  sheetsdatavalidationuifaIR,
  sheetsdrawinguifaIR,
  sheetsfilteruifaIR,
  sheetsformulafaIR,
  sheetsformulauifaIR,
  sheetshyperlinkuifaIR,
  sheetsnumfmtuifaIR,
  sheetssortuifaIR,
  sheetsthreadcommentuifaIR,
  sheetsuifaIR,
  sheetszeneditorfaIR,
  threadcommentuifaIR,
  uifaIR,
  // v0.25.0: 新增 locale 合并
  datavalidationfaIR,
  shtdatavalidationfaIR,
  shtfilterfaIR,
  shthyperlinkfaIR,
  shttablefaIR,
  embedLinkfaIR,
  importExportfaIR,
  outgoingLinkfaIR,
  SheetsTableUIfaIR,
  SheetsNoteUIfaIR,
  savefaIR,
  localImagefaIR,
)
