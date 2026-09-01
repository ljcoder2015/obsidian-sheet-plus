export function log(...args: unknown[]): void {
  if (import.meta.env.MODE !== 'development') {
    return
  }
  // Obsidian 插件规范：避免 console.log，改用 console.debug
  _log(console.debug, ...args)
}

export function warn(...args: unknown[]): void {
  if (import.meta.env.MODE !== 'development') {
    return
  }

  _log(console.warn, ...args)
}

export function error(...args: unknown[]): void {
  if (import.meta.env.MODE !== 'development') {
    return
  }

  _log(console.error, ...args)
}

function _log(method: (...args: unknown[]) => void, ...args: unknown[]) {
  const firstArg = args[0] as string | undefined
  // test() 只需匹配前缀，去掉无用捕获组
  const withTag = /^\[.*?\]/.test(firstArg || '')
  if (withTag) {
    method(`\x1B[97;104m${firstArg}\x1B[0m`, ...args.slice(1))
  }
  else {
    method(...args)
  }
}
