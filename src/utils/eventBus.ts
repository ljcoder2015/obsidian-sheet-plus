// eventBus.ts
import type { Emitter } from 'mitt'
import mitt from 'mitt'

// eslint-disable-next-line ts/consistent-type-definitions
export type AppEvents = {
  sheetChange: void
}

const emitter: Emitter<AppEvents> = mitt<AppEvents>()

export default emitter
