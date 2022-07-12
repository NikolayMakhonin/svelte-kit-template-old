import './register'
import {globby} from 'globby'
import path from 'path'

export async function registerFiles(testFilesPatterns: string[]) {
  const files = await globby(testFilesPatterns)
  files.forEach(filePath => require(path.resolve(filePath)))
}
