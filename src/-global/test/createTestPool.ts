import {Pool, PoolRunner} from '@flemist/time-limits'

export function createTestPool({
  maxSize,
}: {
  maxSize: number,
}) {
  return new PoolRunner(new Pool(maxSize))
}
