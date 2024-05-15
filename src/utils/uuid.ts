export function randomString(length: number): string {
  const str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = length; i > 0; --i)
    result += str[Math.floor(Math.random() * str.length)]
  return result
}
