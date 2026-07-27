export function log(...args: unknown[]): void {
  if (import.meta.env.MODE !== 'development') {
    return
  }
  _log(console.log, ...args)
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
  const withTag = /^\[(.*?)\]/.test(firstArg || '')
  if (withTag) {
    method(`\x1B[97;104m${firstArg}\x1B[0m`, ...args.slice(1))
  }
  else {
    method(...args)
  }
}
