import {testNumber} from './test'
import {delay} from '@flemist/async-utils'

describe('test1', function () {
  this.timeout(10000)
  // await delay(100)
  it('test1_1', async function () {
    await delay(1000)
    console.log('test1_1: order 2; ' + testNumber)
    await delay(1000)
    console.log('test1_2: order 4; ' + testNumber)
  })

  it.skip('test1_x', async function () {
    await delay(1000)
    console.log('test1_1: order 2; ' + testNumber)
    await delay(1000)
    console.log('test1_2: order 4; ' + testNumber)
  })
})
