export function loadModule<T>(_path: string): Promise<T> | T {
  if (typeof require === 'function') {
    return require(_path)
  }
  return import(_path)
}
