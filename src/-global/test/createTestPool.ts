import {ObjectPool, Pool} from '@flemist/time-limits'

export function createTestPool({
  maxSize,
}: {
  maxSize: number,
}) {
  return new ObjectPool({
    pool: new Pool(maxSize),
  })
}
