import 'tsconfig-paths/register'
import 'src/global/test/register.ts'
import {registerFiles} from './registerFiles'
import {runParallel} from './runParallel'
import {testRoot} from './register'
import dotenv from 'dotenv'

dotenv.config()

export async function run({
  files,
  timeout,
}: {
  files: string[],
  timeout?: number,
}) {
  try {
    testRoot.timeout = timeout
    await registerFiles(files)
    await runParallel({
      parentName: '',
      testNode  : testRoot,
    })
    process.exit(0)
  }
  catch (err) {
    console.error(err)
    process.exit(1)
  }
}
