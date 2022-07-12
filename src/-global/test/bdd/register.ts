import type {TBeforeAfterFunc, TDescribeFunc, TTest, TTestFunc, TTestNode} from './contracts'

function createTestNode(name: string, disabled: boolean): TTestNode {
  return {
    name,
    disabled,
    timeout   : void 0,
    before    : [],
    beforeEach: [],
    tests     : [],
    nodes     : [],
    afterEach : [],
    after     : [],
  }
}

export const testRoot = createTestNode(null, false)
global.parentTestNode = testRoot

function _describe(name: string, func: TDescribeFunc, disabled: boolean) {
  const parentTestNode = global.parentTestNode as TTestNode
  try {
    const testNode = createTestNode(name, disabled)
    parentTestNode.nodes.push(testNode)
    global.parentTestNode = testNode
    func.call({
      timeout(value: number) {
        testNode.timeout = value
      },
    })
  }
  finally {
    global.parentTestNode = parentTestNode
  }
}

function _it(name: string, func: TTestFunc, disabled: boolean) {
  const parentTestNode = global.parentTestNode as TTestNode
  const test: TTest = {
    name,
    disabled,
    func,
  }
  parentTestNode.tests.push(test)
}

function describe(name: string, func: TDescribeFunc) {
  _describe(name, func, false)
}

function it(name: string, func: TTestFunc) {
  _it(name, func, false)
}

function xdescribe(name: string, func: () => Promise<void>|void) {
  _describe(name, func, true)
}

function xit(name: string, func: () => Promise<void>|void) {
  _it(name, func, true)
}

function before(func: TBeforeAfterFunc) {
  const parentTestNode = global.parentTestNode as TTestNode
  parentTestNode.before.push(func)
}

function after(func: TBeforeAfterFunc) {
  const parentTestNode = global.parentTestNode as TTestNode
  parentTestNode.after.push(func)
}

function beforeEach(func: TBeforeAfterFunc) {
  const parentTestNode = global.parentTestNode as TTestNode
  parentTestNode.beforeEach.push(func)
}

function afterEach(func: TBeforeAfterFunc) {
  const parentTestNode = global.parentTestNode as TTestNode
  parentTestNode.afterEach.push(func)
}

(global as any).it = it
;(global as any).describe = describe
;(global as any).xdescribe = xdescribe
;(global as any).xit = xit
;(global as any).before = before
;(global as any).after = after
;(global as any).beforeEach = beforeEach
;(global as any).afterEach = afterEach
