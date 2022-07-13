import type {Hook, Stats, AsyncFunc, Func} from 'mocha'

type TContext = {
  timeout(value: number)
}

export type TBeforeAfterFunc = () => Promise<void> | void
export type TTestFunc = () => Promise<void> | void
export type TDescribeFunc = (this: TContext) => void

export enum RunnerConstants {
  EVENT_HOOK_BEGIN = 'hook',
  EVENT_HOOK_END = 'hook end',
  EVENT_RUN_BEGIN = 'start',
  EVENT_DELAY_BEGIN = 'waiting',
  EVENT_DELAY_END = 'ready',
  EVENT_RUN_END = 'end',
  EVENT_SUITE_BEGIN = 'suite',
  EVENT_SUITE_END = 'suite end',
  EVENT_TEST_BEGIN = 'test',
  EVENT_TEST_END = 'test end',
  EVENT_TEST_FAIL = 'fail',
  EVENT_TEST_PASS = 'pass',
  EVENT_TEST_PENDING = 'pending',
  EVENT_TEST_RETRY = 'retry',
  STATE_IDLE = 'idle',
  STATE_RUNNING = 'running',
  STATE_STOPPED = 'stopped',
}

export type RunnerEventNames = RunnerConstants
export type RunnerListener =
  ((rootSuite: ISuite) => void)
  | (() => void)
  | ((...args: any[]) => void)
  | ((suite: ISuite) => void)
  | ((test: ITest) => void)
  | ((hook: Hook) => void)
  | ((test: ITest, err: any) => void)

export interface IRunner {
  failures: number
  started: boolean
  suite: ISuite
  test: ITest
  total: number
  readonly stats: Stats

  on(event: RunnerEventNames, listener: RunnerListener): this
  once(event: RunnerEventNames, listener: RunnerListener): this
  off(event: RunnerEventNames, listener: RunnerListener): this
  addListener(event: RunnerEventNames, listener: RunnerListener): this
  removeListener(event: RunnerEventNames, listener: RunnerListener): this
  emit(name: RunnerEventNames, ...rootSuite: (any)[]): boolean
}

export enum TestConstants {
  STATE_FAILED = 'failed',
  STATE_PASSED = 'passed',
  STATE_PENDING = 'pending',
}

export interface ITest {
  title: string;
  fn: Func | AsyncFunc | undefined;
  body: string;
  async: boolean;
  sync: boolean;
  err: Error | undefined;
  duration: number | undefined;
  file: string | undefined;
  parent: ISuite | undefined;
  pending: boolean;
  state: 'failed' | 'passed' | 'pending' | undefined;
  timedOut: boolean;
  type: 'test';
  skip: boolean;
  timeout(): number;
  timeout(ms: number): this;
  timeout(ms?: number): number | this;
  isPending(): boolean;
  isFailed(): boolean;
  isPassed(): boolean;
  fullTitle(): string;
  titlePath(): string[];
  reset(): void;
}

export interface ISuite {
  title: string;
  root: boolean;
  skip: boolean;
  suites: ISuite[];
  tests: ITest[];
  file: string | undefined;
  parent: ISuite | undefined;
  pending: boolean;
  type: 'suite';
  addSuite(suite: ISuite): this;
  addTest(test: ITest): this;
  afterAll(fn: Func | AsyncFunc): this;
  afterEach(fn: Func | AsyncFunc): this;
  beforeAll(fn: Func | AsyncFunc): this;
  beforeEach(fn: Func | AsyncFunc): this;
  fullTitle(): string;
  isPending(): boolean;
  timeout(): number;
  timeout(ms: number): this;
  timeout(ms?: number): number | this;
  titlePath(): string[];
  total(): number;
  runTest(runner: IRunner, skip: boolean, test: ITest): Promise<void>;
  run(runner: IRunner, skip: boolean): Promise<void>;
}
