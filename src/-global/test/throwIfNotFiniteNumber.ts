export function throwIfNotFiniteNumber(value: any) {
  if (Number.isFinite(value)) {
    return value
  }
  throw new Error('Invalid number: ' + value)
}
