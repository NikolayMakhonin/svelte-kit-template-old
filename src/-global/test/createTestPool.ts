import {ObjectPool} from '@flemist/time-limits'

export function createTestPool({
  maxSize,
}: {
  maxSize: number,
}) {
  return new ObjectPool({
    maxSize,
  })
}
