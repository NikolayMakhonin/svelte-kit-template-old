import {testNumber} from './test'
import { describe, it } from 'vitest'
import {delay} from '@flemist/async-utils'

describe.concurrent('service-worker', function () {
  it('install and update', async function () {
    await delay(2000)
    console.log('test1_1: ' + testNumber)
    await delay(2000)
    console.log('test1_2: ' + testNumber)
  })
})
