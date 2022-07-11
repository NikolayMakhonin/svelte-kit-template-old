import {createTestPool} from '../createTestPool'
import {throwIfNotFiniteNumber} from '../throwIfNotFiniteNumber'

export const e2eTestPool = createTestPool({
  maxSize: process.env.MAX_PARALLEL
    ? throwIfNotFiniteNumber(parseInt(process.env.MAX_PARALLEL, 10))
    : 5,
})
