import type {ReporterConstructor} from 'mocha'
import {rootSuite} from './register'
import {loadFiles} from './loadFiles'
import {loadModule} from './loadModule'
import {ReporterConsole} from './ReporterConsole'
import {RunnerDefault} from './RunnerDefault'
import type {IRunner} from './contracts'
import {RunnerConstants} from './contracts'

export async function runTests({
  watch,
  timeout,
  reporterPath,
  filesGlobs,
}: {
  watch: boolean,
  timeout: number,
  reporterPath: string,
  filesGlobs: string[],
}) {
  try {
    const runner: IRunner = new RunnerDefault()
    if (reporterPath) {
      const ReporterModule = await loadModule(reporterPath)
      const Reporter: ReporterConstructor = ReporterModule.default
      new Reporter(runner as any, {
        reporter: reporterPath,
        ui      : 'bdd',
      })
    }
    else {
      new ReporterConsole(runner)
    }

    if (timeout != null) {
      rootSuite.timeout(timeout)
    }
    await loadFiles(filesGlobs)

    runner.suite = rootSuite

    runner.emit(RunnerConstants.EVENT_RUN_BEGIN, this)
    try {
      await rootSuite.run(runner, false)
    }
    finally {
      runner.emit(RunnerConstants.EVENT_RUN_END, this)
    }

    // eslint-disable-next-line node/no-process-exit
    process.exit(0)
  }
  catch (err) {
    console.error(err)
    // eslint-disable-next-line node/no-process-exit
    process.exit(1)
  }
}
