export type PaneTarget = 'active-pane' | 'new-pane' | 'popout-window' | 'new-tab' | 'md-properties' | 'split-right' | 'split-bottom'
export interface ModifierKeys { shiftKey: boolean, ctrlKey: boolean, metaKey: boolean, altKey: boolean }
export type KeyEvent = PointerEvent | MouseEvent | KeyboardEvent | ModifierKeys
