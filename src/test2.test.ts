import {testNumber} from './test'
import {delay} from '@flemist/async-utils'

describe('service-worker', function () {
  this.timeout(10000)
  // await delay(100)
  it('install and update', async function () {
    await delay(500)
    console.log('test2_1: order 1; ' + testNumber)
    await delay(1000)
    console.log('test2_2: order 3; ' + testNumber)
  })
})
