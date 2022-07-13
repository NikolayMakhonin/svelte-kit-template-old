/// <reference types="@flemist/test-utils/dist/lib/register/register" />
import type {
  describe as _describe,
  it as _it,
  afterAll as _afterAll,
  afterEach as _afterEach,
  beforeAll as _beforeAll,
  beforeEach as _beforeEach,
  assert as _assert,
  chai as _chai,
  should as _should,
} from '@flemist/vitest'

declare global {
  const describe: typeof _describe
  const it: typeof _it
  const afterAll: typeof _afterAll
  const afterEach: typeof _afterEach
  const beforeAll: typeof _beforeAll
  const beforeEach: typeof _beforeEach
  const assert: typeof _assert
  const chai: typeof _chai
  const should: typeof _should
}
