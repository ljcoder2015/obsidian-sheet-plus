import type { App } from 'obsidian'
import type { AuthorizationStorage } from '@ljcoder/authorization'
import { configureAuthorizationStorage } from '@ljcoder/authorization'

/** 应用级存储的键前缀，避免与其他插件的键冲突 */
const STORAGE_KEY_PREFIX = 'smart-sheet.authorization.'

/**
 * 需要跨 vault 共享的授权键，须与 @ljcoder/authorization 内部使用的键名一致
 */
const AUTH_STORAGE_KEYS = [
  'LJ_UUID_KEY',
  'LJ_AUTHORIZATION_KEY',
  'LJ_LAST_AUTHORIZATION_CODE_KEY',
  'LJ_LICENSE_PAYLOAD_KEY',
] as const

/**
 * 把授权数据的存储切换到 Obsidian 应用级存储。
 *
 * app.loadLocalStorage 底层是全局 localStorage（键名带 appId 前缀），
 * 因此设备标识与授权凭证可跨 vault 共享；这些数据也不在 vault 目录内，
 * 复制 vault 不会带走授权名额。
 */
export function setupAuthorizationStorage(app: App): void {
  const storage: AuthorizationStorage = {
    getItem: (key) => {
      const value = app.loadLocalStorage(STORAGE_KEY_PREFIX + key)
      return typeof value === 'string' ? value : null
    },
    setItem: (key, value) => {
      app.saveLocalStorage(STORAGE_KEY_PREFIX + key, value)
    },
    removeItem: (key) => {
      app.saveLocalStorage(STORAGE_KEY_PREFIX + key, null)
    },
  }

  configureAuthorizationStorage(storage)
  migrateLegacyStorage(storage)
}

/**
 * 一次性回填旧版本的授权数据。
 * 旧版本把授权键直接写在裸 localStorage 上，这里在应用级存储缺少某个键时复制过去；
 * 不删除旧键，避免影响尚未升级的其他 vault。
 */
function migrateLegacyStorage(storage: AuthorizationStorage): void {
  for (const key of AUTH_STORAGE_KEYS) {
    if (storage.getItem(key) !== null) {
      continue
    }

    const legacyValue = readLegacyItem(key)

    if (legacyValue !== null) {
      storage.setItem(key, legacyValue)
    }
  }
}

function readLegacyItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  }
  catch {
    return null
  }
}
