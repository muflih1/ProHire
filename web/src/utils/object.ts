export const hasOwnProperty = Object.prototype.hasOwnProperty

export function omit<O extends object, K extends keyof O>(object: O, keys: Array<K>): Omit<O, K> {
  const result = { ...object }
  for (const key of keys) {
    if (hasOwnProperty.call(result, key)) {
      delete result[key]
    }
  }
  return result
}