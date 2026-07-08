import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { INumfmtLocaleTag, Univer } from '@univerjs/core'
import { CommandType, LifecycleStages } from '@univerjs/core'
import type { IAddOutgoingLinkCommandParams, ICancelOutgoingLinkCommandParams } from '@ljcoder/sheets-outgoing-link'
import { AddOutgoingLinkCommand, CancelOutgoingLinkCommand, OutgoingLinkCustomRangeType, SearchOutgoingLinkCommand, SearchResultOutgoingLinkCommand, SheetOutgoingLinkType } from '@ljcoder/sheets-outgoing-link'
import type { INavigationOutgoingLinkOperationParams } from '@ljcoder/sheets-outgoing-link-ui'
import { NavigationOutgoingLinkOperation } from '@ljcoder/sheets-outgoing-link-ui'
import { ScrollToRangeOperation } from '@univerjs/sheets-ui'
import { Spin } from 'antd'
import type { IReplaceSnapshotCommandParams } from '@univerjs/docs-ui'
import { ReplaceSnapshotCommand } from '@univerjs/docs-ui'
import { ExportFinishCommand, ExportStartCommand, ImportFinishCommand, ImportStartCommand } from '@ljcoder/import-export'
import { SaveCommand } from '@ljcoder/save'
import { InsertLocalCellImageOperation, InsertLocalFloatImageOperation } from '@ljcoder/local-image'
import { Modal, Platform, Setting, type TFile } from 'obsidian'
import { createUniver } from '../univer/setup-univer'
import { useEditorContext } from '../../context/editorContext'
import { randomString } from '../../utils/uuid'
import { deepClone, rangeToNumber } from '../../utils/data'
import { Tools, getTheme } from '../../utils/tools'
import { t } from '../../lang/helpers'
import { log } from '../../utils/log'
import { useUniver } from '../../context/UniverContext'
import { useSheetStore } from '../../context/SheetStoreProvider'
import { OUTGOING_LINKS_UPDATE_ACTION, SHEET_UPDATE_ACTION } from '../../services/reduce'
import type { FontInfo } from '../../services/fontManager'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico']);

function getMimeType(ext: string): string {
    const mimeMap: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        webp: 'image/webp',
        bmp: 'image/bmp',
        ico: 'image/x-icon',
    };
    return mimeMap[ext.toLowerCase()] || 'image/png';
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 400, height: 300 });
        img.src = dataUrl;
    });
}

function scaleToFit(w: number, h: number, maxW: number, maxH: number): { width: number; height: number } {
    const scale = Math.min(maxW / w, maxH / h, 1);
    return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

class VaultImageMultiPickerModal extends Modal {
    private _resolve: ((value: TFile[]) => void) | null = null;
    private _checkboxes: Map<string, boolean> = new Map();

    open(): Promise<TFile[]> {
        return new Promise((resolve) => {
            this._resolve = resolve;
            this._checkboxes.clear();
            super.open();
        });
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('vault-image-picker-modal');

        contentEl.createEl('h3', { text: t('IMAGE_PICKER_TITLE') });

        const imageFiles = this.app.vault.getFiles()
            .filter(f => IMAGE_EXTENSIONS.has(f.extension.toLowerCase()));

        if (imageFiles.length === 0) {
            contentEl.createEl('p', { text: t('IMAGE_PICKER_EMPTY'), cls: 'vault-image-picker-empty' });
            return;
        }

        const listEl = contentEl.createDiv({ cls: 'vault-image-picker-list' });

        for (const file of imageFiles) {
            const itemEl = listEl.createDiv({ cls: 'vault-image-picker-item' });
            const checkbox = itemEl.createEl('input', { type: 'checkbox', id: `img-${file.path.replace(/[^a-zA-Z0-9]/g, '-')}` });
            this._checkboxes.set(file.path, false);
            checkbox.addEventListener('change', () => {
                this._checkboxes.set(file.path, checkbox.checked);
            });

            const label = itemEl.createEl('label', { text: file.path, attr: { for: checkbox.id } });
            itemEl.addEventListener('click', (e) => {
                if (e.target === checkbox) return;
                checkbox.checked = !checkbox.checked;
                this._checkboxes.set(file.path, checkbox.checked);
            });
        }

        const buttonEl = contentEl.createDiv({ cls: 'vault-image-picker-buttons' });
        const cancelBtn = buttonEl.createEl('button', { text: t('IMAGE_PICKER_CANCEL') });
        const confirmBtn = buttonEl.createEl('button', { text: t('IMAGE_PICKER_CONFIRM'), cls: 'mod-cta' });

        confirmBtn.addEventListener('click', () => {
            const selected = imageFiles.filter(f => this._checkboxes.get(f.path));
            this.close();
            this._resolve?.(selected);
        });

        cancelBtn.addEventListener('click', () => {
            this.close();
            this._resolve?.([]);
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}

async function pickVaultImages(app: App): Promise<File[]> {
    const modal = new VaultImageMultiPickerModal(app);
    const vaultFiles = await modal.open();
    if (vaultFiles.length === 0) return [];

    const result: File[] = [];
    for (const vaultFile of vaultFiles) {
        const arrayBuffer = await app.vault.readBinary(vaultFile);
        const mimeType = getMimeType(vaultFile.extension);
        const file = new File([arrayBuffer], vaultFile.name, { type: mimeType });
        result.push(file);
    }
    return result;
}

export function SheetTab({ switchTab }: { switchTab: () => void }) {
  const { state, dispatch } = useSheetStore()
  const { univerApi, setUniverApi } = useUniver()
  const { editor, app } = useEditorContext()
  const { plugin } = editor
  const containerRef = useRef<HTMLDivElement>(null)
  const [univer, setUniver] = useState<Univer>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [spinTip, setSpinTip] = useState<string>(t('LOADING'))

  useEffect(() => {
    log('[SheetTab]', 'sheetTab 挂载')

    const options = {
      header: true,
      footer: true,
    }
    let darkMode = plugin.settings.darkModal === 'dark'
    // 检查是否在 Excalidraw 中
    const isExalidraw = document.querySelector('.excalidraw__embeddable-container') !== null
    if (isExalidraw) {
      const theme = getTheme(containerRef.current)
      darkMode = theme === 'dark'
    }

    const mobileRenderMode = plugin.settings.mobileRenderMode
    const { univerAPI, univer } = createUniver(plugin.availableFonts, options, containerRef.current, mobileRenderMode, darkMode)
    setUniverApi(univerAPI)
    setUniver(univer)

    return () => {
      log('[SheetTab]', 'sheetTab 卸载')
      // 使用 setTimeout 避免与 React 渲染周期冲突
      setTimeout(() => {
        if (univerAPI) {
          log('[SheetTab]', 'disposeUniverAPI', univerAPI)
          univerAPI.dispose()
        }
        if (univer) {
          log('[SheetTab]', 'disposeUniver', univer)
          univer.dispose()
        }
        containerRef.current = null
      }, 0)
    }
  }, [])

  const normalizeWikiLink = (link: string) => {
  // 去掉 [[ 和 ]]
    const inner = link.replace(/^\[\[|\]\]$/g, '')
    // 取最后一个路径片段
    const fileName = inner.split('/').pop() ?? inner
    // 去掉 .md
    const withoutExt = fileName.replace(/\.md$/i, '')
    return `[[${withoutExt}]]`
  }

  useEffect(() => {
    let lifeCycleDisposable: { dispose: () => void } | null = null
    let commandExecutedDisposable: { dispose: () => void } | null = null
    let beforeCommandDisposable: { dispose: () => void } | null = null
    if (univerApi) {
      const locale = Tools.convertNumberFormatLocalToLocaleType(plugin.settings.numberFormatLocal)
      if (state.sheet) {
        const newSheet = deepClone(state.sheet)
        newSheet.locale = locale
        univerApi.createWorkbook(newSheet)
      }
      else {
        univerApi.createWorkbook({ id: randomString(6), name: editor.file.path, locale })
      }
      log('[SheetTab]', 'createWorkbook', state)

      // set number format local
      const localeTag = plugin.settings.numberFormatLocal as INumfmtLocaleTag
      univerApi?.getActiveWorkbook()?.setNumfmtLocal(localeTag)

      lifeCycleDisposable = univerApi.addEvent(univerApi.Event.LifeCycleChanged, (res) => {
        if (res.stage === LifecycleStages.Rendered) {
          setLoading(false)
          switchTab()
        }
        if (res.stage === LifecycleStages.Steady) {
          if (Platform.isMobileApp && plugin.settings.mobileRenderMode !== 'mobile') {
            const fonts = plugin.availableFonts.map((font: FontInfo) => ({
              value: font.name,
              label: font.name,
              isCustom: true,
            }))
            univerApi.addFonts(fonts)
          }
        }
      })

      beforeCommandDisposable = univerApi.addEvent(univerApi.Event.BeforeCommandExecute, (res) => {
        if (res.id == CancelOutgoingLinkCommand.id) {
          const params = res.params as ICancelOutgoingLinkCommandParams
          const { row, column, unitId, subUnitId } = params
          log('[SheetTab]', 'BeforeCommandExecute CancelOutgoingLinkCommand', params)
          const worksheet = univerApi.getWorkbook(unitId)?.getSheetBySheetId(subUnitId)?.getSheet()
          if (!worksheet) {
            return
          }

          const cellData = worksheet.getCell(row, column)
          if (!cellData) {
            return
          }

          const doc = worksheet.getCellDocumentModelWithFormula(cellData, row, column)
          if (!doc?.documentModel) {
            return
          }
          const snapshot = doc.documentModel!.getSnapshot()
          const customRanges = snapshot.body?.customRanges
          if (!customRanges) {
            return
          }

          customRanges.forEach((range) => {
            if (range.rangeType === OutgoingLinkCustomRangeType) {
              const url = range.properties?.url
              if (url) {
                const normalizedUrl = normalizeWikiLink(url)
                const outgoingLinks = state.outgoingLinks || []
                outgoingLinks.remove(normalizedUrl)
                dispatch({ type: OUTGOING_LINKS_UPDATE_ACTION, payload: outgoingLinks })
              }
            }
          })

          log('[SheetTab]', 'BeforeCommandExecute CancelOutgoingLinkCommand snapshot', snapshot)
        }
        if (res.id == ReplaceSnapshotCommand.id) {
          const params = res.params as IReplaceSnapshotCommandParams
          log('[SheetTab]', 'BeforeCommandExecute ReplaceSnapshotCommand', params)
          const { snapshot } = params
          const customRanges = snapshot.body?.customRanges
          if (!customRanges) {
            return
          }

          customRanges.forEach((range) => {
            if (range.rangeType === OutgoingLinkCustomRangeType) {
              const url = range.properties?.url
              if (url) {
                const normalizedUrl = normalizeWikiLink(url)
                const outgoingLinks = state.outgoingLinks || []
                outgoingLinks.remove(normalizedUrl)
                dispatch({ type: OUTGOING_LINKS_UPDATE_ACTION, payload: outgoingLinks })
              }
            }
          })
        }
      })

      commandExecutedDisposable = univerApi.addEvent(univerApi.Event.CommandExecuted, (res) => {
        if (res.id === SaveCommand.id) {
          log('[SheetTab]', 'SaveCommandExecuted')
          editor.debounced.run()
        }
        if (res.id === SearchOutgoingLinkCommand.id) {
          const links = app?.vault.getFiles().map((file) => {
            return {
              basename: file.basename,
              extension: file.extension,
              name: file.name,
              path: file.path,
              type: SheetOutgoingLinkType.FILE,
            }
          })
          univerApi?.executeCommand(SearchResultOutgoingLinkCommand.id, { links })
        }

        if (res.id == AddOutgoingLinkCommand.id) {
          const params = res.params as IAddOutgoingLinkCommandParams
          const sourcePath = editor.file.path
          const targetPath = params.link.payload.slice(2, -2)
          const targetFile = app?.vault.getAbstractFileByPath(targetPath)
          const path = app?.metadataCache.fileToLinktext(targetFile, sourcePath, true)
          log('[SheetTab]', 'AddOutgoingLinkCommand', res.params, path)
          if (path) {
            const link = `[[${path}]]`
            const outgoingLinks = state.outgoingLinks || []
            outgoingLinks.push(link)
            dispatch({ type: OUTGOING_LINKS_UPDATE_ACTION, payload: outgoingLinks })
          }
        }

        if (res.id === NavigationOutgoingLinkOperation.id) {
          const params = res.params as INavigationOutgoingLinkOperationParams
          if (params.url.startsWith('[[')) {
            app?.workspace.openLinkText(params.url.slice(2, -2), '', 'split')
          }
        }

        // 导入添加 loading 提示
        if (res.id === ImportStartCommand.id) {
          setSpinTip(t('IMPORTING'))
          setLoading(true)
        }

        if (res.id === ImportFinishCommand.id) {
          setLoading(false)
          setSpinTip(t('LOADING'))
        }

        if (res.id === ExportStartCommand.id) {
          log('[SheetTab]', 'ExportStartCommand')
          setLoading(true)
          setSpinTip(t('EXPORTING'))
        }

        if (res.id === ExportFinishCommand.id) {
          log('[SheetTab]', 'ExportFinishCommand')
          setLoading(false)
          setSpinTip(t('EXPORTED'))
        }

        if (res.id === InsertLocalFloatImageOperation.id) {
          if (!app) return;
          pickVaultImages(app).then(async (files) => {
            if (files.length === 0) return;
            const sheet = univerApi?.getActiveWorkbook()?.getActiveSheet();
            if (!sheet) return;
            const activeRange = sheet.getActiveRange();
            if (!activeRange) return;
            let row = activeRange.getRow();
            const col = activeRange.getColumn();

            for (const file of files) {
              const dataUrl = await blobToDataUrl(file);
              const naturalSize = await getImageSize(dataUrl);
              const scaled = scaleToFit(naturalSize.width, naturalSize.height, 400, 300);
              const image = await sheet.newOverGridImage()
                .setSource(dataUrl, univerApi.Enum.ImageSourceType.BASE64)
                .setColumn(col)
                .setRow(row)
                .setWidth(scaled.width)
                .setHeight(scaled.height)
                .buildAsync();
              sheet.insertImages([image]);
              row++;
            }
          }).catch((err) => {
            console.error('[SheetTab] InsertLocalFloatImageOperation error:', err);
          });
        }

        if (res.id === InsertLocalCellImageOperation.id) {
          if (!app) return;
          pickVaultImages(app).then(async (files) => {
            if (files.length === 0) return;
            const sheet = univerApi?.getActiveWorkbook()?.getActiveSheet();
            if (!sheet) return;
            const activeRange = sheet.getActiveRange();
            if (!activeRange) return;
            let row = activeRange.getRow();
            const col = activeRange.getColumn();
            for (const file of files) {
              const range = sheet.getRange(row, col);
              await range.insertCellImageAsync(file);
              row++;
            }
          }).catch((err) => {
            console.error('[SheetTab] InsertLocalCellImageOperation error:', err);
          });
        }

        // 仅同步本地 mutation
        if (res.type !== CommandType.MUTATION || res.options?.fromCollab || res.options?.onlyLocal || res.id === 'doc.mutation.rich-text-editing') {
          return
        }

        const activeWorkbook = univerApi.getActiveWorkbook()
        if (activeWorkbook) {
          dispatch({ type: SHEET_UPDATE_ACTION, payload: activeWorkbook.save() })
        }
      })
    }

    return () => {
      log('[SheetTab]', 'univerAPi卸载监听', lifeCycleDisposable, commandExecutedDisposable)
      lifeCycleDisposable?.dispose()
      commandExecutedDisposable?.dispose()
      beforeCommandDisposable?.dispose()
      beforeCommandDisposable = null
      lifeCycleDisposable = null
      commandExecutedDisposable = null
    }
  }, [univerApi])

  // 滚动到指定区域
  const scrollToRange = useCallback(() => {
    log('[SheetTab]', 'scrollToRange subPath:', editor.subPath)
    if (editor.subPath && univerApi) {
      const array = editor.subPath.split('|')
      if (array.length !== 2) {
        return
      }
      const sheetName = array[0]
      const rangeString = array[1]
      const rangeNumber = rangeToNumber(rangeString)
      // 打开文件后的子路径，用来选中表格范围
      const activeWorkbook = univerApi.getActiveWorkbook()
      const sheet = activeWorkbook?.getSheetByName(sheetName)
      if (!sheet) {
        return
      }
      activeWorkbook?.setActiveSheet(sheet)
      // getRange(row: number, column: number, numRows: number, numColumns: number): FRange;
      const selection = sheet.getRange(rangeNumber.startRow, rangeNumber.startCol, rangeNumber.endRow - rangeNumber.startRow + 1, rangeNumber.endCol - rangeNumber.startCol + 1)
      sheet.setActiveSelection(selection)

      const GAP = 1
      univerApi.executeCommand(ScrollToRangeOperation.id, {
        range: {
          startRow: Math.max(selection.getRow() - GAP, 0),
          endRow: selection.getRow() + selection.getHeight() + GAP,
          startColumn: selection.getColumn(),
          endColumn: selection.getColumn() + selection.getWidth() + GAP,
        },
      })
    }
  }, [editor.subPath, univerApi])

  useEffect(() => {
    scrollToRange()
  }, [scrollToRange])

  return (
    <Spin spinning={loading} size="large" description={spinTip}>
      <div id="sheet-box">
        <div ref={containerRef} className="lj-univer" />
      </div>
    </Spin>
  )
}
