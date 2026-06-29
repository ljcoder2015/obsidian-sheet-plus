import type { TAbstractFile, Vault } from 'obsidian'
import { Notice, TFile, TFolder, normalizePath } from 'obsidian'
import type { ExcelProSettings } from '../common/setting'

/**
 * Splits a full path including a folderpath and a filename into separate folderpath and filename components
 * @param filepath
 */

export function splitFolderAndFilename(filepath: string): {
  folderpath: string
  filename: string
  basename: string
} {
  const lastIndex = filepath.lastIndexOf('/')
  const filename = lastIndex == -1 ? filepath : filepath.substring(lastIndex + 1)
  return {
    folderpath: normalizePath(filepath.substring(0, lastIndex)),
    filename,
    basename: filename.replace(/\.[^/.]+$/, ''),
  }
}

/**
 * Generates the image filename based on the excalidraw filename
 * @param path - path to the excalidraw file
 * @param extension - extension without the preceeding "."
 * @returns
 */
export function getIMGFilename(path: string, extension: string): string {
  return `${path.substring(0, path.lastIndexOf('.'))}.${extension}`
}

/**
 * Create new file, if file already exists find first unique filename by adding a number to the end of the filename
 * @param filename
 * @param folderpath
 * @returns
 */
export function getNewUniqueFilepath(
  vault: Vault,
  filename: string,
  folderpath: string,
): string {
  let fname = normalizePath(`${folderpath}/${filename}`)
  let file: TAbstractFile | null = vault.getAbstractFileByPath(fname)
  let i = 0
  const extension = filename.endsWith('univer.md')
    ? '.univer.md'
    : filename.slice(filename.lastIndexOf('.'))
  while (file) {
    fname = normalizePath(
      `${folderpath}/${filename.slice(
        0,
        filename.lastIndexOf(extension),
      )}_${i}${extension}`,
    )
    i++
    file = vault.getAbstractFileByPath(fname)
  }
  return fname
}

export function getExcelFilename(settings: ExcelProSettings): string {
  if (settings.isBigSheet === 'true') {
    return (
      `${settings.excelFilenamePrefix
      + (settings.excelFilenameDateTime !== ''
        ? window.moment().format(settings.excelFilenameDateTime)
        : '')
      }.sheet`
    )
  }
  return (
    `${settings.excelFilenamePrefix
    + (settings.excelFilenameDateTime !== ''
      ? window.moment().format(settings.excelFilenameDateTime)
      : '')
    }.univer.md`
  )
}

/**
 * 根据文件存放模式解析目标目录
 * @param mode - 存放模式 'root'|'current'|'current-sub'|'specified'
 * @param subFolder - current-sub 模式下的子文件夹名
 * @param specifiedFolder - specified 模式下的目标路径
 * @param contextFolder - 当前文件的父文件夹路径（右键菜单触发时有值）
 */
export function resolveFolderPath(
  mode: string,
  subFolder: string,
  specifiedFolder: string,
  contextFolder?: string,
): string {
  if (contextFolder) {
    switch (mode) {
      case 'root':
        return '/'
      case 'current':
        return contextFolder
      case 'current-sub':
        return subFolder
          ? normalizePath(`${contextFolder}/${subFolder}`)
          : contextFolder
      default:
        break
    }
  }
  // 无上下文时，root 返回 /，其余回退到指定文件夹
  return mode === 'root' ? '/' : (specifiedFolder || '/')
}

/**
 * Open or create a folderpath if it does not exist
 * @param folderpath
 */
export async function checkAndCreateFolder(vault: Vault, folderpath: string) {
  folderpath = normalizePath(folderpath)
  // https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/658
  // @ts-expect-error
  const folder = vault.getAbstractFileByPathInsensitive(folderpath)
  if (folder && folder instanceof TFolder)
    return

  if (folder && folder instanceof TFile)
    new Notice(`The folder cannot be created because it already exists as a file: ${folderpath}.`)

  await vault.createFolder(folderpath)
}
