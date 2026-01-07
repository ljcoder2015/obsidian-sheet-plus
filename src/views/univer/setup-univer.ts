import '@ljcoder/charts/lib/index.css'
import '@ljcoder/sheets-outgoing-link-ui/lib/index.css'

import { IAuthzIoService, INumfmtLocaleTag, LocaleType, LogLevel, Univer, UserManagerService } from '@univerjs/core'
import { defaultTheme } from '@univerjs/design'

import { UniverDocsPlugin } from '@univerjs/docs'
import { UniverDocsUIPlugin } from '@univerjs/docs-ui'

import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverSheetsPlugin } from '@univerjs/sheets'

import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { CalculationMode, UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula'
import { UniverSheetsFormulaUIPlugin } from '@univerjs/sheets-formula-ui'

import { UniverSheetsNumfmtPlugin } from '@univerjs/sheets-numfmt'
import { UniverSheetsNumfmtUIPlugin } from '@univerjs/sheets-numfmt-ui'

import type { IUniverUIConfig } from '@univerjs/ui'

import { UniverFindReplacePlugin } from '@univerjs/find-replace'

import { UniverDataValidationPlugin } from '@univerjs/data-validation'
import { UniverSheetsDataValidationPlugin } from '@univerjs/sheets-data-validation'

import { UniverDocsDrawingPlugin } from '@univerjs/docs-drawing'
import { UniverDrawingPlugin } from '@univerjs/drawing'
import { UniverDrawingUIPlugin } from '@univerjs/drawing-ui'
import { UniverSheetsDrawingPlugin } from '@univerjs/sheets-drawing'

import { UniverSheetsFilterPlugin } from '@univerjs/sheets-filter'
import { UniverThreadCommentPlugin } from '@univerjs/thread-comment'
import { UniverThreadCommentUIPlugin } from '@univerjs/thread-comment-ui'
import { UniverSheetsThreadCommentPlugin } from '@univerjs/sheets-thread-comment'
import { UniverSheetsThreadCommentUIPlugin } from '@univerjs/sheets-thread-comment-ui'

import { UniverSheetsSortPlugin } from '@univerjs/sheets-sort'

import { UniverSheetsConditionalFormattingPlugin } from '@univerjs/sheets-conditional-formatting'

import { UniverMobileUIPlugin, UniverUIPlugin } from '@univerjs/ui'

import { AddRangeProtectionFromToolbarCommand, ChangeSheetProtectionFromSheetBarCommand, SetRangeFontFamilyCommand, UniverSheetsMobileUIPlugin, UniverSheetsUIPlugin, ViewSheetPermissionFromContextMenuCommand, ViewSheetPermissionFromSheetBarCommand } from '@univerjs/sheets-ui'

import { UniverSheetsZenEditorPlugin } from '@univerjs/sheets-zen-editor'
import { UniverSheetsHyperLinkPlugin } from '@univerjs/sheets-hyper-link'

import { UniverSheetsConditionalFormattingMobileUIPlugin, UniverSheetsConditionalFormattingUIPlugin } from '@univerjs/sheets-conditional-formatting-ui'
import { UniverSheetsDataValidationMobileUIPlugin, UniverSheetsDataValidationUIPlugin } from '@univerjs/sheets-data-validation-ui'
import { UniverSheetsFilterMobileUIPlugin, UniverSheetsFilterUIPlugin } from '@univerjs/sheets-filter-ui'

import { Platform } from 'obsidian'

import '@univerjs/sheets/facade'
import '@univerjs/ui/facade'
import '@univerjs/docs-ui/facade'
import '@univerjs/sheets-ui/facade'
import '@univerjs/sheets-data-validation/facade'
import '@univerjs/engine-formula/facade'
import '@univerjs/sheets-filter/facade'
import '@univerjs/sheets-formula/facade'
import '@univerjs/sheets-numfmt/facade'
import '@univerjs/sheets-hyper-link-ui/facade'
import '@univerjs/sheets-thread-comment/facade'
import '@univerjs/sheets-table/facade'
import '@univerjs/sheets-note/facade'

import { UniverSheetsTablePlugin } from '@univerjs/sheets-table'
import { UniverSheetsTableUIPlugin } from '@univerjs/sheets-table-ui'
import { UniverSheetsNotePlugin } from '@univerjs/sheets-note'
import { UniverSheetsNoteUIPlugin } from '@univerjs/sheets-note-ui'

import { UniverSheetsFindReplacePlugin } from '@univerjs/sheets-find-replace'
import { UniverSheetsDrawingUIPlugin } from '@univerjs/sheets-drawing-ui'
import { UniverSheetsHyperLinkUIPlugin } from '@univerjs/sheets-hyper-link-ui'
import { UniverSheetsEmbedLinkUIPlugin } from '@ljcoder/embed-link-ui'
import { UniverSheetsSortUIPlugin } from '@univerjs/sheets-sort-ui'
import { UniverSheetsCrosshairHighlightPlugin } from '@univerjs/sheets-crosshair-highlight'
import { UniverChartPlugin } from '@ljcoder/charts'
import { UniverSheetsImportExportPlugin } from '@ljcoder/import-export'
import { UniverSheetsOutgoingLinkUIPlugin } from '@ljcoder/sheets-outgoing-link-ui'
import { FUniver } from '@univerjs/core/facade'
import { enUS, faIR, frFR, getLanguage, ruRU, viVN, zhCN, zhTW } from '../../lang/locale'
import type { FontInfo } from '../../services/fontManager'
import { LJAuthzService } from './mockUserService'
import { mockUser } from './customMentionDataService'

export function createUniver(
  availableFonts: FontInfo[],
  option: IUniverUIConfig,
  container: string | HTMLElement,
  mobileRenderMode: string,
  darkMode: boolean,
  isEmbed: boolean = false,
) {
  const univer = new Univer({
    theme: defaultTheme,
    darkMode,
    locale: getLanguage(),
    logLevel: import.meta.env.MODE === 'development' ? LogLevel.VERBOSE : LogLevel.ERROR,
    locales: {
      [LocaleType.ZH_CN]: zhCN,
      [LocaleType.EN_US]: enUS,
      [LocaleType.FR_FR]: frFR,
      [LocaleType.RU_RU]: ruRU,
      [LocaleType.ZH_TW]: zhTW,
      [LocaleType.VI_VN]: viVN,
      [LocaleType.FA_IR]: faIR,
    },
    override: isEmbed ? [] : [[IAuthzIoService, { useClass: LJAuthzService }]],
  })

  const injector = univer.__getInjector()
  const userManagerService = injector.get(UserManagerService)
  userManagerService.setCurrentUser(mockUser)

  if (Platform.isPhone && mobileRenderMode === 'mobile') {
    registerMobilePlugin(univer, option, container)
  }
  else {
    registerDesktopPlugin(univer, option, container)
    // registerLazyDesktopPlugin(univer)
  }

  const univerAPI = FUniver.newAPI(univer)

  // if (Platform.isMobileApp) {
  //   // 手机端不支持自定义字体
  //   return { univerAPI, univer }
  // }

  const fonts = availableFonts.map((font: FontInfo) => ({
    value: font.name,
    label: font.name,
    isCustom: true,
  }))
  univerAPI.addFonts(fonts)

  return { univerAPI, univer }
}

function registerDesktopPlugin(univer: Univer, option: IUniverUIConfig, container: string | HTMLElement) {
  univer.registerPlugin(UniverDocsPlugin)
  univer.registerPlugin(UniverRenderEnginePlugin)

  univer.registerPlugin(UniverUIPlugin, {
    container,
    header: option.header,
    footer: option.footer,
    toolbar: option.toolbar,
    contextMenu: option.contextMenu,
    ribbonType: 'simple',
    customFontFamily: option.customFontFamily,
  })

  univer.registerPlugin(UniverDocsUIPlugin)

  univer.registerPlugin(UniverSheetsPlugin)
  univer.registerPlugin(UniverSheetsUIPlugin, {
    menu: {
      'formula-ui.operation.insert-function': {
        hidden: true,
      },
      'formula-ui.operation.more-functions': {
        hidden: true,
      },
      [AddRangeProtectionFromToolbarCommand.id]: {
        hidden: true,
      },
      [ViewSheetPermissionFromContextMenuCommand.id]: {
        hidden: true,
      },
      [ChangeSheetProtectionFromSheetBarCommand.id]: {
        hidden: true,
      },
      [ViewSheetPermissionFromSheetBarCommand.id]: {
        hidden: true,
      },
    },
  })

  // 数字格式
  univer.registerPlugin(UniverSheetsNumfmtPlugin)
  univer.registerPlugin(UniverSheetsNumfmtUIPlugin)

  // 公式
  univer.registerPlugin(UniverFormulaEnginePlugin)
  univer.registerPlugin(UniverSheetsFormulaPlugin, {
    initialFormulaComputing: CalculationMode.FORCED,
  })
  univer.registerPlugin(UniverSheetsFormulaUIPlugin)

  // find replace
  univer.registerPlugin(UniverFindReplacePlugin)
  univer.registerPlugin(UniverSheetsFindReplacePlugin)

  // data validation
  univer.registerPlugin(UniverDataValidationPlugin)
  univer.registerPlugin(UniverSheetsDataValidationPlugin)
  univer.registerPlugin(UniverSheetsDataValidationUIPlugin)

  // 浮动图片
  univer.registerPlugin(UniverDrawingPlugin)
  univer.registerPlugin(UniverDrawingUIPlugin)
  univer.registerPlugin(UniverDocsDrawingPlugin)
  univer.registerPlugin(UniverSheetsDrawingPlugin)
  univer.registerPlugin(UniverSheetsDrawingUIPlugin)

  // 筛选
  univer.registerPlugin(UniverSheetsFilterPlugin)
  univer.registerPlugin(UniverSheetsFilterUIPlugin)

  // 评论批注
  univer.registerPlugin(UniverThreadCommentPlugin)
  univer.registerPlugin(UniverThreadCommentUIPlugin)
  univer.registerPlugin(UniverSheetsThreadCommentPlugin)
  univer.registerPlugin(UniverSheetsThreadCommentUIPlugin)

  // 超链接
  univer.registerPlugin(UniverSheetsHyperLinkPlugin)
  univer.registerPlugin(UniverSheetsHyperLinkUIPlugin)

  // 嵌入链接
  univer.registerPlugin(UniverSheetsEmbedLinkUIPlugin)

  // 排序
  univer.registerPlugin(UniverSheetsSortPlugin)
  univer.registerPlugin(UniverSheetsSortUIPlugin)

  // 条件渲染
  univer.registerPlugin(UniverSheetsConditionalFormattingPlugin)
  univer.registerPlugin(UniverSheetsConditionalFormattingUIPlugin)

  // 禅编辑器
  univer.registerPlugin(UniverSheetsZenEditorPlugin)

  // 十字高亮
  univer.registerPlugin(UniverSheetsCrosshairHighlightPlugin)

  // 图表
  univer.registerPlugin(UniverChartPlugin)

  // 导入导出
  univer.registerPlugin(UniverSheetsImportExportPlugin)

  // 外链
  // univer.registerPlugin(UniverSheetsOutgoingLinkPlugin)
  univer.registerPlugin(UniverSheetsOutgoingLinkUIPlugin)

  // 表格
  univer.registerPlugin(UniverSheetsTablePlugin)
  univer.registerPlugin(UniverSheetsTableUIPlugin)

  // 批注
  univer.registerPlugin(UniverSheetsNotePlugin)
  univer.registerPlugin(UniverSheetsNoteUIPlugin)
}

function registerMobilePlugin(univer: Univer, option: IUniverUIConfig, container: string | HTMLElement) {
  // core plugins
  univer.registerPlugin(UniverDocsPlugin)
  univer.registerPlugin(UniverRenderEnginePlugin)
  univer.registerPlugin(UniverMobileUIPlugin, {
    container,
    contextMenu: false,
    header: option.header,
    footer: option.footer,
    toolbar: option.toolbar,
  })

  univer.registerPlugin(UniverDocsUIPlugin)
  univer.registerPlugin(UniverSheetsPlugin)

  univer.registerPlugin(UniverSheetsMobileUIPlugin)
  univer.registerPlugin(UniverSheetsFilterPlugin)
  univer.registerPlugin(UniverSheetsFilterMobileUIPlugin)
  univer.registerPlugin(UniverSheetsNumfmtPlugin)
  univer.registerPlugin(UniverFormulaEnginePlugin)
  univer.registerPlugin(UniverSheetsFormulaPlugin)
  univer.registerPlugin(UniverSheetsConditionalFormattingMobileUIPlugin)
  univer.registerPlugin(UniverSheetsDataValidationPlugin)
  univer.registerPlugin(UniverSheetsDataValidationMobileUIPlugin)

  // 图表
  // univer.registerPlugin(UniverChartPlugin)

  // 浮动图片
  // univer.registerPlugin(UniverDrawingPlugin)
  // univer.registerPlugin(UniverDrawingUIPlugin)
  // univer.registerPlugin(UniverDocsDrawingPlugin)
  // univer.registerPlugin(UniverSheetsDrawingPlugin)
  // univer.registerPlugin(UniverSheetsDrawingUIPlugin)

  // // 超链接
  // univer.registerPlugin(UniverSheetsHyperLinkPlugin)
  // univer.registerPlugin(UniverSheetsHyperLinkUIPlugin)

  // 评论批注
  // univer.registerPlugin(UniverThreadCommentPlugin)
  // univer.registerPlugin(UniverThreadCommentUIPlugin)
  // univer.registerPlugin(UniverSheetsThreadCommentPlugin)
  // univer.registerPlugin(UniverSheetsThreadCommentUIPlugin)
}
