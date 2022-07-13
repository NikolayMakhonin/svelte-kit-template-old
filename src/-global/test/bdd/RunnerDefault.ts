import type {Stats} from 'mocha'
import type {IRunner, ISuite, ITest, RunnerEventNames, RunnerListener} from './contracts'
import EventEmitter from 'eventemitter3'

export class RunnerDefault implements IRunner {
  private readonly _eventEmitter = new EventEmitter<RunnerEventNames>()

  failures: number = 0
  started: boolean = false
  suite: ISuite = null
  test: ITest = null
  total: number = 0
  readonly stats: Stats = {
    suites  : 0,
    tests   : 0,
    passes  : 0,
    pending : 0,
    failures: 0,
    start   : void 0,
    end     : void 0,
    duration: void 0,
  }

  on(event: RunnerEventNames, listener: RunnerListener): this {
    this._eventEmitter.on(event, listener)
    return this
  }

  once(event: RunnerEventNames, listener: RunnerListener): this {
    this._eventEmitter.once(event, listener)
    return this
  }

  off(event: RunnerEventNames, listener: RunnerListener): this {
    this._eventEmitter.off(event, listener)
    return this
  }

  addListener(event: RunnerEventNames, listener: RunnerListener): this {
    return this.on(event, listener)
  }

  removeListener(event: RunnerEventNames, listener: RunnerListener): this {
    return this.off(event, listener)
  }

  emit(name: RunnerEventNames, ...rootSuite: (any)[]): boolean {
    return this._eventEmitter.emit(name, ...rootSuite)
  }
}
