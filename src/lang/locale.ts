import { LocaleType, Tools } from '@univerjs/core'
import { enUS as UniverDesignEnUS } from '@univerjs/design'
import { enUS as UniverDocsUIEnUS } from '@univerjs/docs-ui'
import { enUS as UniverSheetsEnUS } from '@univerjs/sheets'
import { enUS as UniverSheetsUIEnUS } from '@univerjs/sheets-ui'
import { enUS as UniverFindReplaceEnUS } from '@univerjs/find-replace'
import { enUS as UniverSheetsFormulaEnUS } from '@univerjs/sheets-formula'
import { enUS as UniverSheetsDataValidationEnUS } from '@univerjs/sheets-data-validation'
import { enUS as UniverUiEnUS } from '@univerjs/ui'

export const locales = {
  [LocaleType.EN_US]: Tools.deepMerge(
    UniverSheetsEnUS,
    UniverDocsUIEnUS,
    UniverFindReplaceEnUS,
    UniverSheetsUIEnUS,
    UniverSheetsFormulaEnUS,
    UniverSheetsDataValidationEnUS,
    UniverUiEnUS,
    UniverDesignEnUS,
  ),
}
