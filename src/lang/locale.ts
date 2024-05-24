import { LocaleType, Tools } from '@univerjs/core'
import { enUS as UniverDesignEnUS, ruRU as UniverDesignRuRu } from '@univerjs/design'
import { enUS as UniverDocsUIEnUS, ruRU as UniverDocsUIRuRu } from '@univerjs/docs-ui'
import { enUS as UniverSheetsEnUS, ruRU as UniverSheetsRuRu } from '@univerjs/sheets'
import { enUS as UniverSheetsUIEnUS, ruRU as UniverSheetsUIRuRu } from '@univerjs/sheets-ui'
import { enUS as UniverFindReplaceEnUS, ruRU as UniverFindReplaceRuRu } from '@univerjs/find-replace'
import { enUS as UniverSheetsFormulaEnUS, ruRU as UniverSheetsFormulaRuRu } from '@univerjs/sheets-formula'
import { enUS as UniverSheetsDataValidationEnUS, ruRU as UniverSheetsDataValidationRuRu } from '@univerjs/sheets-data-validation'
import { enUS as UniverUiEnUS, ruRU as UniverUiRuRu } from '@univerjs/ui'

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
  [LocaleType.RU_RU]: Tools.deepMerge(
    UniverDesignRuRu,
    UniverDocsUIRuRu,
    UniverSheetsRuRu,
    UniverSheetsUIRuRu,
    UniverFindReplaceRuRu,
    UniverSheetsFormulaRuRu,
    UniverSheetsDataValidationRuRu,
    UniverUiRuRu,
  ),
}
