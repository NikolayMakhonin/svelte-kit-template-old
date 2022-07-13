import type {IRunner} from './contracts'
import {RunnerConstants} from './contracts'

export class ReporterConsole {
  private _indents: number

  constructor(runner: IRunner) {
    this._indents = 0
    const stats = runner.stats

    runner
      .once(RunnerConstants.EVENT_RUN_BEGIN, () => {
        console.log('start')
      })
      .on(RunnerConstants.EVENT_SUITE_BEGIN, () => {
        this.increaseIndent()
      })
      .on(RunnerConstants.EVENT_TEST_BEGIN, test => {
        // TODO
      })
      .on(RunnerConstants.EVENT_TEST_PENDING, test => {
        // TODO
      })
      .on(RunnerConstants.EVENT_TEST_PASS, test => {
        // Test#fullTitle() returns the suite name(s)
        // prepended to the test title
        console.log(`${this.indent()}pass: ${test.fullTitle()}`)
      })
      .on(RunnerConstants.EVENT_TEST_FAIL, (test, err) => {
        console.log(
          `${this.indent()}fail: ${test.fullTitle()} - error: ${err.message}`,
        )
      })
      .on(RunnerConstants.EVENT_SUITE_END, () => {
        this.decreaseIndent()
      })
      .once(RunnerConstants.EVENT_RUN_END, () => {
        console.log(`end: ${stats.passes}/${stats.passes + stats.failures} ok`)
      })
  }

  indent() {
    return Array(this._indents).join('  ')
  }

  increaseIndent() {
    this._indents++
  }

  decreaseIndent() {
    this._indents--
  }
}
