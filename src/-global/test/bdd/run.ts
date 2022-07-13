#!/usr/bin/env node

import {rootSuite} from './register'
import {loadFiles} from './loadFiles'
import yargs from 'yargs'
import dotenv from 'dotenv'
import {loadModule} from './loadModule'
import type {ReporterConstructor} from 'mocha'
import {ReporterConsole} from './ReporterConsole'
import {RunnerDefault} from './RunnerDefault'
import type {IRunner} from './contracts'
import {RunnerConstants} from './contracts'

dotenv.config()

export async function run() {
  try {
    const argv = await yargs(process.argv)
      .option('watch', {
        alias      : 'w',
        type       : 'boolean',
        description: 'Watch files in the current working directory for changes',
        'default'  : false,
      })
      .option('timeout', {
        alias      : 't',
        type       : 'number',
        description: 'Specify test timeout threshold (in milliseconds)',
        'default'  : 2000,
      })
      .option('reporter', {
        alias      : 'R',
        type       : 'string',
        description: 'Specify reporter to use',
      })
      .argv

    const {
      watch,
      timeout,
      reporter,
      _: [,, ...files],
    } = argv

    const runner: IRunner = new RunnerDefault()
    if (reporter) {
      const ReporterModule = await loadModule(reporter)
      const Reporter: ReporterConstructor = ReporterModule.default
      new Reporter(runner as any, {
        reporter: reporter,
        ui      : 'bdd',
      })
    }
    else {
      new ReporterConsole(runner)
    }

    if (timeout != null) {
      rootSuite.timeout(timeout)
    }
    await loadFiles(files as string[])

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

void run()
