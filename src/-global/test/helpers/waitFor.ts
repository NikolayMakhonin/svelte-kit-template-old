import type {IAbortSignalFast} from '@flemist/abort-controller-fast'
import {delay, useAbortController} from '@flemist/async-utils'

export function waitTimeout({
  timeout,
  getError,
  abortSignal,
}: {
    timeout: number,
    getError: () => Error,
    abortSignal?: IAbortSignalFast,
}): Promise<void>|void {
  if (!timeout) {
    return new Promise(() => {})
    // throw new Error(`timeout == ${timeout}`)
  }
  return new Promise((resolve, reject) => {
    if (abortSignal && abortSignal.aborted) {
      resolve()
      return
    }

    const timer = setTimeout(() => {
      reject(getError())
    }, timeout)

    if (abortSignal) {
      abortSignal.subscribe(() => {
        clearTimeout(timer)
        resolve()
      })
    }
  })
}

export async function waitFor({
  description,
  timeout,
  checkInterval,
  check,
  throwCheckImmediate,
}: {
    description?: string,
    timeout: number,
    checkInterval: number,
    check: () => Promise<boolean|null|void>|boolean|null|void,
    throwCheckImmediate?: boolean,
}) {
  const endTime = Date.now() + timeout
  let lastError: Error

  function getError() {
    return lastError || new Error(`Timeout (${timeout}): ${description || ''}`)
  }

  await useAbortController(async (abortSignal) => {
    await Promise.race([
      waitTimeout({
        timeout,
        getError,
        abortSignal,
      }),
      (async () => {
        // noinspection InfiniteLoopJS
        while (true) {
          if (Date.now() > endTime) {
            throw lastError || new Error(`Timeout (${timeout}): ${description || ''}`)
          }

          let checkResult: boolean|void|null
          try {
            checkResult = await check()
          }
          catch (err) {
            if (throwCheckImmediate) {
              throw err
            }
            lastError = err
            checkResult = null
          }
          if (checkResult) {
            break
          }
          else if (checkResult != null) {
            throw lastError || new Error(`waitFor: check returned false`)
          }

          await delay(checkInterval, abortSignal)
        }
      })(),
    ])
  })
}
