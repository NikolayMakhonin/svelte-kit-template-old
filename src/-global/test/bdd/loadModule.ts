import type {Module} from 'module'

export function loadModule(_path: string): Promise<typeof Module> | typeof Module {
  // if (typeof require === 'function') {
  //   return require(_path)
  // }
  return import('file:///' + _path)
}
