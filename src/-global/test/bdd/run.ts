import 'tsconfig-paths/register'
import 'src/global/test/register.ts'
import {loadFiles} from './loadFiles'
import {rootSuite} from './register'
import yargs from 'yargs'
import dotenv from 'dotenv'
import {loadModule} from './loadModule'
import type {ReporterConstructor} from 'mocha'
import {ReporterConsole} from './ReporterConsole'
import {RunnerDefault} from './RunnerDefault'
import type {IRunner} from './contracts'

dotenv.config()

export async function run({
  files,
  timeout,
}: {
  files: string[],
  timeout?: number,
}) {
  try {
    const argv = await yargs(process.argv)
      .option('reporter', {
        reporter   : 'R',
        type       : 'string',
        description: 'Specify reporter to use',
      })
      .option('watch', {
        watch      : 'w',
        type       : 'boolean',
        description: 'Watch files in the current working directory for changes',
      })
      .argv

    const runner: IRunner = new RunnerDefault()
    if (argv.reporter) {
      const Reporter = await loadModule<ReporterConstructor>(argv.reporter)
      new Reporter(runner as any, {
        reporter: argv.reporter,
        ui      : 'bdd',
      })
    }
    else {
      new ReporterConsole(runner)
    }

    if (timeout != null) {
      rootSuite.timeout(timeout)
    }
    await loadFiles(files)

    await rootSuite.run(runner, false)

    // eslint-disable-next-line node/no-process-exit
    process.exit(0)
  }
  catch (err) {
    console.error(err)
    // eslint-disable-next-line node/no-process-exit
    process.exit(1)
  }
}
