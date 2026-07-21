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

import { LocaleType } from '@univerjs/core'

const rmsPrefix = /^-ms-/
const rDashAlpha = /-([a-z])/g

const alphabets = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
]

/**
 * Universal tool library
 */
export class Tools {
  static stringAt(index: number): string {
    let str = ''
    let idx = index
    while (idx >= alphabets.length) {
      idx /= alphabets.length
      idx -= 1
      str += alphabets[idx % alphabets.length]
    }
    const last = index % alphabets.length
    str += alphabets[last]
    return str
  }

  static indexAt(code: string): number {
    let ret = 0
    for (let i = 0; i < code.length - 1; i += 1) {
      const idx = code.charCodeAt(i) - 65
      const expoNet = code.length - 1 - i
      ret += alphabets.length ** expoNet + alphabets.length * idx
    }
    ret += code.charCodeAt(code.length - 1) - 65
    return ret
  }

  static deleteBlank(value?: string) {
    if (Tools.isString(value)) {
      return value.replace(/\s/g, '')
    }
    return value
  }

  static getClassName(instance: object): string {
    return instance.constructor.name
  }

  static deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
    sources.forEach(item => item && deepItem(item as Record<string, unknown>))

    function deepArray(array: unknown[], to: unknown[]) {
      array.forEach((value, key) => {
        if (Tools.isArray(value)) {
          const origin = (to[key] as unknown[] | undefined) ?? []
          to[key] = origin
          deepArray(value as unknown[], origin)
          return
        }
        if (Tools.isObject(value)) {
          const origin = (to[key] as Record<string, unknown> | undefined) ?? {}
          to[key] = origin
          deepObject(value as Record<string, unknown>, origin)
          return
        }
        to[key] = value
      })
    }

    function deepObject(object: Record<string, unknown>, to: Record<string, unknown>) {
      Object.keys(object).forEach((key) => {
        const value = object[key]
        if (Tools.isObject(value)) {
          const origin = (to[key] as Record<string, unknown> | undefined) ?? {}
          to[key] = origin
          deepObject(value as Record<string, unknown>, origin)
          return
        }
        if (Tools.isArray(value)) {
          const origin = (to[key] as unknown[] | undefined) ?? []
          to[key] = origin
          deepArray(value as unknown[], origin)
          return
        }
        to[key] = value
      })
    }

    function deepItem(item: Record<string, unknown>) {
      Object.keys(item).forEach((key) => {
        const value = item[key]
        if (Tools.isArray(value)) {
          const origin = (target[key] as unknown[] | undefined) ?? []
          ;(target as Record<string, unknown>)[key] = origin
          deepArray(value as unknown[], origin)
          return
        }
        if (Tools.isObject(value)) {
          const origin = (target[key] as Record<string, unknown> | undefined) ?? {}
          ;(target as Record<string, unknown>)[key] = origin
          deepObject(value as Record<string, unknown>, origin)
          return
        }
        ;(target as Record<string, unknown>)[key] = value
      })
    }

    return target
  }

  static numberFixed(value: number, digit: number): number {
    return Number(Number(value).toFixed(digit))
  }

  static diffValue(one: unknown, tow: unknown) {
    function diffValue(oneValue: unknown, towValue: unknown) {
      const oneType = Tools.getValueType(oneValue)
      const towType = Tools.getValueType(towValue)
      if (oneType !== towType) {
        return false
      }
      if (Tools.isArray(oneValue)) {
        return diffArrays(oneValue, towValue as unknown[])
      }
      if (Tools.isObject(oneValue)) {
        return diffObject(oneValue as Record<string, unknown>, towValue as Record<string, unknown>)
      }
      if (Tools.isDate(oneValue)) {
        return (oneValue as Date).getTime() === (towValue as Date).getTime()
      }
      if (Tools.isRegExp(oneValue)) {
        return (oneValue as unknown as RegExp).toString() === (towValue as unknown as RegExp).toString()
      }
      return oneValue === towValue
    }

    function diffArrays(oneArray: unknown[], towArray: unknown[]) {
      if (oneArray.length !== towArray.length) {
        return false
      }
      for (let i = 0, len = oneArray.length; i < len; i++) {
        const oneValue = oneArray[i]
        const towValue = towArray[i]
        if (!diffValue(oneValue, towValue)) {
          return false
        }
      }
      return true
    }

    function diffObject(oneObject: Record<string, unknown>, towObject: Record<string, unknown>) {
      const oneKeys = Object.keys(oneObject)
      const towKeys = Object.keys(towObject)
      if (oneKeys.length !== towKeys.length) {
        return false
      }
      for (const key of oneKeys) {
        if (!towKeys.includes(key)) {
          return false
        }
        const oneValue = oneObject[key]
        const towValue = towObject[key]
        if (!diffValue(oneValue, towValue)) {
          return false
        }
      }
      return true
    }

    return diffValue(one, tow)
  }

  static deepClone<T = unknown>(value: T): T {
    if (!this.isDefine(value)) {
      return value
    }
    if (this.isRegExp(value)) {
      return new RegExp(value) as T
    }
    // @ts-ignore
    if (this.isDate(value)) {
      return new Date(value) as T
    }
    if (this.isArray(value)) {
      const clone: unknown[] = []
      value.forEach((item, index) => {
        clone[index] = Tools.deepClone(item)
      })
      return clone as T
    }
    if (Tools.isObject(value)) {
      const clone: Record<string, unknown> = {}
      Object.keys(value as Record<string, unknown>).forEach((key) => {
        const item = (value as Record<string, unknown>)[key]
        clone[key] = Tools.deepClone(item)
      })
      Object.setPrototypeOf(clone, Object.getPrototypeOf(value))
      return clone as T
    }
    return value
  }

  static convertNumberFormatLocalToLocaleType(numberFormatLocal: string): LocaleType {
    switch (numberFormatLocal) {
      case 'en':
        return LocaleType.EN_US
      case 'zh-cn':
        return LocaleType.ZH_CN
      case 'ru':
        return LocaleType.RU_RU
      case 'fr':
        return LocaleType.FR_FR
      case 'zh-tw':
        return LocaleType.ZH_TW
      case 'vi':
        return LocaleType.VI_VN
      case 'fa':
        return LocaleType.FA_IR
      default:
        return LocaleType.EN_US
    }
  }

  static getValueType(value: unknown): string {
    return Object.prototype.toString.apply(value)
  }

  static isDefine<T>(value?: T | void): value is T {
    return value !== undefined && value !== null
  }

  static isBlank(value: unknown): boolean {
    if (!this.isDefine(value)) {
      return true
    }
    if (this.isString(value)) {
      return value.trim() === ''
    }
    return false
  }

  static isBoolean(value?: unknown): value is boolean {
    return this.getValueType(value) === '[object Boolean]'
  }

  static isPlainObject(value: unknown): value is object {
    if (!this.isDefine(value)) {
      return false
    }
    return Object.getPrototypeOf(value) === Object.getPrototypeOf({})
  }

  static isFunction(value?: unknown): value is boolean {
    return this.getValueType(value) === '[object Function]'
  }

  static isDate(value?: unknown): value is Date {
    return this.getValueType(value) === '[object Date]'
  }

  static isRegExp(value?: unknown): value is RegExp {
    return this.getValueType(value) === '[object RegExp]'
  }

  static isArray<T>(value?: unknown): value is T[] {
    return this.getValueType(value) === '[object Array]'
  }

  static isString(value?: unknown): value is string {
    return this.getValueType(value) === '[object String]'
  }

  static isNumber(value?: unknown): value is number {
    return this.getValueType(value) === '[object Number]'
  }

  static isStringNumber(value?: unknown): boolean {
    return !Number.isNaN(Number.parseFloat(value as string)) && Number.isFinite(value)
  }

  static isObject<T>(value?: unknown): value is T {
    return this.getValueType(value) === '[object Object]'
  }

  static isEmptyObject(value?: unknown): boolean {
    // eslint-disable-next-line no-unreachable-loop -- for...in exits immediately to check if object has keys
    for (const _key in value as Record<string, unknown>) {
      return false
    }
    return true
  }

  static isMobile(): boolean {
    let clientWidth = 0
    let clientHeight = 0
    if (activeDocument.body.clientWidth) {
      clientWidth = activeDocument.body.clientWidth
    }
    if (activeDocument.body.clientHeight) {
      clientHeight = activeDocument.body.clientHeight
    }
    return this.isAndroid() || this.isIPhone() || this.isTablet() || (clientWidth < 350 && clientHeight < 500)
  }

  static isTablet(): boolean {
    // eslint-disable-next-line regexp/no-dupe-disjunctions
    return /ipad|android|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i.test(navigator.userAgent.toLowerCase())
  }

  static isAndroid(): boolean {
    const userAgent = navigator.userAgent
    return userAgent.includes('Android') || userAgent.includes('Linux')
  }

  static isIPhone(): boolean {
    return /iPhone/i.test(navigator.userAgent)
  }

  static hasLength(target: IArguments | unknown[] | string, length?: number): boolean {
    if (Tools.isDefine(target)) {
      if (Tools.isDefine(length)) {
        return target.length === length
      }
      return target.length > 0
    }
    return false
  }

  static capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  // Used by camelCase as callback to replace()
  static fCamelCase(_all: unknown, letter: string) {
    return letter.toUpperCase()
  }

  // Convert dashed to camelCase; used by the css and data modules
  // Support: IE <=9 - 11, Edge 12 - 15
  // Microsoft forgot to hump their vendor prefix (#9572)
  static camelCase(str: string) {
    return str.replace(rmsPrefix, 'ms-').replace(rDashAlpha, (_all, letter) => Tools.fCamelCase(_all, letter))
  }

  /**
   * remove all null from object
   * @param obj
   * @returns
   */
  static removeNull(value: Record<string, unknown>): object {
    if (Tools.isObject(value)) {
      Object.keys(value).forEach((key) => {
        const item = value[key]
        if (item == null) {
          delete value[key]
        }
        else {
          Tools.removeNull(item as Record<string, unknown>)
        }
      })
    }
    return value
  }

  /**
   * Generate a two-dimensional array with the specified number of rows and columns, and fill in the values
   * @param rows row length
   * @param columns column length
   * @param value value to be set
   * @returns
   */
  static fillTwoDimensionalArray<T>(rows: number, columns: number, value: T): T[][] {
    // eslint-disable-next-line unicorn/no-new-array -- Array constructor with fill is the idiomatic way for 2D arrays
    return new Array(rows).fill(value).map(item => new Array(columns).fill(value))
  }

  /**
   * Generate a two-dimensional array with the specified number of rows and columns, and fill in the values
   * @param rows row length
   * @param columns column length
   * @param value value to be set
   * @returns
   */
  // static fillObjectMatrix<T>(rows: number, columns: number, value: T): IObjectMatrixPrimitiveType<T> {
  //     const matrix = new ObjectMatrix<T>();
  //     for (let r = 0; r < rows; r++) {
  //         for (let c = 0; c < columns; c++) {
  //             matrix.setValue(r, c, value);
  //         }
  //     }
  //     return matrix.getData();
  // }

  static numToWord(x: number) {
    let s = ''
    while (x > 0) {
      let m = x % 26
      m = m === 0 ? (m = 26) : m
      s = String.fromCharCode(96 + m) + s
      x = (x - m) / 26
    }
    return s.toLocaleUpperCase()
  }

  /**
   *
   * Column subscript letter to number
   *
   * @privateRemarks
   * zh: 列下标  字母转数字
   *
   * @param a - Column subscript letter,e.g.,"A1"
   * @returns Column subscript number,e.g.,0
   *
   */

  static ABCatNum(a: string): number {
    if (a == null || a.length === 0) {
      return Number.NaN
    }

    const str = a.toLowerCase().split('')
    const al = str.length
    let numOut = 0
    let charnum = 0
    for (let i = 0; i < al; i++) {
      charnum = str[i].charCodeAt(0) - 96
      numOut += charnum * 26 ** (al - i - 1)
    }
    if (numOut === 0) {
      return Number.NaN
    }
    return numOut - 1
  }

  /**
   * en: Column subscript number to letter
   *
   * zh: 列下标  数字转字母
   *
   * @param n Column subscript number,e.g.,0
   * @returns Column subscript letter,e.g.,"A1"
   */
  static chatAtABC(n: number): string {
    const ord_a = 'a'.charCodeAt(0)

    const ord_z = 'z'.charCodeAt(0)

    const len = ord_z - ord_a + 1

    let s = ''

    while (n >= 0) {
      s = String.fromCharCode((n % len) + ord_a) + s

      n = Math.floor(n / len) - 1
    }

    return s.toUpperCase()
  }

  static randSort<T>(arr: T[]) {
    for (let i = 0, len = arr.length; i < len; i++) {
      const rand = Number.parseInt((Math.random() * len).toString())
      const temp = arr[rand]
      arr[rand] = arr[i]
      arr[i] = temp
    }
    return arr
  }

  /**
   * extend two objects
   * @param originJson
   * @param extendJson
   * @returns
   */
  static commonExtend<T>(originJson: Record<string, unknown>, extendJson: Record<string, unknown>): T {
    const resultJsonObject: Record<string, unknown> = {}

    for (const attr in originJson) {
      resultJsonObject[attr] = originJson[attr]
    }

    for (const attr in extendJson) {
      // undefined is equivalent to no setting
      if (extendJson[attr] == null) {
        continue
      }
      resultJsonObject[attr] = extendJson[attr]
    }

    return resultJsonObject as unknown as T
  }

  static commonExtend1<T>(originJson: Record<string, unknown>, extendJson: Record<string, unknown>): T {
    for (const attr in originJson) {
      if (extendJson[attr] == null) {
        extendJson[attr] = originJson[attr]
      }
    }
    return extendJson as unknown as T
  }

  static arrayToObject(array: Record<string, unknown>[][]) {
    const obj: Record<string, unknown> = {}
    array.forEach((row, i) => {
      const rowObj: Record<string, unknown> = {}
      obj[i] = rowObj
      row.forEach((column, j) => {
        ;(rowObj as Record<string, unknown>)[j] = column
      })
    })
    return obj
  }

  static hasIntersectionBetweenTwoRanges(
    range1Start: number,
    range1End: number,
    range2Start: number,
    range2End: number,
  ) {
    return range1End >= range2Start && range2End >= range1Start
  }

  static isStartValidPosition(name: string): boolean {
    const startsWithLetterOrUnderscore = /^[A-Z_]/i.test(name)

    return startsWithLetterOrUnderscore
  }

  static isValidParameter(name: string): boolean {
    /**
     *Validates that the name does not contain spaces or disallowed characters
     *Assuming the set of disallowed characters includes some special characters,
     *you can modify the regex below according to the actual requirements
     */
    const containsInvalidChars = /[~!@#$%^&*()+=\-{}[\]|:;"'<>,?/ ]+/.test(name)

    const isValidLength = name.length <= 255

    return !containsInvalidChars && isValidLength
  }

  static clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
  }

  static now(): number {
    if (performance && performance.now) {
      return performance.now()
    }
    return Date.now()
  }
}

export function fragWithHTML(html: string) {
  return createFragment(frag => {
    const div = frag.createDiv()
    // 使用 DOMParser 安全解析 HTML，避免直接设置 innerHTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    while (doc.body.firstChild) {
      div.appendChild(doc.body.firstChild)
    }
  })
}

export function getTheme(el: HTMLElement): 'dark' | 'light' {
  const themedAncestor = el.closest('.theme-dark, .theme-light')
  if (themedAncestor?.classList.contains('theme-dark'))
    return 'dark'
  if (themedAncestor?.classList.contains('theme-light'))
    return 'light'

  // fallback if no themed ancestor
  if (activeDocument.body.classList.contains('theme-dark'))
    return 'dark'
  return 'light'
}
