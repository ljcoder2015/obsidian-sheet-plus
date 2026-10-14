import type { App, Editor } from 'obsidian'
import { MarkdownView, Menu, Notice } from 'obsidian'

import { t } from '../lang/helpers'
import type { TextRange } from './embed-format'
import { findEmbedLinks, formatPresets, lineBounds, pickEmbedLink, presetPreview, withFormat } from './embed-format'

/** The part of CodeMirror 6's EditorView used here; Obsidian's Editor does not type it. */
interface EditorView {
  dom: HTMLElement
  posAtDOM: (node: Node) => number
}

/**
 * Which link in the note was right-clicked, worked out while the click's DOM still exists:
 * its order among identical links on its line, or else its offset in the text.
 */
interface EmbedTarget {
  editor: Editor
  line?: { from: number, index: number }
  offset?: number
}

/**
 * Right-click on a formula embed in Live Preview opens a menu that sets the `{fmt:…}` suffix
 * of its link. Reading view is for reading, so there the click is left alone.
 */
export function attachFormatMenu(el: HTMLElement, app: App, currencySymbol: string) {
  el.addEventListener('contextmenu', (evt) => {
    // before the menu opens: the editor may redraw the embed once the click moves the cursor
    const target = findTarget(app, el)
    if (!target)
      return
    evt.preventDefault()
    evt.stopPropagation()

    const current = el.getAttribute('data-format') || null
    // a native menu shows plain text only, so the previews could not line up on the right
    const menu = new Menu().setUseNativeMenu(false)
    for (const preset of formatPresets(currencySymbol)) {
      if (preset === 'separator') {
        menu.addSeparator()
        continue
      }
      menu.addItem(item => item
        .setTitle(menuTitle(t(preset.key), presetPreview(preset.pattern)))
        .setChecked(current === preset.pattern)
        .onClick(() => setEmbedFormat(el, target, preset.pattern ?? undefined)))
    }
    menu.showAtMouseEvent(evt)
  })
}

/** The label, with the value formatted that way on the right, as the sheet's menu shows it. */
function menuTitle(label: string, preview: string | undefined): string | DocumentFragment {
  if (!preview)
    return label
  return createFragment((fragment) => {
    fragment.createSpan({ text: label })
    fragment.createSpan({ cls: 'lj-format-preview', text: preview })
  })
}

function findTarget(app: App, el: HTMLElement): EmbedTarget | undefined {
  const editor = livePreviewEditor(app, el)
  if (!editor)
    return undefined

  const lineEl = el.closest<HTMLElement>('.cm-line')
  const lineFrom = lineEl ? domOffset(editor, lineEl) : undefined
  if (lineEl && lineFrom !== undefined) {
    const sameEmbeds = [...lineEl.querySelectorAll<HTMLElement>('.lj-formula-embed')].filter(other => sameLink(other, el))
    return { editor, line: { from: lineFrom, index: sameEmbeds.indexOf(el) } }
  }
  return { editor, offset: domOffset(editor, el) }
}

/** Edits through the editor, so the change is undoable and the embed re-renders. */
function setEmbedFormat(el: HTMLElement, { editor, line, offset }: EmbedTarget, format: string | undefined) {
  const src = el.getAttribute('data-embed-src') ?? ''
  const alt = el.getAttribute('data-embed-alt') ?? ''
  const text = editor.getValue()

  let range: TextRange | undefined
  if (line) {
    const bounds = lineBounds(text, editor.offsetToPos(line.from).line)
    range = line.index < 0 ? undefined : findEmbedLinks(text, src, alt, bounds.from, bounds.to)[line.index]
  }
  else {
    range = pickEmbedLink(findEmbedLinks(text, src, alt), offset)
  }

  if (!range) {
    new Notice(t('FORMULA_FORMAT_NOT_FOUND'))
    return
  }
  editor.replaceRange(withFormat(text.slice(range.from, range.to), format), editor.offsetToPos(range.from), editor.offsetToPos(range.to))
}

function sameLink(a: HTMLElement, b: HTMLElement): boolean {
  return a.getAttribute('data-embed-src') === b.getAttribute('data-embed-src')
    && a.getAttribute('data-embed-alt') === b.getAttribute('data-embed-alt')
}

/** The editor showing `el`, when it is rendered in Live Preview. */
function livePreviewEditor(app: App, el: HTMLElement): Editor | undefined {
  for (const leaf of app.workspace.getLeavesOfType('markdown')) {
    const view = leaf.view
    if (view instanceof MarkdownView && view.getMode() === 'source' && editorView(view.editor)?.dom.contains(el))
      return view.editor
  }
  return undefined
}

/** Where `node` sits in the editor's text; undefined when CodeMirror cannot place it. */
function domOffset(editor: Editor, node: Node): number | undefined {
  try {
    return editorView(editor)?.posAtDOM(node)
  }
  catch {
    return undefined
  }
}

function editorView(editor: Editor): EditorView | undefined {
  return (editor as Editor & { cm?: EditorView }).cm
}
