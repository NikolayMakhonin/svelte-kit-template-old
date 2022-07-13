import './register'
import {globby} from 'globby'
import path from 'path'
import {loadModule} from './loadModule'

export async function loadFiles(testFilesPatterns: string[]) {
  const files = await globby(testFilesPatterns)
  files.forEach(filePath => loadModule(path.resolve(filePath)))
}
