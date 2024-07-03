import { moment } from 'obsidian'
import { LocaleType } from '@univerjs/core'
import { enUS, ruRU, zhCN } from 'univer:locales'

export const locales = {
  [LocaleType.ZH_CN]: zhCN,
  [LocaleType.EN_US]: enUS,
  [LocaleType.RU_RU]: ruRU,
}

export function getLanguage() {
  switch (moment.locale()) {
    case 'en':
      return LocaleType.EN_US
    case 'zh-cn':
      return LocaleType.ZH_CN
    case 'ru':
      return LocaleType.RU_RU
    default:
      return LocaleType.EN_US
  }
}
