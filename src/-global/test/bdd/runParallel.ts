import type {TTestNode} from './contracts'
import {waitTimeout} from '../helpers/waitFor'
import {useAbortController} from '@flemist/async-utils'

export async function runParallel({
  parentName,
  testNode,
}: {
  parentName: string,
  testNode: TTestNode,
}) {
  if (testNode.disabled) {
    console.log('Disabled: ' + testNode.name)
    return
  }

  const timeout = testNode.timeout
  const testNodeName = (parentName ? parentName + ' > ' : '') + (testNode.name || '')

  // if (!timeout) {
  //     console.log(`Timeout not specified (${timeout}): ${testNodeName}`)
  //     return
  // }

  if (testNode.disabled) {
    console.log('Ignore: ' + testNodeName)
    return
  }

  const startTime = Date.now()

  await useAbortController(async (abortSignal) => {
    await Promise.race([
      waitTimeout({
        timeout,
        getError() {
          return new Error(`Timeout (${timeout}): ${testNodeName || ''}`)
        },
        abortSignal,
      }),
      (async () => {
        try {
          for (let i = 0, len = testNode.before.length; i < len; i++) {
            await testNode.before[i]()
          }
        }
        catch (err) {
          console.log('Error before: ' + testNodeName)
          throw err
        }

        await Promise.all([
          ...testNode.tests.map(async (test) => {
            const testName = (testNodeName ? testNodeName + ' > ' : '') + (test.name || '')
            if (test.disabled) {
              console.log('Ignore: ' + testName)
              return
            }

            const startTime = Date.now()

            try {
              for (let i = 0, len = testNode.beforeEach.length; i < len; i++) {
                await testNode.beforeEach[i]()
              }
            }
            catch (err) {
              console.log('Error beforeEach: ' + testName)
              throw err
            }

            try {
              await test.func()
            }
            catch (err) {
              console.log('Error test: ' + testName)
              throw err
            }

            try {
              for (let i = 0, len = testNode.afterEach.length; i < len; i++) {
                await testNode.afterEach[i]()
              }
            }
            catch (err) {
              console.log('Error afterEach: ' + testName)
              throw err
            }

            console.log(`End (${((Date.now() - startTime) / 1000).toFixed(1)} sec): ${testName}`)
          }),
          ...testNode.nodes.map(node => runParallel({
            parentName: testNodeName,
            testNode  : node,
          })),
        ])

        try {
          for (let i = 0, len = testNode.after.length; i < len; i++) {
            await testNode.after[i]()
          }
        }
        catch (err) {
          console.log('Error after: ' + testNodeName)
          throw err
        }
      })(),
    ])
  })

  console.log(`End (${((Date.now() - startTime) / 1000).toFixed(1)} sec): ${testNodeName || 'All Tests'}`)
}
