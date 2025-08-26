export function log(...args: any[]): void {
  if (import.meta.env.MODE !== 'development') {
    return
  }
  // eslint-disable-next-line no-console
  _log(console.log, ...args)
}

function _log(method: (...args: any[]) => void, ...args: any[]) {
  const firstArg = args[0]
  // eslint-disable-next-line regexp/no-unused-capturing-group
  const withTag = /^\[(.*?)\]/.test(firstArg)
  if (withTag) {
    method(`\x1B[97;104m${firstArg}\x1B[0m`, ...args.slice(1))
  }
  else {
    method(...args)
  }
}
