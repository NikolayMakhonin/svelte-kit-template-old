import {createTestPool} from '../createTestPool'
import {throwIfNotFiniteNumber} from '../throwIfNotFiniteNumber'
import {e2eState} from './global'

export const e2eTestPool = e2eState.e2eTestPool || createTestPool({
  maxSize: process.env.MAX_PARALLEL
    ? throwIfNotFiniteNumber(parseInt(process.env.MAX_PARALLEL, 10))
    : 5,
})
e2eState.e2eTestPool = e2eTestPool
