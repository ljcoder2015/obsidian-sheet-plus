import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'
import '@univerjs/sheets-formula/lib/index.css'
import '@univerjs/sheets-numfmt/lib/index.css'
import '@univerjs/find-replace/lib/index.css'
import '@univerjs/drawing-ui/lib/index.css'
import '@univerjs/sheets-drawing-ui/lib/index.css'
import '@univerjs/sheets-filter-ui/lib/index.css'
import '@univerjs/thread-comment-ui/lib/index.css'

import { LocaleType, LogLevel, Univer } from '@univerjs/core'
import { defaultTheme } from '@univerjs/design'
import { UniverDocsPlugin } from '@univerjs/docs'
import { UniverDocsUIPlugin } from '@univerjs/docs-ui'
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula'
import { UniverSheetsNumfmtPlugin } from '@univerjs/sheets-numfmt'
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui'
import { UniverUIPlugin } from '@univerjs/ui'
import { UniverFindReplacePlugin } from '@univerjs/find-replace'
import { UniverSheetsFindReplacePlugin } from '@univerjs/sheets-find-replace'
import { UniverDataValidationPlugin } from '@univerjs/data-validation'
import { UniverSheetsDataValidationPlugin } from '@univerjs/sheets-data-validation'

import { UniverDrawingPlugin } from '@univerjs/drawing'
import { UniverDrawingUIPlugin } from '@univerjs/drawing-ui'
import { UniverSheetsDrawingPlugin } from '@univerjs/sheets-drawing'
import { UniverSheetsDrawingUIPlugin } from '@univerjs/sheets-drawing-ui'

import { UniverSheetsFilterPlugin } from '@univerjs/sheets-filter'
import { UniverSheetsFilterUIPlugin } from '@univerjs/sheets-filter-ui'

import { UniverThreadCommentPlugin } from '@univerjs/thread-comment'
import { UniverThreadCommentUIPlugin } from '@univerjs/thread-comment-ui'

import { UniverSheetsThreadCommentBasePlugin } from '@univerjs/sheets-thread-comment-base'
import {
  IThreadCommentMentionDataService,
  UniverSheetsThreadCommentPlugin,
} from '@univerjs/sheets-thread-comment'

import { locales } from '../lang/locale'
import { CustomMentionDataService } from './customMentionDataService'

export function createUniver(
  id: string,
  locale = LocaleType.EN_US,
  header = true,
) {
  const univer = new Univer({
    theme: defaultTheme,
    locale,
    logLevel: LogLevel.VERBOSE,
    locales,
    id,
  })

  univer.registerPlugin(UniverDocsPlugin, {
    hasScroll: false,
  })
  univer.registerPlugin(UniverDocsUIPlugin)
  univer.registerPlugin(UniverRenderEnginePlugin)
  univer.registerPlugin(UniverUIPlugin, {
    container: id,
    header,
    footer: true,
  })
  univer.registerPlugin(UniverSheetsPlugin)
  univer.registerPlugin(UniverSheetsUIPlugin)

  univer.registerPlugin(UniverSheetsNumfmtPlugin)
  univer.registerPlugin(UniverFormulaEnginePlugin)
  univer.registerPlugin(UniverSheetsFormulaPlugin)

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
  univer.registerPlugin(UniverThreadCommentPlugin)
  univer.registerPlugin(UniverThreadCommentUIPlugin)

  univer.registerPlugin(UniverSheetsThreadCommentBasePlugin)
  univer.registerPlugin(UniverSheetsThreadCommentPlugin, {
    overrides: [
      [
        IThreadCommentMentionDataService,
        { useClass: CustomMentionDataService },
      ],
    ],
  })

  return univer
}

export function createUniverNotUI(id: string) {
  const univer = new Univer()

  univer.registerPlugin(UniverSheetsPlugin)
  univer.registerPlugin(UniverFormulaEnginePlugin)
  univer.registerPlugin(UniverSheetsFormulaPlugin)

  return univer
}
