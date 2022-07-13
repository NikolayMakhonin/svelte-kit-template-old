import {testNumber} from './test'
import {delay} from '@flemist/async-utils'

describe('service-worker', function () {
  this.timeout(10000)
  // await delay(100)
  it('install and update', async function () {
    await delay(1000)
    console.log('test1_1: order 2; ' + testNumber)
    await delay(1000)
    console.log('test1_2: order 4; ' + testNumber)
  })
})
