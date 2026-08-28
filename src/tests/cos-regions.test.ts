import assert from 'node:assert/strict'
import test from 'node:test'
import { COS_REGIONS, filterCosRegions, matchCosRegion, resolveCosRegion } from '../providers/tencent/cos-regions.js'

test('g2.1 autocomplete matches 广州 / GZ / ap-guangzhou', () => {
  const gz = COS_REGIONS.find((item) => item.id === 'ap-guangzhou')
  assert.ok(gz)
  assert.equal(matchCosRegion(gz!, '广州'), true)
  assert.equal(matchCosRegion(gz!, 'GZ'), true)
  assert.equal(matchCosRegion(gz!, 'ap-guangzhou'), true)
  assert.equal(matchCosRegion(gz!, 'guangzhou'), true)
  assert.equal(matchCosRegion(gz!, '北京'), false)
  const hits = filterCosRegions('广')
  assert.equal(hits.some((item) => item.id === 'ap-guangzhou'), true)
})

test('g2.1 resolveCosRegion only accepts exact id/label/alias, not free text', () => {
  assert.equal(resolveCosRegion('ap-guangzhou')?.id, 'ap-guangzhou')
  assert.equal(resolveCosRegion('广州')?.id, 'ap-guangzhou')
  assert.equal(resolveCosRegion('GZ')?.id, 'ap-guangzhou')
  assert.equal(resolveCosRegion('广'), undefined)
  assert.equal(resolveCosRegion('not-a-region'), undefined)
  assert.equal(resolveCosRegion(''), undefined)
})
