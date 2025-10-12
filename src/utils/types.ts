/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type Nullable<T> = T | null | undefined | void

/**
 * Key value object
 *
 * @ignore
 * @deprecated As it has
 */
export interface IKeyValue {
  [key: string]: any
}

/**
 * @ignore
 * @deprecated, use {@link Record} instead.
 */
export interface IKeyType<T> {
  [key: string]: T
}

export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
}

export interface AutoexportConfig {
  png: boolean // Whether to auto-export to PNG
  svg: boolean // Whether to auto-export to SVG
  excalidraw: boolean // Whether to auto-export to Excalidraw format
  theme: 'light' | 'dark' | 'both' // The theme to use for the export
}

export interface ViewSemaphores {

  // flag to prevent overwriting the changes the user makes in an embeddable view editing the back side of the drawing
  embeddableIsEditingSelf: boolean
  popoutUnload: boolean // the unloaded Excalidraw view was the last leaf in the popout window
  viewloaded: boolean // onLayoutReady in view.onload has completed.
  viewunload: boolean

  // Save is triggered by multiple threads when an Excalidraw pane is terminated
  // - by the view itself
  // - by the activeLeafChangeEventHandler change event handler
  // - by monkeypatches on detach(next)
  // This semaphore helps avoid collision of saves
  saving: boolean
  unloadFileSaving: boolean
}
