import type {AsyncFunc, Func} from 'mocha'
import type {IRunner, ISuite, ITest} from './contracts'
import {RunnerConstants} from './contracts'
import {runFunc} from './runFunc'

export class SuiteDefault implements ISuite {
  constructor(parent: ISuite | null, title: string, skip: boolean, isRoot?: boolean) {
    this.title = title
    this.skip = skip
    this.root = isRoot || false
    this.parent = parent
  }

  readonly title: string
  readonly root: boolean
  readonly skip: boolean
  readonly suites: ISuite[] = []
  readonly tests: ITest[] = []
  private readonly _afterAll: (Func | AsyncFunc)[] = []
  private readonly _afterEach: (Func | AsyncFunc)[] = []
  private readonly _beforeAll: (Func | AsyncFunc)[] = []
  private readonly _beforeEach: (Func | AsyncFunc)[] = []
  private readonly _onlySuites: ISuite[] = []
  private readonly _onlyTests: ITest[] = []
  private _timeout: number = 2000
  readonly parent: ISuite | undefined = void 0

  file: string | undefined = void 0
  pending: boolean = false

  addSuite(suite: ISuite): this {
    this.suites.push(suite)
    return this
  }

  addTest(test: ITest): this {
    this.tests.push(test)
    return this
  }

  afterAll(fn: Func | AsyncFunc): this {
    this._afterAll.push(fn)
    return this
  }

  afterEach(fn: Func | AsyncFunc): this {
    this._afterEach.push(fn)
    return this
  }

  beforeAll(fn: Func | AsyncFunc): this {
    this._beforeAll.push(fn)
    return this
  }

  beforeEach(fn: Func | AsyncFunc): this {
    this._beforeEach.push(fn)
    return this
  }

  fullTitle(): string {
    return this.titlePath().join(' ')
  }

  isPending(): boolean {
    return this.pending || (this.parent && this.parent.isPending())
  }

  timeout(): number
  timeout(ms: number): this
  timeout(ms?: number): number | this {
    if (!arguments.length) {
      return this._timeout
    }
    this._timeout = ms
    return this
  }

  titlePath(): string[] {
    let result = []
    if (this.parent) {
      result = result.concat(this.parent.titlePath())
    }
    if (!this.root) {
      result.push(this.title)
    }
    return result
  }

  total(): number {
    return (
      this.suites.reduce((sum, suite) => {
        return sum + suite.total()
      }, 0) + this.tests.length
    )
  }

  async runTest(runner: IRunner, skip: boolean, test: ITest) {
    if (!skip) {
      skip = test.skip
    }

    runner.emit(RunnerConstants.EVENT_TEST_BEGIN, this)
    try {
      this.pending = true
      runner.emit(RunnerConstants.EVENT_TEST_PENDING, this)
      if (skip) {
        return
      }

      const startTime = Date.now()

      try {
        for (let i = 0, len = this._beforeEach.length; i < len; i++) {
          runner.emit(RunnerConstants.EVENT_HOOK_BEGIN, this)
          await runFunc(this, this._beforeEach[i])
          runner.emit(RunnerConstants.EVENT_HOOK_END, this)
        }
      }
      catch (err) {
        console.log('Error beforeEach: ' + this.fullTitle())
        runner.emit(RunnerConstants.EVENT_HOOK_END, this)
        throw err
      }

      try {
        await runFunc(test, test.fn)
      }
      catch (err) {
        console.log('Error test: ' + test.fullTitle())
        runner.emit(RunnerConstants.EVENT_TEST_FAIL, this)
        throw err
      }

      try {
        for (let i = 0, len = this._afterEach.length; i < len; i++) {
          runner.emit(RunnerConstants.EVENT_HOOK_BEGIN, this)
          await runFunc(this, this._afterEach[i])
          runner.emit(RunnerConstants.EVENT_HOOK_END, this)
        }
      }
      catch (err) {
        console.log('Error afterEach: ' + this.fullTitle())
        runner.emit(RunnerConstants.EVENT_HOOK_END, this)
        throw err
      }

      console.log(`End (${((Date.now() - startTime) / 1000).toFixed(3)} sec): ${test.fullTitle()}`)

      runner.emit(RunnerConstants.EVENT_TEST_PASS, this)
    }
    finally {
      runner.emit(RunnerConstants.EVENT_TEST_END, this)
    }
  }

  async run(runner: IRunner, skip: boolean) {
    if (!skip) {
      skip = this.skip
    }

    runner.emit(RunnerConstants.EVENT_SUITE_BEGIN, this)
    try {
      this.pending = true
      const startTime = Date.now()
      try {
        for (let i = 0, len = this._beforeAll.length; i < len; i++) {
          runner.emit(RunnerConstants.EVENT_HOOK_BEGIN, this)
          await runFunc(this, this._beforeAll[i])
          runner.emit(RunnerConstants.EVENT_HOOK_END, this)
        }
      }
      catch (err) {
        console.log('Error beforeAll: ' + this.fullTitle())
        runner.emit(RunnerConstants.EVENT_HOOK_END, this)
        throw err
      }

      await Promise.all([
        ...this.tests.map(async (test) => this.runTest(runner, skip, test)),
        ...this.suites.map(suite => suite.run(runner, skip)),
      ])

      try {
        for (let i = 0, len = this._afterAll.length; i < len; i++) {
          runner.emit(RunnerConstants.EVENT_HOOK_BEGIN, this)
          await runFunc(this, this._afterAll[i])
          runner.emit(RunnerConstants.EVENT_HOOK_END, this)
        }
      }
      catch (err) {
        console.log('Error afterAll: ' + this.fullTitle())
        runner.emit(RunnerConstants.EVENT_HOOK_END, this)
        throw err
      }
    }
    finally {
      runner.emit(RunnerConstants.EVENT_SUITE_END, this)
    }
  }
}
