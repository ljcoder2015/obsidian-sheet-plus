import { LocaleType } from '@univerjs/core'
// import { enUS as UniverDesignEnUS } from '@univerjs/design'
// import { enUS as UniverDocsUIEnUS } from '@univerjs/docs-ui'
// import { enUS as UniverSheetsEnUS } from '@univerjs/sheets'
// import { enUS as UniverSheetsUIEnUS } from '@univerjs/sheets-ui'
// import { enUS as UniverFindReplaceEnUS } from '@univerjs/find-replace'
// import { enUS as UniverSheetsFormulaEnUS } from '@univerjs/sheets-formula'
// import { enUS as UniverSheetsDataValidationEnUS } from '@univerjs/sheets-data-validation'
// import { enUS as UniverUiEnUS } from '@univerjs/ui'

// import { ruRU as UniverDesignRuRu } from '@univerjs/design'
// import { ruRU as UniverDocsUIRuRu } from '@univerjs/docs-ui'
// import { ruRU as UniverSheetsRuRu } from '@univerjs/sheets'
// import { ruRU as UniverSheetsUIRuRu } from '@univerjs/sheets-ui'
// import { ruRU as UniverFindReplaceRuRu } from '@univerjs/find-replace'
// import { ruRU as UniverSheetsFormulaRuRu } from '@univerjs/sheets-formula'
// import { ruRU as UniverSheetsDataValidationRuRu } from '@univerjs/sheets-data-validation'
// import { ruRU as UniverUiRuRu } from '@univerjs/ui'
import { enUS, ruRU } from 'univer:locales'

// export const locales = {
//   [LocaleType.EN_US]: Tools.deepMerge(
//     UniverSheetsEnUS,
//     UniverDocsUIEnUS,
//     UniverFindReplaceEnUS,
//     UniverSheetsUIEnUS,
//     UniverSheetsFormulaEnUS,
//     UniverSheetsDataValidationEnUS,
//     UniverUiEnUS,
//     UniverDesignEnUS,
//   ),
//   [LocaleType.RU_RU]: ruRU,
// }
export const locales = {
  [LocaleType.EN_US]: enUS,
  [LocaleType.RU_RU]: ruRU,
}
