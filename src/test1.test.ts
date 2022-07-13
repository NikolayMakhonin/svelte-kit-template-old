import {testNumber} from './test'
import {delay} from '@flemist/async-utils'

describe.concurrent('service-worker', function () {
  it('install and update', async function () {
    await delay(1000)
    console.log('test1_1: order 2; ' + testNumber)
    await delay(1000)
    console.log('test1_2: order 4; ' + testNumber)
  })
})
