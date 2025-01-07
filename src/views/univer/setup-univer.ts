import { LocaleType, LogLevel, Univer, UserManagerService } from '@univerjs/core'
import { defaultTheme } from '@univerjs/design'

import { UniverDocsPlugin } from '@univerjs/docs'
import { UniverDocsUIPlugin } from '@univerjs/docs-ui'

import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverSheetsPlugin } from '@univerjs/sheets'

import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula'
import { UniverSheetsFormulaUIPlugin } from '@univerjs/sheets-formula-ui'

import { UniverSheetsNumfmtPlugin } from '@univerjs/sheets-numfmt'
import { UniverSheetsNumfmtUIPlugin } from '@univerjs/sheets-numfmt-ui'

import type { IUniverUIConfig } from '@univerjs/ui'

import { UniverFindReplacePlugin } from '@univerjs/find-replace'
// import { UniverSheetsFindReplacePlugin } from '@univerjs/sheets-find-replace'

import { UniverDataValidationPlugin } from '@univerjs/data-validation'
import { UniverSheetsDataValidationPlugin } from '@univerjs/sheets-data-validation'

import { UniverDrawingPlugin } from '@univerjs/drawing'
import { UniverDrawingUIPlugin } from '@univerjs/drawing-ui'
import { UniverSheetsDrawingPlugin } from '@univerjs/sheets-drawing'

import { UniverSheetsFilterPlugin } from '@univerjs/sheets-filter'
import { UniverThreadCommentPlugin } from '@univerjs/thread-comment'
import { UniverThreadCommentUIPlugin } from '@univerjs/thread-comment-ui'
import { UniverSheetsThreadCommentPlugin } from '@univerjs/sheets-thread-comment'
import { UniverSheetsThreadCommentUIPlugin } from '@univerjs/sheets-thread-comment-ui'

import { UniverSheetsHyperLinkPlugin } from '@univerjs/sheets-hyper-link'

import { UniverSheetsSortPlugin } from '@univerjs/sheets-sort'

import { UniverSheetsConditionalFormattingPlugin } from '@univerjs/sheets-conditional-formatting'

import { UniverUIPlugin } from '@univerjs/ui'
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui'

import { UniverSheetsZenEditorPlugin } from '@univerjs/sheets-zen-editor'

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

import { enUS, faIR, frFR, getLanguage, ruRU, viVN, zhCN, zhTW } from '../../lang/locale'
import { mockUser } from './customMentionDataService'

const LOAD_LAZY_PLUGINS_TIMEOUT = 1_000
const LOAD_VERY_LAZY_PLUGINS_TIMEOUT = 3_000

export function createUniver(
  option: IUniverUIConfig,
  id: string,
) {
  const univer = new Univer({
    theme: defaultTheme,
    locale: getLanguage(),
    logLevel: LogLevel.ERROR,
    locales: {
      [LocaleType.ZH_CN]: zhCN,
      [LocaleType.EN_US]: enUS,
      [LocaleType.FR_FR]: frFR,
      [LocaleType.RU_RU]: ruRU,
      [LocaleType.ZH_TW]: zhTW,
      [LocaleType.VI_VN]: viVN,
      [LocaleType.FA_IR]: faIR,
    },
  })

  univer.registerPlugin(UniverRenderEnginePlugin)
  univer.registerPlugin(UniverFormulaEnginePlugin)

  univer.registerPlugin(UniverUIPlugin, {
    container: id,
    header: option.header,
    footer: option.footer,
  })

  registerDesktopPlugin(univer)

  const injector = univer.__getInjector()
  const userManagerService = injector.get(UserManagerService)
  userManagerService.setCurrentUser(mockUser)

  return univer
}

function registerDesktopPlugin(univer: Univer) {
  univer.registerPlugin(UniverDocsPlugin)
  univer.registerPlugin(UniverDocsUIPlugin)

  univer.registerPlugin(UniverSheetsPlugin)
  univer.registerPlugin(UniverSheetsUIPlugin)
  univer.registerPlugin(UniverSheetsFormulaPlugin)
  univer.registerPlugin(UniverSheetsFormulaUIPlugin)

  // 数字格式
  univer.registerPlugin(UniverSheetsNumfmtPlugin)
  univer.registerPlugin(UniverSheetsNumfmtUIPlugin)

  // find replace
  univer.registerPlugin(UniverFindReplacePlugin)
  // univer.registerPlugin(UniverSheetsFindReplacePlugin)

  // data validation
  univer.registerPlugin(UniverDataValidationPlugin)
  univer.registerPlugin(UniverSheetsDataValidationPlugin)
  // univer.registerPlugin(UniverSheetsDataValidationUIPlugin)

  // 浮动图片
  univer.registerPlugin(UniverDrawingPlugin)
  univer.registerPlugin(UniverDrawingUIPlugin)
  univer.registerPlugin(UniverSheetsDrawingPlugin)
  // univer.registerPlugin(UniverSheetsDrawingUIPlugin)

  // 筛选
  univer.registerPlugin(UniverSheetsFilterPlugin)
  // univer.registerPlugin(UniverSheetsFilterUIPlugin)

  // 评论批注
  univer.registerPlugin(UniverThreadCommentPlugin)
  univer.registerPlugin(UniverThreadCommentUIPlugin)
  univer.registerPlugin(UniverSheetsThreadCommentPlugin)
  univer.registerPlugin(UniverSheetsThreadCommentUIPlugin)

  // 超链接
  univer.registerPlugin(UniverSheetsHyperLinkPlugin)
  // univer.registerPlugin(UniverSheetsHyperLinkUIPlugin)

  // 排序
  univer.registerPlugin(UniverSheetsSortPlugin)
  // univer.registerPlugin(UniverSheetsSortUIPlugin)

  // 条件渲染
  univer.registerPlugin(UniverSheetsConditionalFormattingPlugin)
  // univer.registerPlugin(UniverSheetsConditionalFormattingUIPlugin)

  // 十字高亮
  // univer.registerPlugin(UniverSheetsCrosshairHighlightPlugin)

  // 禅编辑器
  univer.registerPlugin(UniverSheetsZenEditorPlugin)

  // 部分插件需要延迟注册
  setTimeout(() => {
    import('./lazy').then((lazy) => {
      const plugins = lazy.default()
      plugins.forEach(p => univer.registerPlugin(p[0], p[1]))
    })
  }, LOAD_LAZY_PLUGINS_TIMEOUT)

  setTimeout(() => {
    import('./very-lazy').then((lazy) => {
      const plugins = lazy.default()
      plugins.forEach(p => univer.registerPlugin(p[0], p[1]))
    })
  }, LOAD_VERY_LAZY_PLUGINS_TIMEOUT)
}
