import { LocaleType, Univer } from '@univerjs/core'
import { FUniver } from '@univerjs/core/facade'
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import { CalculationMode, UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula'

import '@univerjs/sheets/facade'
import '@univerjs/engine-formula/facade'
import '@univerjs/sheets-formula/facade'

/**
 * A headless Univer that can only calculate: no UI and nothing rendered.
 * FORCED initial computing recalculates every formula cell on load, so formula embeds
 * never read stale or missing cached values.
 */
export function createFormulaUniver(): { univer: Univer, univerAPI: FUniver } {
  const univer = new Univer({
    locale: LocaleType.EN_US,
    locales: { [LocaleType.EN_US]: {} },
  })

  // Nothing is rendered, but the sheet view's UI facades patch FUniver for every instance in
  // the bundle and look up the render manager when the facade is created.
  univer.registerPlugin(UniverRenderEnginePlugin)
  univer.registerPlugin(UniverSheetsPlugin)
  univer.registerPlugin(UniverFormulaEnginePlugin)
  univer.registerPlugin(UniverSheetsFormulaPlugin, {
    initialFormulaComputing: CalculationMode.FORCED,
  })

  return { univer, univerAPI: FUniver.newAPI(univer) }
}
