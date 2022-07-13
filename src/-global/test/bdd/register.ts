import type {
  ISuite, ITest,
  TBeforeAfterFunc,
  TDescribeFunc,
  TTestFunc,
} from './contracts'
import {SuiteDefault} from './SuiteDefault'
import {TestDefault} from './TestDefault'

export const rootSuite = new SuiteDefault(null, '', false, true)
global.parentSuite = rootSuite

function _describe(title: string, func: TDescribeFunc, skip: boolean) {
  const parentSuite: ISuite = global.parentSuite
  try {
    const suite = new SuiteDefault(parentSuite, title, skip)
    parentSuite.addSuite(suite)
    global.parentSuite = suite
    func.call(suite)
  }
  finally {
    global.parentSuite = parentSuite
  }
}

function _it(title: string, func: TTestFunc, skip: boolean) {
  const parentSuite: ISuite = global.parentSuite
  const test: ITest = new TestDefault(parentSuite, title, func, skip)
  parentSuite.tests.push(test)
}

function describe(title: string, func: TDescribeFunc) {
  _describe(title, func, false)
}

function it(title: string, func: TTestFunc) {
  _it(title, func, false)
}

function xdescribe(title: string, func: () => Promise<void>|void) {
  _describe(title, func, true)
}

function xit(title: string, func: () => Promise<void>|void) {
  _it(title, func, true)
}

function before(func: TBeforeAfterFunc) {
  const parentSuite: ISuite = global.parentSuite
  parentSuite.beforeAll(func)
}

function after(func: TBeforeAfterFunc) {
  const parentSuite: ISuite = global.parentSuite
  parentSuite.afterAll(func)
}

function beforeEach(func: TBeforeAfterFunc) {
  const parentSuite: ISuite = global.parentSuite
  parentSuite.beforeEach(func)
}

function afterEach(func: TBeforeAfterFunc) {
  const parentSuite: ISuite = global.parentSuite
  parentSuite.afterEach(func)
}

(global as any).it = it
;(global as any).describe = describe
;(global as any).xdescribe = xdescribe
;(global as any).xit = xit
;(global as any).before = before
;(global as any).after = after
;(global as any).beforeEach = beforeEach
;(global as any).afterEach = afterEach
