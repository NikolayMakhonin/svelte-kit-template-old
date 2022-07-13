import type {AsyncFunc, Func} from 'mocha'
import {CustomPromise} from '@flemist/async-utils'
import type {ISuite, ITest} from './contracts'

export function runFunc(
  suiteOrTest: ITest | ISuite,
  fn: Func | AsyncFunc,
) {
  const timerPromise = new CustomPromise()

  let timer: any
  const context = {
    timeout(ms?: number) {
      if (typeof ms !== 'number') {
        return suiteOrTest.timeout()
      }

      suiteOrTest.timeout(ms)

      if (timer) {
        clearTimeout(timer)
      }

      if (ms) {
        timer = setTimeout(() => {
          timerPromise.reject(new Error('Timeout: ' + suiteOrTest.fullTitle))
        }, ms)
      }
    },
  }

  let promise: Promise<void>
  if (fn.length) {
    promise = new Promise<void>((resolve, reject) => {
      (fn as Func).call(this, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }
  promise = fn.call(this)

  return Promise.race([
    timerPromise,
    promise,
  ])
}
