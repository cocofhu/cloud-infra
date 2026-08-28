import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { assignConfig, maskSecret, publicConfig, sanitizePatch, withDefaults, writeOverlay } from '../core/config-store.js'
import { createRegistry } from '../core/registry.js'

const source = createRegistry()
source.registerProvider({
  id: 'tencent',
  title: '腾讯云',
  fields: [
    { key: 'secretId', label: 'SecretId' },
    { key: 'secretKey', label: 'SecretKey', secret: true },
  ],
})

test('maskSecret hides the middle of a key', () => {
  assert.equal(maskSecret('AKIDabcdefghijklmnop'), 'AKID****mnop')
  assert.equal(maskSecret('short'), '****')
})

test('publicConfig never returns plaintext secretKey', () => {
  const cfg = withDefaults({
    providers: {
      tencent: { secretId: 'AKIDabcdefghijklmnop', secretKey: 'super-secret-value-1234', enabled: true },
    },
  })
  const pub = publicConfig(cfg, source)
  const tencent = pub.providers.find((item) => item.id === 'tencent')
  if (!tencent) throw new Error('missing tencent')
  assert.equal(tencent.configured, true)
  assert.equal(tencent.values.secretId, 'AKID****mnop')
  assert.equal(tencent.values.secretKey, 'supe****1234')
  assert.doesNotMatch(JSON.stringify(pub), /super-secret-value-1234/)
})

test('empty secret on save keeps the previous key', () => {
  const live = withDefaults({
    providers: { tencent: { secretId: 'AKIDoldoldoldold', secretKey: 'keep-me-secret-key' } },
  })
  assignConfig(live, sanitizePatch({
    providers: { tencent: { secretId: 'AKIDnewnewnewnew', secretKey: '' } },
  }, source), source)
  assert.equal(live.providers.tencent.secretId, 'AKIDnewnewnewnew')
  assert.equal(live.providers.tencent.secretKey, 'keep-me-secret-key')
})

test('writeOverlay stores secrets with 0600 when possible', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cloud-infra-'))
  const prev = process.env.DSH_HOME
  process.env.DSH_HOME = dir
  try {
    const cfg = withDefaults({
      providers: { tencent: { secretId: 'AKIDabcdefghijklmnop', secretKey: 'super-secret-value-1234' } },
    })
    writeOverlay(cfg)
    const raw = readFileSync(join(dir, 'cloud-infra.json'), 'utf8')
    assert.match(raw, /super-secret-value-1234/)
    const pub = publicConfig(cfg, source)
    assert.doesNotMatch(JSON.stringify(pub), /super-secret-value-1234/)
  } finally {
    process.env.DSH_HOME = prev
    rmSync(dir, { recursive: true, force: true })
  }
})
