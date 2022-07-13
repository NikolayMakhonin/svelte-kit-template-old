import './register'
import {globby} from 'globby'
import path from 'path'
import {loadModule} from './loadModule'

export async function loadFiles(testFilesPatterns: string[]) {
  const files = await globby(testFilesPatterns.map(o => o.replace(/\\/g, '/')))
  return Promise.all(files.map(filePath => loadModule(path.resolve(filePath))))
}
