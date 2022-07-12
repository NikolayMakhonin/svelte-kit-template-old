type TContext = {
  timeout(value: number)
}

export type TBeforeAfterFunc = () => Promise<void> | void
export type TTestFunc = () => Promise<void> | void
export type TDescribeFunc = (this: TContext) => void
export type TTest = {
  name: string,
  disabled: boolean,
  func: TTestFunc,
}

export type TTestNode = {
  name: string,
  timeout: number,
  before: TBeforeAfterFunc[],
  beforeEach: TBeforeAfterFunc[],
  tests: TTest[],
  nodes: TTestNode[],
  afterEach: TBeforeAfterFunc[],
  after: TBeforeAfterFunc[],
  disabled: boolean,
}
