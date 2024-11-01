import { LogLevel, Univer, UserManagerService } from '@univerjs/core'
import { defaultTheme } from '@univerjs/design'

import { UniverDocsPlugin } from '@univerjs/docs'
import { UniverDocsUIPlugin } from '@univerjs/docs-ui'

import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverSheetsPlugin } from '@univerjs/sheets'

import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula'
import { UniverSheetsFormulaUIPlugin } from '@univerjs/sheets-formula-ui'

import { UniverSheetsNumfmtPlugin } from '@univerjs/sheets-numfmt'

import type { IUniverUIConfig } from '@univerjs/ui'

// import { UniverUniscriptPlugin } from '@univerjs/uniscript'

import { UniverFindReplacePlugin } from '@univerjs/find-replace'
import { UniverSheetsFindReplacePlugin } from '@univerjs/sheets-find-replace'

import { UniverDataValidationPlugin } from '@univerjs/data-validation'
import { UniverSheetsDataValidationPlugin } from '@univerjs/sheets-data-validation'

import { UniverDrawingPlugin } from '@univerjs/drawing'
import { UniverDrawingUIPlugin } from '@univerjs/drawing-ui'
import { UniverSheetsDrawingPlugin } from '@univerjs/sheets-drawing'
import { UniverSheetsDrawingUIPlugin } from '@univerjs/sheets-drawing-ui'

import { UniverSheetsFilterPlugin } from '@univerjs/sheets-filter'

import { UniverThreadCommentUIPlugin } from '@univerjs/thread-comment-ui'

import {
  IThreadCommentMentionDataService,
  UniverSheetsThreadCommentPlugin,
} from '@univerjs/sheets-thread-comment'

import { UniverSheetsCrosshairHighlightPlugin } from '@univerjs/sheets-crosshair-highlight'

import { UniverSheetsHyperLinkPlugin } from '@univerjs/sheets-hyper-link'
import { UniverSheetsHyperLinkUIPlugin } from '@univerjs/sheets-hyper-link-ui'

import { UniverSheetsSortPlugin } from '@univerjs/sheets-sort'
import { UniverSheetsSortUIPlugin } from '@univerjs/sheets-sort-ui'

import { UniverSheetsConditionalFormattingPlugin } from '@univerjs/sheets-conditional-formatting'

import { UniverUIPlugin } from '@univerjs/ui'
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui'
import { UniverSheetsFilterUIPlugin } from '@univerjs/sheets-filter-ui'
import { UniverSheetsConditionalFormattingUIPlugin } from '@univerjs/sheets-conditional-formatting-ui'

import { getLanguage, locales } from '../lang/locale'
import { CustomMentionDataService, mockUser } from './customMentionDataService'

export function createUniver(
  option: IUniverUIConfig,
  id: string,
) {
  const univer = new Univer({
    theme: defaultTheme,
    locale: getLanguage(),
    logLevel: LogLevel.ERROR,
    locales,
  })

  univer.registerPlugin(UniverRenderEnginePlugin)
  // if (isMobile()) {
  //   univer.registerPlugin(UniverFormulaEnginePlugin)

  //   // core plugins
  //   univer.registerPlugin(UniverDocsPlugin)
  //   univer.registerPlugin(UniverMobileUIPlugin, {
  //     container: id,
  //     header: option.header,
  //     footer: option.footer,
  //     contextMenu: true,
  //   })

  //   univer.registerPlugin(UniverDocsUIPlugin)
  //   univer.registerPlugin(UniverSheetsPlugin)

  //   univer.registerPlugin(UniverSheetsMobileUIPlugin)
  //   // 筛选
  //   univer.registerPlugin(UniverSheetsFilterPlugin)
  //   univer.registerPlugin(UniverSheetsFilterMobileUIPlugin)

  //   univer.registerPlugin(UniverSheetsNumfmtPlugin)
  //   univer.registerPlugin(UniverSheetsFormulaMobilePlugin)

  //   // find replace
  //   univer.registerPlugin(UniverSheetsFindReplacePlugin)
  //   univer.registerPlugin(UniverFindReplacePlugin)

  //   // data validation
  //   univer.registerPlugin(UniverDataValidationPlugin)
  //   univer.registerPlugin(UniverSheetsDataValidationMobilePlugin)

  //   // 浮动图片
  //   univer.registerPlugin(UniverDrawingPlugin)
  //   univer.registerPlugin(UniverDrawingUIPlugin)
  //   univer.registerPlugin(UniverSheetsDrawingPlugin)
  //   univer.registerPlugin(UniverSheetsDrawingUIPlugin)

  //   // 评论批注
  //   // univer.registerPlugin(UniverThreadCommentUIPlugin, { overrides: [[IThreadCommentMentionDataService, { useClass: CustomMentionDataService }]] })
  //   // univer.registerPlugin(UniverSheetsThreadCommentPlugin)

  //   // 超链接
  //   // univer.registerPlugin(UniverSheetsHyperLinkPlugin)
  //   // univer.registerPlugin(UniverSheetsHyperLinkUIPlugin)

  //   // 排序
  //   univer.registerPlugin(UniverSheetsSortPlugin)
  //   univer.registerPlugin(UniverSheetsSortUIPlugin)

  //   // 条件渲染
  //   univer.registerPlugin(UniverSheetsConditionalFormattingPlugin)
  //   univer.registerPlugin(UniverSheetsConditionalFormattingMobileUIPlugin)

  //   // 十字高亮
  //   // univer.registerPlugin(UniverSheetsCrosshairHighlightPlugin)
  // }
  // else {
  univer.registerPlugin(UniverUIPlugin, {
    container: id,
    header: option.header,
    footer: option.footer,
  })

  univer.registerPlugin(UniverDocsPlugin, {
    hasScroll: false,
  })
  univer.registerPlugin(UniverDocsUIPlugin)

  univer.registerPlugin(UniverSheetsPlugin)
  univer.registerPlugin(UniverSheetsUIPlugin)

  univer.registerPlugin(UniverSheetsNumfmtPlugin)
  univer.registerPlugin(UniverFormulaEnginePlugin)
  univer.registerPlugin(UniverSheetsFormulaPlugin)
  univer.registerPlugin(UniverSheetsFormulaUIPlugin)

  // find replace
  univer.registerPlugin(UniverSheetsFindReplacePlugin)
  univer.registerPlugin(UniverFindReplacePlugin)

  // data validation
  univer.registerPlugin(UniverDataValidationPlugin)
  univer.registerPlugin(UniverSheetsDataValidationPlugin)

  // 浮动图片
  univer.registerPlugin(UniverDrawingPlugin)
  univer.registerPlugin(UniverDrawingUIPlugin)
  univer.registerPlugin(UniverSheetsDrawingPlugin)
  univer.registerPlugin(UniverSheetsDrawingUIPlugin)

  // 筛选
  univer.registerPlugin(UniverSheetsFilterPlugin)
  univer.registerPlugin(UniverSheetsFilterUIPlugin)

  // 评论批注
  univer.registerPlugin(UniverThreadCommentUIPlugin, { overrides: [[IThreadCommentMentionDataService, { useClass: CustomMentionDataService }]] })
  univer.registerPlugin(UniverSheetsThreadCommentPlugin)

  // 超链接
  univer.registerPlugin(UniverSheetsHyperLinkPlugin)
  univer.registerPlugin(UniverSheetsHyperLinkUIPlugin)

  // 排序
  univer.registerPlugin(UniverSheetsSortPlugin)
  univer.registerPlugin(UniverSheetsSortUIPlugin)

  // 条件渲染
  univer.registerPlugin(UniverSheetsConditionalFormattingUIPlugin)
  univer.registerPlugin(UniverSheetsConditionalFormattingPlugin)

  // 十字高亮
  univer.registerPlugin(UniverSheetsCrosshairHighlightPlugin)
  // }

  const injector = univer.__getInjector()
  const userManagerService = injector.get(UserManagerService)
  userManagerService.setCurrentUser(mockUser)

  return univer
}

function isMobile(): boolean {
  const flag = navigator.userAgent.match(
    /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i,
  )
  return flag != null
}
