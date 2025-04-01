import type { WorkspaceLeaf } from 'obsidian'
import { FileView } from 'obsidian'
import type ExcelProPlugin from '../main'
import { VIEW_TYPE_EXCEL_PRO } from '../common/constants'

export class ExcelTemplateView extends FileView {
  public plugin: ExcelProPlugin

  constructor(leaf: WorkspaceLeaf, plugin: ExcelProPlugin) {
    super(leaf)
    this.plugin = plugin
  }

  onload(): void {
    super.onload()
  }

  getViewType(): string {
    return VIEW_TYPE_EXCEL_PRO
  }
}
