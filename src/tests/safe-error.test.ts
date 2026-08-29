import assert from 'node:assert/strict'
import test from 'node:test'
import { COS_SAFE_ERRORS } from '../providers/tencent/products/cos.js'
import { publicErrorMessage } from '../core/safe-error.js'
import { TencentApiError } from '../providers/tencent/client.js'

test('publicErrorMessage keeps local hints and drops upstream / secrets', () => {
  assert.equal(publicErrorMessage(new Error('腾讯云 未配置 SecretId。请到设置页填写。')), '腾讯云 未配置 SecretId。请到设置页填写。')
  assert.equal(publicErrorMessage(new Error('缺少域名')), '缺少域名')
  assert.equal(publicErrorMessage(new Error('unknown method')), 'unknown method')
  assert.equal(publicErrorMessage('云厂商鉴权失败，请检查设置中的密钥'), '云厂商鉴权失败，请检查设置中的密钥')
})

test('publicErrorMessage maps vendor codes and never echoes secrets', () => {
  assert.equal(
    publicErrorMessage(new TencentApiError('SecretId is invalid', 'AuthFailure.SecretIdNotFound')),
    '云厂商鉴权失败，请检查设置中的密钥',
  )
  assert.equal(
    publicErrorMessage(new TencentApiError('account 12@foo.com has no CAM', 'UnauthorizedOperation')),
    '当前密钥没有该操作的权限',
  )
  assert.equal(publicErrorMessage(new Error('timeout 20000ms')), '云厂商请求超时')
  assert.equal(publicErrorMessage(new Error('HTTP 502')), '云厂商请求失败')
  assert.doesNotMatch(publicErrorMessage(new Error('got AKIDabcdefghijklmnop')), /AKID/)
})

test('g2.3 publicErrorMessage keeps COS rename/folder-delete local hints', () => {
  assert.equal(
    publicErrorMessage('已复制到新名称，但源对象删除失败，请手动删除源文件'),
    '已复制到新名称，但源对象删除失败，请手动删除源文件',
  )
  assert.equal(
    publicErrorMessage('已删除 1 个对象，剩余 2 个未删尽，请重试'),
    '已删除 1 个对象，剩余 2 个未删尽，请重试',
  )
  for (const message of COS_SAFE_ERRORS) {
    assert.equal(publicErrorMessage(message), message, message)
  }
})
